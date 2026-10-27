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
 * Genuine status of playback availability:
 * - 'ready': Provider returned a valid, playable stream source.
 * - 'unavailable': Provider returned no playable source for this title / episode.
 * - 'unconfigured': Base URL or API key is missing from server environment.
 * - 'auth_error': Provider rejected authentication (e.g. invalid API key).
 * - 'api_error': Provider endpoint unreachable, timed out, or returned an error status.
 * - 'invalid_input': Malformed or non-positive media ID / season / episode.
 */
export type PlaybackStatus =
  | "ready"
  | "unavailable"
  | "unconfigured"
  | "auth_error"
  | "api_error"
  | "invalid_input";

export interface PlaybackSource {
  name: string;
  url: string;
}

export interface PlaybackEmbedSuccess {
  status: "ready";
  url: string;
  sources?: PlaybackSource[];
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
  timeoutMs?: number;
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
   * Resolves a validated embed URL for a movie via server-side provider query.
   */
  getMovieEmbedUrl(tmdbId: number | string): Promise<PlaybackEmbedResult>;

  /**
   * Resolves a validated embed URL for a TV episode via server-side provider query.
   */
  getTVEmbedUrl(
    tmdbId: number | string,
    season: number | string,
    episode: number | string
  ): Promise<PlaybackEmbedResult>;

  /**
   * Resolves playback for a generic PlaybackTarget (movie or TV episode).
   */
  resolvePlayback(target: PlaybackTarget): Promise<PlaybackEmbedResult>;
}
