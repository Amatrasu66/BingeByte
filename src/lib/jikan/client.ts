/**
 * BingeByte — Resilient Jikan v4 HTTP Client
 * Features:
 * - Rate limiting (3 req/sec, 60 req/min) via JikanRateLimiter
 * - In-memory caching with configurable TTL
 * - In-flight request deduplication (prevents duplicate simultaneous queries)
 * - Bounded retries with backoff on HTTP 429 and transient connection resets
 * - Request timeouts (8 seconds)
 * - Safe error handling (never crashes callers)
 */

import { jikanRateLimiter } from "./rate-limiter";
import type { JikanResponse } from "./types";

export const JIKAN_BASE_URL = "https://api.jikan.moe/v4";

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class JikanClient {
  private cache = new Map<string, CacheEntry<unknown>>();
  private inFlightRequests = new Map<string, Promise<unknown>>();
  private customFetch?: typeof fetch;

  constructor(customFetch?: typeof fetch) {
    this.customFetch = customFetch;
  }

  /**
   * Clears the in-memory cache and in-flight request map.
   */
  public clearCache(): void {
    this.cache.clear();
    this.inFlightRequests.clear();
  }

  /**
   * Sets a custom fetcher (for unit test mocking).
   */
  public setCustomFetch(fetcher?: typeof fetch): void {
    this.customFetch = fetcher;
  }

  /**
   * Executes a GET request against the Jikan v4 API with caching, deduplication, and rate limiting.
   */
  public async get<T>(
    endpoint: string,
    options?: {
      params?: Record<string, string | number | boolean | undefined>;
      ttlMs?: number;
      timeoutMs?: number;
    }
  ): Promise<JikanResponse<T> | null> {
    const url = this.buildUrl(endpoint, options?.params);
    const cacheKey = url.toString();
    const ttlMs = options?.ttlMs ?? 10 * 60 * 1000; // Default 10 min TTL
    const timeoutMs = options?.timeoutMs ?? 8000;

    // 1. Check in-memory cache
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data as JikanResponse<T>;
    }

    // 2. Check in-flight request deduplication
    const inFlight = this.inFlightRequests.get(cacheKey);
    if (inFlight) {
      return (await inFlight) as JikanResponse<T> | null;
    }

    // 3. Dispatch fresh request with deduplication lock
    const fetchPromise = this.executeWithRetry<T>(url.toString(), timeoutMs);
    this.inFlightRequests.set(cacheKey, fetchPromise);

    try {
      const result = await fetchPromise;
      if (result) {
        this.cache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + ttlMs,
        });
      }
      return result;
    } finally {
      this.inFlightRequests.delete(cacheKey);
    }
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): URL {
    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    const url = new URL(`${JIKAN_BASE_URL}${cleanEndpoint}`);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url;
  }

  private async executeWithRetry<T>(
    url: string,
    timeoutMs: number
  ): Promise<JikanResponse<T> | null> {
    const maxRetries = 2;
    let attempt = 0;
    const fetcher = this.customFetch || globalThis.fetch;

    while (attempt <= maxRetries) {
      attempt++;

      // Wait for rate limiter slot
      await jikanRateLimiter.acquire();

      try {
        const response = await fetcher(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "BingeByte-Client/1.0",
          },
          signal: AbortSignal.timeout(timeoutMs),
        });

        // Handle HTTP 429 Too Many Requests
        if (response.status === 429) {
          const retryAfterHeader = response.headers.get("Retry-After");
          const retryAfterSec = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 2;
          jikanRateLimiter.reportRateLimit(retryAfterSec);

          if (attempt <= maxRetries) {
            await new Promise((r) => setTimeout(r, (retryAfterSec || 2) * 1000));
            continue;
          }
          return null;
        }

        if (response.status === 404) {
          return null;
        }

        if (!response.ok) {
          if (attempt <= maxRetries && response.status >= 500) {
            await new Promise((r) => setTimeout(r, attempt * 500));
            continue;
          }
          return null;
        }

        const json = (await response.json()) as JikanResponse<T>;
        return json;
      } catch (err: unknown) {
        const isTimeout =
          err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError");
        if (isTimeout) {
          return null; // Bounded timeout, do not block UI
        }

        if (attempt <= maxRetries) {
          await new Promise((r) => setTimeout(r, attempt * 400));
          continue;
        }
        return null;
      }
    }

    return null;
  }
}

export const jikanClient = new JikanClient();
