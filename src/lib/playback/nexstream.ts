/**
 * BingeByte — NexStream Playback Provider Adapter
 * Implements the PlaybackProvider interface for NexStream by CodeSpecter.
 *
 * URL Schemes:
 * - Movie: /embed/movie/{tmdbId}?apikey={API_KEY}
 * - TV Episode: /embed/tv/{tmdbId}/{season}/{episode}?apikey={API_KEY}
 */

import {
  PlaybackProvider,
  PlaybackEmbedResult,
  PlaybackTarget,
  PlaybackProviderConfig,
} from "./types";

export interface NexStreamConfig extends PlaybackProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  isVerified?: boolean;
}

const DEFAULT_NEXSTREAM_BASE_URL = "https://api.codespecters.com";

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
    // Remove trailing slashes for predictable path concatenation
    return `${parsed.protocol}//${parsed.host}`;
  } catch {
    return null;
  }
}

export class NexStreamAdapter implements PlaybackProvider {
  public readonly id = "nexstream";
  public readonly name = "NexStream";

  private readonly explicitConfig?: NexStreamConfig;

  constructor(config?: NexStreamConfig) {
    this.explicitConfig = config;
  }

  /**
   * Resolves the active base URL from explicit options or environment variables.
   */
  private getBaseUrl(): string | null {
    const configured =
      this.explicitConfig?.baseUrl || process.env.NEXSTREAM_BASE_URL || DEFAULT_NEXSTREAM_BASE_URL;
    return sanitizeBaseUrl(configured);
  }

  /**
   * Resolves the active API key from explicit options or environment variables.
   */
  private getApiKey(): string | null {
    const key = this.explicitConfig?.apiKey ?? process.env.NEXSTREAM_API_KEY;
    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return null;
    }
    return key.trim();
  }

  /**
   * Checks whether the necessary credentials and base URL are present.
   */
  public isConfigured(): boolean {
    return this.getBaseUrl() !== null && this.getApiKey() !== null;
  }

  /**
   * Checks whether the provider is verified and authorized for content embedding.
   * By default, returns false unless explicitly gated with an affirmative verification flag.
   */
  public isAuthorized(): boolean {
    if (typeof this.explicitConfig?.isVerified === "boolean") {
      return this.explicitConfig.isVerified;
    }
    const envFlag =
      process.env.PLAYBACK_PROVIDER_ENABLED === "true" ||
      process.env.ENABLE_EMBED_PLAYBACK === "true" ||
      process.env.NEXSTREAM_ENABLED === "true";

    return envFlag;
  }

  /**
   * Constructs a validated embed URL for a movie.
   * Format: /embed/movie/{tmdbId}?apikey={API_KEY}
   */
  public getMovieEmbedUrl(tmdbId: number | string): PlaybackEmbedResult {
    const target: PlaybackTarget = {
      mediaType: "movie",
      tmdbId: typeof tmdbId === "number" ? tmdbId : parseInt(String(tmdbId), 10),
    };

    if (!isValidPositiveInteger(tmdbId)) {
      return {
        status: "invalid_input",
        providerId: this.id,
        providerName: this.name,
        reason: "Invalid movie ID. A positive integer is required.",
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
          ? "NexStream base URL is invalid or unconfigured."
          : "NexStream API key is not configured.",
        target,
      };
    }

    if (!this.isAuthorized()) {
      return {
        status: "unverified",
        providerId: this.id,
        providerName: this.name,
        reason:
          "Playback provider integration is gated pending verification of content distribution licensing rights.",
        target,
      };
    }

    const embedUrl = new URL(`/embed/movie/${numericId}`, baseUrl);
    embedUrl.searchParams.set("apikey", apiKey);

    return {
      status: "ready",
      url: embedUrl.toString(),
      providerId: this.id,
      providerName: this.name,
      target,
    };
  }

  /**
   * Constructs a validated embed URL for a TV episode.
   * Format: /embed/tv/{tmdbId}/{season}/{episode}?apikey={API_KEY}
   */
  public getTVEmbedUrl(
    tmdbId: number | string,
    season: number | string,
    episode: number | string
  ): PlaybackEmbedResult {
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
        reason: "Invalid TV series ID. A positive integer is required.",
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
          ? "NexStream base URL is invalid or unconfigured."
          : "NexStream API key is not configured.",
        target,
      };
    }

    if (!this.isAuthorized()) {
      return {
        status: "unverified",
        providerId: this.id,
        providerName: this.name,
        reason:
          "Playback provider integration is gated pending verification of content distribution licensing rights.",
        target,
      };
    }

    const embedUrl = new URL(
      `/embed/tv/${numericId}/${numericSeason}/${numericEpisode}`,
      baseUrl
    );
    embedUrl.searchParams.set("apikey", apiKey);

    return {
      status: "ready",
      url: embedUrl.toString(),
      providerId: this.id,
      providerName: this.name,
      target,
    };
  }

  /**
   * Resolves playback target for a generic target object.
   */
  public resolvePlayback(target: PlaybackTarget): PlaybackEmbedResult {
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
