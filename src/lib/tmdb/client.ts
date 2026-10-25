import "server-only";
import { TMDB_CONFIG } from "./config";

/**
 * Custom Error Classes for TMDB Operations
 */
export class TMDBError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly endpoint: string;

  constructor(message: string, status: number, statusText: string, endpoint: string) {
    super(message);
    this.name = "TMDBError";
    this.status = status;
    this.statusText = statusText;
    this.endpoint = endpoint;
  }
}

export class TMDBConfigError extends Error {
  constructor(message: string = "TMDB API credentials are not configured.") {
    super(message);
    this.name = "TMDBConfigError";
  }
}

export class TMDBAuthError extends TMDBError {
  constructor(message: string, status: number, statusText: string, endpoint: string) {
    super(message, status, statusText, endpoint);
    this.name = "TMDBAuthError";
  }
}

export class TMDBNotFoundError extends TMDBError {
  constructor(message: string, status: number, statusText: string, endpoint: string) {
    super(message, status, statusText, endpoint);
    this.name = "TMDBNotFoundError";
  }
}

export class TMDBRateLimitError extends TMDBError {
  readonly retryAfter?: number;

  constructor(
    message: string,
    status: number,
    statusText: string,
    endpoint: string,
    retryAfter?: number
  ) {
    super(message, status, statusText, endpoint);
    this.name = "TMDBRateLimitError";
    this.retryAfter = retryAfter;
  }
}

export class TMDBTimeoutError extends Error {
  readonly endpoint: string;

  constructor(endpoint: string, timeoutMs: number) {
    super(`TMDB request to ${endpoint} timed out after ${timeoutMs}ms.`);
    this.name = "TMDBTimeoutError";
    this.endpoint = endpoint;
  }
}

export interface TMDBFetchOptions {
  params?: Record<string, string | number | boolean | undefined>;
  revalidate?: number | false;
  tags?: string[];
  timeoutMs?: number;
}

/**
 * Retrieves authentication configuration securely from the server environment.
 * Prefers TMDB_API_READ_ACCESS_TOKEN (Bearer token), with fallback to TMDB_API_KEY.
 */
function getAuthConfig(): { type: "bearer"; token: string } | { type: "key"; key: string } {
  const readAccessToken = process.env.TMDB_API_READ_ACCESS_TOKEN?.trim();
  if (readAccessToken) {
    return { type: "bearer", token: readAccessToken };
  }

  const apiKey = process.env.TMDB_API_KEY?.trim();
  if (apiKey) {
    return { type: "key", key: apiKey };
  }

  throw new TMDBConfigError(
    "TMDB API authentication is missing. Configure TMDB_API_READ_ACCESS_TOKEN or TMDB_API_KEY in .env.local."
  );
}

/**
 * Centralized, secure HTTP fetcher for TMDB API endpoints.
 * Operates strictly on the server and attaches appropriate credentials.
 */
export async function tmdbFetch<T>(
  endpoint: string,
  options: TMDBFetchOptions = {}
): Promise<T> {
  const auth = getAuthConfig();
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${TMDB_CONFIG.API_BASE_URL}${cleanEndpoint}`);

  // Attach default and custom query parameters
  url.searchParams.set("language", TMDB_CONFIG.DEFAULT_LANGUAGE);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (auth.type === "bearer") {
    headers["Authorization"] = `Bearer ${auth.token}`;
  } else {
    url.searchParams.set("api_key", auth.key);
  }

  const timeoutMs = options.timeoutMs ?? TMDB_CONFIG.DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchInit: RequestInit & { next?: { revalidate?: number | false; tags?: string[] } } = {
      method: "GET",
      headers,
      signal: controller.signal,
    };

    if (options.revalidate !== undefined || options.tags !== undefined) {
      fetchInit.next = {
        revalidate: options.revalidate,
        tags: options.tags,
      };
    }

    const response = await fetch(url.toString(), fetchInit);

    if (!response.ok) {
      let errorMessage = `TMDB API error ${response.status}: ${response.statusText}`;
      try {
        const errorJson = await response.json();
        if (errorJson && typeof errorJson.status_message === "string") {
          errorMessage = errorJson.status_message;
        }
      } catch {
        // If JSON parsing fails, use standard HTTP status message
      }

      if (response.status === 401) {
        throw new TMDBAuthError(
          "Invalid or unauthorized TMDB credentials.",
          response.status,
          response.statusText,
          cleanEndpoint
        );
      }

      if (response.status === 404) {
        throw new TMDBNotFoundError(
          `Requested TMDB resource not found: ${cleanEndpoint}`,
          response.status,
          response.statusText,
          cleanEndpoint
        );
      }

      if (response.status === 429) {
        const retryHeader = response.headers.get("Retry-After");
        const retryAfter = retryHeader ? parseInt(retryHeader, 10) : undefined;
        throw new TMDBRateLimitError(
          "TMDB API rate limit exceeded.",
          response.status,
          response.statusText,
          cleanEndpoint,
          retryAfter
        );
      }

      throw new TMDBError(errorMessage, response.status, response.statusText, cleanEndpoint);
    }

    const data: T = await response.json();
    return data;
  } catch (error: unknown) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new TMDBTimeoutError(cleanEndpoint, timeoutMs);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
