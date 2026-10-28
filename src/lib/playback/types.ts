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

/**
 * Represents an individual streaming source or extraction server provided by an active provider.
 */
export interface PlaybackSource {
  name: string;
  url: string;
  serverId?: string;
  quality?: string;
}

export interface PlaybackEmbedSuccess {
  status: "ready";
  url: string;
  sources?: PlaybackSource[];
  providerId: string;
  providerName: string;
  target: PlaybackTarget;
  /** Active internal extraction server (if supported by provider) */
  activeServerId?: string;
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
 * Capability flags exposed by a playback provider adapter.
 */
export interface PlaybackProviderCapabilities {
  /** Whether the provider supports multiple internal extraction servers */
  readonly supportsExtractionServers?: boolean;
  /** Whether the provider supports custom quality presets */
  readonly supportsQualitySelection?: boolean;
  /** Whether the provider supports postMessage bridge communication */
  readonly supportsMessageBridge?: boolean;
}

/**
 * Serialized public descriptor of an external playback provider.
 */
export interface PlaybackProviderDescriptor {
  readonly id: string;
  readonly name: string;
  readonly description?: string;
  readonly supportedMediaTypes: ReadonlyArray<PlaybackMediaType>;
  readonly isConfigured: boolean;
  readonly isAvailable: boolean;
  readonly capabilities?: PlaybackProviderCapabilities;
}

/**
 * Abstract interface for any video playback provider adapter.
 */
export interface PlaybackProvider {
  readonly id: string;
  readonly name: string;
  readonly supportedMediaTypes?: ReadonlyArray<PlaybackMediaType>;
  readonly capabilities?: PlaybackProviderCapabilities;

  /**
   * Checks whether the provider has the necessary base URL and credentials configured.
   */
  isConfigured(): boolean;

  /**
   * Checks whether the provider is currently available and enabled for playback.
   */
  isAvailable?(): boolean;

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

/**
 * Helper to produce a standard descriptor from a PlaybackProvider instance.
 */
export function getProviderDescriptor(
  provider: PlaybackProvider
): PlaybackProviderDescriptor {
  const isConfig = provider.isConfigured();
  const isAvail =
    typeof provider.isAvailable === "function" ? provider.isAvailable() : isConfig;
  return {
    id: provider.id,
    name: provider.name,
    supportedMediaTypes: provider.supportedMediaTypes ?? ["movie", "tv"],
    isConfigured: isConfig,
    isAvailable: isAvail,
    capabilities: provider.capabilities,
  };
}
