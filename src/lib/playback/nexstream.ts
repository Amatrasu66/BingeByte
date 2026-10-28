/**
 * BingeByte — NexStream Playback Provider Adapter
 * Implements the PlaybackProvider interface for NexStream by CodeSpecter.
 *
 * Server-Side API Endpoints:
 * - Movie: GET /api/movie/{tmdbId}?apikey={API_KEY}
 * - TV Episode: GET /api/tv/{tmdbId}/{season}/{episode}?apikey={API_KEY}
 *
 * Playback Security:
 * The API key is utilized strictly on the server to retrieve the playable stream source.
 * The client browser receives only the resolved clean playback URL (e.g. embedmaster.link).
 */

import {
  PlaybackProvider,
  PlaybackEmbedResult,
  PlaybackTarget,
  PlaybackProviderConfig,
  PlaybackSource,
  PlaybackMediaType,
  PlaybackProviderCapabilities,
} from "./types";

export interface NexStreamConfig extends PlaybackProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  timeoutMs?: number;
}

const DEFAULT_NEXSTREAM_BASE_URL = "https://api.codespecters.com";
const DEFAULT_TIMEOUT_MS = 25000;

interface NextStreamApiResponse {
  success?: boolean;
  type?: string;
  tmdbId?: string | number;
  season?: string | number;
  episode?: string | number;
  meta?: {
    title?: string;
    poster?: string;
  } | null;
  sources?: Array<{
    name?: string;
    url?: string;
  }>;
  error?: string;
}

/**
 * Validates whether an input represents a positive integer (e.g. valid TMDB media ID or episode number).
 */
export function isValidPositiveInteger(value: unknown): value is number {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed > 0;
  }
  return false;
}

/**
 * Validates whether an input represents a non-negative integer (e.g. season number, including season 0 for specials).
 */
export function isValidNonNegativeInteger(value: unknown): value is number {
  if (typeof value === "number") {
    return Number.isInteger(value) && value >= 0;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!/^\d+$/.test(trimmed)) return false;
    const parsed = Number(trimmed);
    return Number.isSafeInteger(parsed) && parsed >= 0;
  }
  return false;
}

/**
 * Sanitizes and validates a base URL to ensure it has an allowed protocol and no dangerous characters.
 */
export function sanitizeBaseUrl(rawUrl?: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const trimmed = rawUrl.trim();
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return null;
    }
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

const PERMITTED_PLAYBACK_HOSTS = [
  "embedmaster.link",
  "embdmstrplayer.com",
  "codespecters.com",
];

/**
 * Validates that a resolved source URL is a legitimate web destination
 * matching the approved provider streaming domains or the configured base URL host.
 */
export function isValidSourceUrl(
  url: string | null | undefined,
  customHost?: string
): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url.trim());
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    for (const host of PERMITTED_PLAYBACK_HOSTS) {
      if (hostname === host || hostname.endsWith(`.${host}`)) {
        return true;
      }
    }
    if (customHost) {
      const customLower = customHost.toLowerCase();
      if (hostname === customLower || hostname.endsWith(`.${customLower}`)) {
        return true;
      }
    }
    // Allow localhost / 127.0.0.1 for local test environments
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Determines whether a playback request error is transient and safe to retry.
 */
function isTransientPlaybackNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError" || error.name === "TimeoutError") {
    return false;
  }
  const msg = error.message.toLowerCase();
  const cause = (error as { cause?: Error }).cause;
  const causeMsg = cause?.message?.toLowerCase() || "";
  const code = (error as { code?: string }).code?.toLowerCase() || "";
  const causeCode = (cause as { code?: string })?.code?.toLowerCase() || "";

  return (
    msg.includes("econnreset") ||
    msg.includes("etimedout") ||
    msg.includes("econnrefused") ||
    msg.includes("socket hang up") ||
    msg.includes("fetch failed") ||
    causeMsg.includes("econnreset") ||
    causeMsg.includes("etimedout") ||
    causeMsg.includes("socket hang up") ||
    code === "econnreset" ||
    causeCode === "econnreset" ||
    code === "und_err_socket" ||
    causeCode === "und_err_socket"
  );
}

export class NexStreamAdapter implements PlaybackProvider {
  public readonly id = "nextstream";
  public readonly name = "NextStream";
  public readonly supportedMediaTypes: ReadonlyArray<PlaybackMediaType> = Object.freeze(["movie", "tv"]);
  public readonly capabilities: PlaybackProviderCapabilities = Object.freeze({
    supportsExtractionServers: true,
  });

  private readonly explicitConfig?: NexStreamConfig;

  constructor(config?: NexStreamConfig) {
    this.explicitConfig = config;
  }

  /**
   * Resolves the active base URL from explicit options or environment variables.
   */
  private getBaseUrl(): string | null {
    const configured =
      this.explicitConfig?.baseUrl ||
      process.env.NEXSTREAM_BASE_URL ||
      process.env.NEXTSTREAM_BASE_URL ||
      DEFAULT_NEXSTREAM_BASE_URL;
    return sanitizeBaseUrl(configured);
  }

