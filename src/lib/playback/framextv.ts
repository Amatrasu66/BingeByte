/**
 * BingeByte — FrameXTV Playback Provider Adapter (Verified Contract)
 *
 * Implements the PlaybackProvider interface for FrameXTV.
 * NOTE: FrameXTV is DISABLED by default in production per Phase 14A/14B requirements
 * until licensing authorization, terms of service, and embedding behaviors are fully verified.
 *
 * Verified Technical Specification (audited from https://framextv.cc/api & DocsPage):
 * - Canonical Base URL: https://framextv.xyz
 * - Approved Domains: framextv.xyz, framextv.tech, framextv.cc, framextv.pro
 * - Documented Movie Pattern: /embed/{tmdbId}
 * - Documented TV Pattern: /embed/{tmdbId}/{season}/{episode}
 * - Documented Extraction Providers: barbarian (Barbarian I), archer (Archer II), goblin (Goblin III), pekka (P.E.K.K.A IV)
 * - Internal Bundle Extraction Servers (Discrepancy Explained): headhunter, hog_rider, lavahound, miner, valkyrie, druid, skeleton_king, monk
 * - Documented Query Parameters: autoplay (1|0), muted (1|0), t / start (seconds), speed (0.5..2), controls (1|0), server / provider (name)
 * - Documented postMessage Actions: play, pause, seek, seekBy, setVolume, mute, setProvider, setSubtitle
 * - Documented Telemetry Event: frameXTV:timeupdate (currentTime, duration)
 * - Anime Status: Unverified in official documentation (omitted to preserve safe contract)
 */

import {
  PlaybackProvider,
  PlaybackEmbedResult,
  PlaybackTarget,
  PlaybackMediaType,
  PlaybackProviderCapabilities,
  PlaybackSource,
} from "./types";
import { isValidPositiveInteger, isValidNonNegativeInteger } from "./nexstream";
import { validatePlaybackUrl } from "./security";

export const FRAMEXTV_DEFAULT_BASE_URL = "https://framextv.xyz";

export const FRAMEXTV_APPROVED_HOSTS: readonly string[] = Object.freeze([
  "framextv.xyz",
  "framextv.tech",
  "framextv.cc",
  "framextv.pro",
]);

/**
 * Officially documented extraction server providers from https://framextv.cc/api DocsPage.
 */
export const FRAMEXTV_DOCUMENTED_SERVERS: readonly string[] = Object.freeze([
  "barbarian",
  "archer",
  "goblin",
  "pekka",
]);

/**
 * Internal extraction servers discovered in web application bundle.
 */
export const FRAMEXTV_INTERNAL_SERVERS: readonly string[] = Object.freeze([
  "headhunter",
  "hog_rider",
  "lavahound",
  "miner",
  "valkyrie",
  "druid",
  "skeleton_king",
  "monk",
]);

// Default extraction servers alias to officially documented servers
export const FRAMEXTV_EXTRACTION_SERVERS = FRAMEXTV_DOCUMENTED_SERVERS;

export interface FrameXTVConfig {
  baseUrl?: string;
  enabled?: boolean;
  autoplay?: boolean;
  muted?: boolean;
  useLegacyPatterns?: boolean;
}

/**
 * FrameXTV postMessage API contract.
 */
export type FrameXCommandAction =
  | "play"
  | "pause"
  | "seek"
  | "seekBy"
  | "setVolume"
  | "mute"
  | "setProvider"
  | "setSubtitle";

export interface FrameXCommandMessage {
  action: FrameXCommandAction;
  time?: number;
  seconds?: number;
  volume?: number;
  provider?: string;
  index?: number;
}

export interface FrameXTelemetryMessage {
  event: "frameXTV:timeupdate";
  currentTime: number;
  duration: number;
}

export class FrameXTVAdapter implements PlaybackProvider {
  public readonly id = "framextv";
  public readonly name = "FrameXTV";
  public readonly supportedMediaTypes: ReadonlyArray<PlaybackMediaType> = Object.freeze(["movie", "tv"]);
  public readonly capabilities: PlaybackProviderCapabilities = Object.freeze({
    supportsExtractionServers: true,
    supportsMessageBridge: true,
  });

  private readonly explicitConfig?: FrameXTVConfig;

  constructor(config?: FrameXTVConfig) {
    this.explicitConfig = config;
  }

  private getBaseUrl(): string {
    const configured = this.explicitConfig?.baseUrl || process.env.FRAMEXTV_BASE_URL || FRAMEXTV_DEFAULT_BASE_URL;
    return configured.replace(/\/+$/, "");
  }

