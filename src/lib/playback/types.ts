/**
 * BingeByte — Playback Provider Architecture
 * Typed abstractions for replaceable streaming playback providers.
 */

export type PlaybackMediaType = "movie" | "tv";

export interface MoviePlaybackTarget {
  mediaType: "movie";
  tmdbId: number;
}

export interface TVPlaybackTarget {
  mediaType: "tv";
  tmdbId: number;
  season: number;
  episode: number;
}

export type PlaybackTarget = MoviePlaybackTarget | TVPlaybackTarget;

/**
 * Status of playback availability:
 * - 'ready': Configuration and licensing verified; embed URL is validated and ready.
 * - 'unverified': Provider configured, but content distribution licensing verification is pending (safety gate).
 * - 'unconfigured': Base URL or API key is missing from environment.
 * - 'disabled': Provider is explicitly disabled via configuration.
 * - 'invalid_input': Malformed or invalid media ID / season / episode.
 */
export type PlaybackStatus =
  | "ready"
  | "unverified"
  | "unconfigured"
  | "disabled"
  | "invalid_input";

export interface PlaybackEmbedSuccess {
  status: "ready";
  url: string;
  providerId: string;
  providerName: string;
  target: PlaybackTarget;
}

export interface PlaybackEmbedUnavailable {
  status: Exclude<PlaybackStatus, "ready">;
  providerId: string;
  providerName: string;
  reason: string;
  target?: PlaybackTarget;
}

export type PlaybackEmbedResult = PlaybackEmbedSuccess | PlaybackEmbedUnavailable;

export interface PlaybackProviderConfig {
  baseUrl?: string;
  apiKey?: string;
  isVerified?: boolean;
}

/**
 * Abstract interface for any video playback provider adapter.
 */
export interface PlaybackProvider {
  readonly id: string;
  readonly name: string;

  /**
   * Checks whether the provider has the necessary base URL and API credentials configured.
   */
  isConfigured(): boolean;

  /**
   * Checks whether the provider has passed licensing and authorization verification.
   * If false, embed playback must remain gated.
   */
  isAuthorized(): boolean;

  /**
   * Constructs a validated embed URL for a movie.
   */
  getMovieEmbedUrl(tmdbId: number | string): PlaybackEmbedResult;

  /**
   * Constructs a validated embed URL for a TV episode.
   */
  getTVEmbedUrl(
    tmdbId: number | string,
    season: number | string,
    episode: number | string
  ): PlaybackEmbedResult;

  /**
   * Resolves playback for a generic PlaybackTarget (movie or TV episode).
   */
  resolvePlayback(target: PlaybackTarget): PlaybackEmbedResult;
}
