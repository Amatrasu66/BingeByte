/**
 * BingeByte — Playback Lifecycle Coordinator
 *
 * Provides a provider-neutral lifecycle contract for video playback sessions:
 * 1. Creation: Allocates a distinct playback session, attaches iframe to container.
 * 2. Replacement: Disposes of the previous session before attaching a replacement.
 * 3. Disposal: Promptly deactivates the playback session, clears iframe src to about:blank
 *    to terminate media and audio playback immediately, removes the DOM node, and detaches listeners.
 * 4. Request Coordination: Aborts in-flight asynchronous resolution requests to prevent
 *    stale responses from reviving inactive players or overwriting new selections.
 * 5. Bounded Initialization Timeout: Prevents infinite loading spinners if a provider iframe
 *    fails to load, fails cross-origin redirects, or is blocked by an ad-blocker.
 * 6. Structured Diagnostics: Records privacy-safe lifecycle events without collecting PII or secrets.
 */

import { recordPlaybackDiagnostic } from "./diagnostics";

export interface PlaybackSessionConfig {
  streamUrl: string;
  title: string;
  container: HTMLElement;
  onLoad?: () => void;
  onError?: () => void;
  onTimeout?: () => void;
  timeoutMs?: number;
  allow?: string;
  referrerPolicy?: ReferrerPolicy;
  className?: string;
  // Optional diagnostic context (non-sensitive metadata only)
  providerId?: string;
  serverId?: string;
  mediaType?: "movie" | "tv";
  tmdbId?: number;
  season?: number;
  episode?: number;
}

export interface PlaybackSession {
  readonly id: string;
  readonly streamUrl: string;
  readonly isActive: boolean;
  dispose: () => void;
}

let sessionCounter = 0;

/**
 * Creates and activates an iframe-based playback session inside a container element.
 * Guaranteed cleanup: calling dispose() stops audio/video instantly, removes the iframe,
 * and clears any pending timeout timers.
 */
export function createPlaybackSession(config: PlaybackSessionConfig): PlaybackSession {
  const sessionId = `playback-session-${++sessionCounter}-${Date.now()}`;
  const startTime = Date.now();
  const {
    streamUrl,
    title,
    container,
    onLoad,
    onError,
    onTimeout,
    timeoutMs,
    allow = "autoplay; fullscreen; encrypted-media; picture-in-picture",
    referrerPolicy = "origin",
    className = "absolute inset-0 h-full w-full border-0",
    providerId,
    serverId,
    mediaType,
    tmdbId,
    season,
    episode,
  } = config;

  let isActive = true;
  let iframe: HTMLIFrameElement | null = null;
  let timeoutTimer: ReturnType<typeof setTimeout> | null = null;

  // Record initialization started diagnostic
  if (providerId && mediaType && typeof tmdbId === "number") {
    recordPlaybackDiagnostic({
      type: "init_started",
      providerId,
      serverId,
      mediaType,
      tmdbId,
      season,
      episode,
      timestamp: startTime,
    });
  }

  const clearTimer = () => {
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  };

  // Start bounded initialization timeout timer if configured
  if (typeof timeoutMs === "number" && timeoutMs > 0) {
    timeoutTimer = setTimeout(() => {
      if (!isActive) return;
      const durationMs = Date.now() - startTime;

      if (providerId && mediaType && typeof tmdbId === "number") {
        recordPlaybackDiagnostic({
          type: "init_timeout",
          providerId,
          serverId,
          mediaType,
          tmdbId,
          season,
          episode,
          durationMs,
        });
      }

      if (onTimeout) {
        onTimeout();
      } else if (onError) {
        onError();
      }
    }, timeoutMs);
  }

  // Only execute DOM operations in browser environments
  if (typeof document !== "undefined" && container) {
    iframe = document.createElement("iframe");
    iframe.dataset.sessionId = sessionId;
    iframe.src = streamUrl;
    iframe.title = `${title} - Video Player`;
    iframe.allow = allow;
    iframe.allowFullscreen = true;
    iframe.loading = "eager";
    iframe.referrerPolicy = referrerPolicy;
    iframe.className = className;

    const handleLoad = () => {
      if (!isActive) return;
      clearTimer();
      const durationMs = Date.now() - startTime;

      if (providerId && mediaType && typeof tmdbId === "number") {
        recordPlaybackDiagnostic({
          type: "init_succeeded",
          providerId,
          serverId,
          mediaType,
          tmdbId,
          season,
          episode,
          durationMs,
        });
      }

      if (onLoad) {
        onLoad();
      }
    };

    const handleError = () => {
      if (!isActive) return;
      clearTimer();
      const durationMs = Date.now() - startTime;

      if (providerId && mediaType && typeof tmdbId === "number") {
        recordPlaybackDiagnostic({
          type: "init_failed",
          providerId,
          serverId,
          mediaType,
          tmdbId,
          season,
          episode,
          durationMs,
        });
      }

      if (onError) {
        onError();
      }
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    container.appendChild(iframe);
  }

  const dispose = () => {
    if (!isActive) return;
    isActive = false;
    clearTimer();

    if (providerId && mediaType && typeof tmdbId === "number") {
      recordPlaybackDiagnostic({
        type: "session_disposed",
        providerId,
        serverId,
        mediaType,
        tmdbId,
        season,
        episode,
        durationMs: Date.now() - startTime,
      });
    }

    if (iframe) {
      try {
        // Explicitly navigate to about:blank to immediately terminate all
        // media decoding, WebAudio output, audio contexts, and ongoing streaming
        iframe.src = "about:blank";
      } catch {
        // Cross-origin or detached iframe safety
      }

      try {
        if (iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        } else {
          iframe.remove();
        }
      } catch {
        // Safety guard against already detached node
      }

      iframe = null;
    }
  };

  return {
    id: sessionId,
    streamUrl,
    get isActive() {
      return isActive;
    },
    dispose,
  };
}

/**
 * Coordinator for managing asynchronous provider resolution requests.
 * Prevents race conditions and guarantees stale responses cannot revive inactive players.
 */
export class PlaybackResolutionCoordinator {
  private activeController: AbortController | null = null;
  private currentRequestId = 0;

  /**
   * Starts a new resolution request, aborting any prior in-flight request.
   */
  public startRequest(): { signal: AbortSignal; requestId: number } {
    if (this.activeController) {
      this.activeController.abort();
    }
    this.activeController = new AbortController();
    const requestId = ++this.currentRequestId;
    return {
      signal: this.activeController.signal,
      requestId,
    };
  }

  /**
   * Checks whether a given requestId is still the active, non-superseded request.
   */
  public isLatest(requestId: number): boolean {
    return this.currentRequestId === requestId && !this.activeController?.signal.aborted;
  }

  /**
   * Checks whether there is currently an active, in-flight resolution request.
   */
  public hasActiveRequest(): boolean {
    return this.activeController !== null && !this.activeController.signal.aborted;
  }

  /**
   * Aborts and invalidates any active request (e.g. on navigation or unmount).
   */
  public abort(): void {
    if (this.activeController) {
      this.activeController.abort();
      this.activeController = null;
    }
    this.currentRequestId++;
  }
}