  /**
   * Checks whether the provider base URL is configured.
   */
  public isConfigured(): boolean {
    const base = this.getBaseUrl();
    try {
      const parsed = new URL(base);
      return parsed.protocol === "https:" || parsed.protocol === "http:";
    } catch {
      return false;
    }
  }

  /**
   * Checks whether FrameXTV is enabled.
   * STRICT SECURITY GUARANTEE: Disabled by default in production.
   * Only enabled when explicitly configured via explicitConfig.enabled or ENABLE_FRAMEXTV_PROVIDER=true.
   */
  public isAvailable(): boolean {
    if (typeof this.explicitConfig?.enabled === "boolean") {
      return this.explicitConfig.enabled && this.isConfigured();
    }
    return process.env.ENABLE_FRAMEXTV_PROVIDER === "true" && this.isConfigured();
  }

  /**
   * Builds an array of extraction server sources for a given embed path.
   */
  private buildExtractionSources(baseEmbedUrl: string): PlaybackSource[] {
    const serverLabels: Record<string, string> = {
      barbarian: "Barbarian I (Subtitles & HLS)",
      archer: "Archer II (Multi-Audio & 4K)",
      goblin: "Goblin III (Fast Mirror)",
      pekka: "P.E.K.K.A IV (High Bitrate)",
    };

    return FRAMEXTV_DOCUMENTED_SERVERS.map((server, index) => {
      const serverUrl = new URL(baseEmbedUrl);
      serverUrl.searchParams.set("server", server);
      return {
        serverId: server,
        name: serverLabels[server] || `Server ${index + 1} (${server})`,
        url: serverUrl.toString(),
      };
    });
  }

  /**
   * Resolves movie embed URL.
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

    if (!this.isAvailable()) {
      return {
        status: "unavailable",
        providerId: this.id,
        providerName: this.name,
        reason: "FrameXTV provider is currently disabled pending terms and embedding verification.",
        target,
      };
    }

    // Use documented pattern /embed/{id} (or legacy /embed/movie/{id} if configured)
    const embedPath = this.explicitConfig?.useLegacyPatterns
      ? `/embed/movie/${numericId}`
      : `/embed/${numericId}`;

    const rawUrl = `${this.getBaseUrl()}${embedPath}`;
    const validation = validatePlaybackUrl(rawUrl, FRAMEXTV_APPROVED_HOSTS);

    if (!validation.isValid || !validation.sanitizedUrl) {
      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: validation.error || "FrameXTV produced an invalid or non-whitelisted playback URL.",
        target,
      };
    }

    const sources = this.buildExtractionSources(validation.sanitizedUrl);

    return {
      status: "ready",
      url: validation.sanitizedUrl,
      sources,
      providerId: this.id,
      providerName: this.name,
      target,
    };
  }

  /**
   * Resolves TV episode embed URL.
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

    if (!this.isAvailable()) {
      return {
        status: "unavailable",
        providerId: this.id,
        providerName: this.name,
        reason: "FrameXTV provider is currently disabled pending terms and embedding verification.",
        target,
      };
    }

    // Use documented pattern /embed/{id}/{season}/{episode} (or legacy /embed/tv/{id}/{s}/{e} if configured)
    const embedPath = this.explicitConfig?.useLegacyPatterns
      ? `/embed/tv/${numericId}/${numericSeason}/${numericEpisode}`
      : `/embed/${numericId}/${numericSeason}/${numericEpisode}`;

    const rawUrl = `${this.getBaseUrl()}${embedPath}`;
    const validation = validatePlaybackUrl(rawUrl, FRAMEXTV_APPROVED_HOSTS);

    if (!validation.isValid || !validation.sanitizedUrl) {
      return {
        status: "api_error",
        providerId: this.id,
        providerName: this.name,
        reason: validation.error || "FrameXTV produced an invalid or non-whitelisted playback URL.",
        target,
      };
    }

    const sources = this.buildExtractionSources(validation.sanitizedUrl);

    return {
      status: "ready",
      url: validation.sanitizedUrl,
      sources,
      providerId: this.id,
      providerName: this.name,
      target,
    };
  }

  /**
   * Resolves playback target generically.
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

/**
 * Validates a postMessage origin against FrameXTV approved domains.
 */
export function isValidFrameXMessageOrigin(origin: string): boolean {
  if (!origin || typeof origin !== "string") return false;
  try {
    const parsed = new URL(origin);
    const host = parsed.hostname.toLowerCase();
    return FRAMEXTV_APPROVED_HOSTS.some(
      (approved) => host === approved || host.endsWith(`.${approved}`)
    );
  } catch {
    return false;
  }
}