  /**
   * Resolves the active API key from explicit options or environment variables.
   */
  private getApiKey(): string | null {
    const key =
      this.explicitConfig?.apiKey ??
      process.env.NEXSTREAM_API_KEY ??
      process.env.NEXTSTREAM_API_KEY;

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return null;
    }
    return key.trim();
  }

  /**
   * Resolves the active timeout.
   */
  private getTimeoutMs(): number {
    if (
      typeof this.explicitConfig?.timeoutMs === "number" &&
      this.explicitConfig.timeoutMs > 0
    ) {
      return this.explicitConfig.timeoutMs;
    }
    const envTimeout = process.env.NEXSTREAM_TIMEOUT_MS;
    if (envTimeout) {
      const parsed = parseInt(envTimeout, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return DEFAULT_TIMEOUT_MS;
  }

  /**
   * Checks whether the necessary credentials and base URL are present.
   */
  public isConfigured(): boolean {
    return this.getBaseUrl() !== null && this.getApiKey() !== null;
  }

  /**
   * Checks whether the provider is available and ready for playback.
   */
  public isAvailable(): boolean {
    return this.isConfigured();
  }

  /**
   * Executes a request to the NextStream API with bounded retries for transient network socket resets.
   */
  private async executeProviderRequest(requestPath: string): Promise<{
    response?: Response;
    error?: unknown;
  }> {
    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();
    if (!baseUrl || !apiKey) {
      return { error: new Error("Unconfigured") };
    }

    const requestUrl = new URL(requestPath, baseUrl);
    requestUrl.searchParams.set("apikey", apiKey);

    const maxRetries = 2;
    let attempt = 0;

    while (true) {
      attempt++;
      try {
        const response = await fetch(requestUrl.toString(), {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "BingeByte-Server/1.0",
          },
          signal: AbortSignal.timeout(this.getTimeoutMs()),
        });
        return { response };
      } catch (error) {
        if (attempt <= maxRetries && isTransientPlaybackNetworkError(error)) {
          await new Promise((resolve) => setTimeout(resolve, attempt * 250));
          continue;
        }
        return { error };
      }
    }
  }

  /**
   * Queries the NextStream server-side API to retrieve the movie stream source.
   */
  public async getMovieEmbedUrl(tmdbId: number | string): Promise<PlaybackEmbedResult> {
    const target: PlaybackTarget = {
      mediaType: "movie",
      tmdbId: typeof tmdbId === "number" ? tmdbId : parseInt(String(tmdbId), 10),
    };

    if (!isValidPositiveInteger(tmdbId)) {
      return {
        status: "invalid_input",
        providerId: this.id,
        providerName: this.name,
        reason: "Invalid movie identifier. A positive integer is required.",
        target,
      };
    }

    const numericId = typeof tmdbId === "number" ? tmdbId : parseInt(tmdbId, 10);
    target.tmdbId = numericId;

    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    if (!baseUrl || !apiKey) {
      return {
        status: "unconfigured",
        providerId: this.id,
        providerName: this.name,
        reason: !baseUrl
          ? "NextStream base URL is invalid or unconfigured."
          : "NextStream API key is not configured in the server environment.",
        target,
      };
    }

    const { response, error } = await this.executeProviderRequest(`/api/movie/${numericId}`);

    if (error || !response) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      const isMalformed = error instanceof SyntaxError;

      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: isTimeout
          ? "Request to streaming provider timed out."
          : isMalformed
          ? "Streaming provider returned a malformed response."
          : "Unable to reach streaming provider. Please check network connectivity.",
        target,
      };
    }

    if (response.status === 401) {
      return {
        status: "auth_error",
        providerId: this.id,
        providerName: this.name,
        reason: "Streaming service authentication failed. Please verify provider settings.",
        target,
      };
    }

    if (!response.ok) {
      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: `Streaming provider returned status ${response.status}.`,
        target,
      };
    }

    let json: NextStreamApiResponse;
    try {
      json = await response.json();
    } catch {
      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: "Streaming provider returned a malformed response.",
        target,
      };
    }

    if (
      json.success &&
      Array.isArray(json.sources) &&
      json.sources.length > 0
    ) {
      const baseHost = baseUrl ? new URL(baseUrl).hostname : undefined;
      const validSources: PlaybackSource[] = [];

      for (const s of json.sources) {
        if (s && typeof s.url === "string") {
          const trimmed = s.url.trim();
          if (isValidSourceUrl(trimmed, baseHost)) {
            validSources.push({
              name: s.name?.trim() || `Server ${validSources.length + 1}`,
              url: trimmed,
            });
          }
        }
      }

      if (validSources.length > 0) {
        return {
          status: "ready",
          url: validSources[0].url,
          sources: validSources,
          providerId: this.id,
          providerName: this.name,
          target,
        };
      }
    }

    return {
      status: "unavailable",
      providerId: this.id,
      providerName: this.name,
      reason: "No playable streaming source is currently available for this movie.",
      target,
    };
  }

  /**
   * Queries the NextStream server-side API to retrieve the TV episode stream source.
   */
  public async getTVEmbedUrl(
    tmdbId: number | string,
    season: number | string,
    episode: number | string
  ): Promise<PlaybackEmbedResult> {
    const target: PlaybackTarget = {
      mediaType: "tv",
      tmdbId: typeof tmdbId === "number" ? tmdbId : parseInt(String(tmdbId), 10),
      season: typeof season === "number" ? season : parseInt(String(season), 10),
      episode: typeof episode === "number" ? episode : parseInt(String(episode), 10),
    };

    if (!isValidPositiveInteger(tmdbId)) {
      return {
        status: "invalid_input",
        providerId: this.id,
        providerName: this.name,
        reason: "Invalid TV series identifier. A positive integer is required.",
        target,
      };
    }

    if (!isValidNonNegativeInteger(season)) {
      return {
        status: "invalid_input",
        providerId: this.id,
        providerName: this.name,
        reason: "Invalid TV season number. A non-negative integer is required.",
        target,
      };
    }

    if (!isValidPositiveInteger(episode)) {
      return {
        status: "invalid_input",
        providerId: this.id,
        providerName: this.name,
        reason: "Invalid TV episode number. A positive integer is required.",
        target,
      };
    }

    const numericId = typeof tmdbId === "number" ? tmdbId : parseInt(tmdbId, 10);
    const numericSeason = typeof season === "number" ? season : parseInt(season, 10);
    const numericEpisode = typeof episode === "number" ? episode : parseInt(episode, 10);

    target.tmdbId = numericId;
    target.season = numericSeason;
    target.episode = numericEpisode;

    const baseUrl = this.getBaseUrl();
    const apiKey = this.getApiKey();

    if (!baseUrl || !apiKey) {
      return {
        status: "unconfigured",
        providerId: this.id,
        providerName: this.name,
        reason: !baseUrl
          ? "NextStream base URL is invalid or unconfigured."
          : "NextStream API key is not configured in the server environment.",
        target,
      };
    }

    const { response, error } = await this.executeProviderRequest(
      `/api/tv/${numericId}/${numericSeason}/${numericEpisode}`
    );

    if (error || !response) {
      const isTimeout =
        error instanceof Error &&
        (error.name === "TimeoutError" || error.name === "AbortError");
      const isMalformed = error instanceof SyntaxError;

      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: isTimeout
          ? "Request to streaming provider timed out."
          : isMalformed
          ? "Streaming provider returned a malformed response."
          : "Unable to reach streaming provider. Please check network connectivity.",
        target,
      };
    }

    if (response.status === 401) {
      return {
        status: "auth_error",
        providerId: this.id,
        providerName: this.name,
        reason: "Streaming service authentication failed. Please verify provider settings.",
        target,
      };
    }

    if (!response.ok) {
      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: `Streaming provider returned status ${response.status}.`,
        target,
      };
    }

    let json: NextStreamApiResponse;
    try {
      json = await response.json();
    } catch {
      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: "Streaming provider returned a malformed response.",
        target,
      };
    }

    if (
      json.success &&
      Array.isArray(json.sources) &&
      json.sources.length > 0
    ) {
      const baseHost = baseUrl ? new URL(baseUrl).hostname : undefined;
      const validSources: PlaybackSource[] = [];

      for (const s of json.sources) {
        if (s && typeof s.url === "string") {
          const trimmed = s.url.trim();
          if (isValidSourceUrl(trimmed, baseHost)) {
            validSources.push({
              name: s.name?.trim() || `Server ${validSources.length + 1}`,
              url: trimmed,
            });
          }
        }
      }

      if (validSources.length > 0) {
        return {
          status: "ready",
          url: validSources[0].url,
          sources: validSources,
          providerId: this.id,
          providerName: this.name,
          target,
        };
      }
    }

    return {
      status: "unavailable",
      providerId: this.id,
      providerName: this.name,
      reason: "No playable streaming source is currently available for this episode.",
      target,
    };
  }

  /**
   * Resolves playback target for a generic target object.
   */
  public async resolvePlayback(target: PlaybackTarget): Promise<PlaybackEmbedResult> {
    if (target.mediaType === "movie") {
      return this.getMovieEmbedUrl(target.tmdbId);
    }
    if (target.mediaType === "tv") {
      return this.getTVEmbedUrl(target.tmdbId, target.season, target.episode);
    }

    return {
      status: "invalid_input",
      providerId: this.id,
      providerName: this.name,
      reason: `Unsupported media type: ${(target as { mediaType: string }).mediaType}`,
      target,
    };
  }
}
