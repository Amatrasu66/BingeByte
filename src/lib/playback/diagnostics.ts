/**
 * BingeByte — Playback Diagnostics Service
 *
 * Lightweight, privacy-conscious in-memory diagnostics for playback lifecycle events.
 *
 * Privacy & Security Constraints:
 * 1. No PII, user identifiers, viewing history, or IP addresses are stored.
 * 2. No API keys, secrets, tokens, or sensitive URL query parameters are logged.
 * 3. Events are strictly in-memory (bounded ring buffer) and never transmitted to external services.
 * 4. Distinguishes DOM iframe load from actual media playback:
 *    Cross-origin iframes prevent inspectable HTMLMediaElement events. 'init_succeeded'
 *    represents the browser receiving a 200/document response for the iframe, NOT guaranteed
 *    video decoding or playback inside the cross-origin boundary.
 */

export type PlaybackDiagnosticEventType =
  | "init_started"
  | "init_succeeded"
  | "init_failed"
  | "init_timeout"
  | "provider_switch_requested"
  | "server_switch_requested"
  | "session_disposed";

export interface PlaybackDiagnosticEvent {
  id: string;
  type: PlaybackDiagnosticEventType;
  providerId: string;
  serverId?: string;
  mediaType: "movie" | "tv";
  tmdbId: number;
  season?: number;
  episode?: number;
  timestamp: number;
  durationMs?: number;
  errorReason?: string;
}

export type PlaybackDiagnosticListener = (event: PlaybackDiagnosticEvent) => void;

class PlaybackDiagnosticsRegistry {
  private readonly maxEvents = 50;
  private events: PlaybackDiagnosticEvent[] = [];
  private listeners: Set<PlaybackDiagnosticListener> = new Set();
  private eventCounter = 0;

  /**
   * Records a new diagnostic event in the bounded in-memory buffer.
   */
  public record(
    event: Omit<PlaybackDiagnosticEvent, "id" | "timestamp"> & { timestamp?: number }
  ): PlaybackDiagnosticEvent {
    const fullEvent: PlaybackDiagnosticEvent = {
      ...event,
      id: `diag-${++this.eventCounter}-${Date.now()}`,
      timestamp: event.timestamp ?? Date.now(),
    };

    this.events.push(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    for (const listener of this.listeners) {
      try {
        listener(fullEvent);
      } catch {
        // Listener safety: do not allow subscriber exceptions to break execution
      }
    }

    return fullEvent;
  }

  /**
   * Returns recent events recorded in the in-memory buffer.
   */
  public getRecent(): ReadonlyArray<PlaybackDiagnosticEvent> {
    return [...this.events];
  }

  /**
   * Returns recent events filtered by provider ID.
   */
  public getByProvider(providerId: string): ReadonlyArray<PlaybackDiagnosticEvent> {
    return this.events.filter((e) => e.providerId === providerId);
  }

  /**
   * Clears the in-memory diagnostic buffer (primarily for test cleanup).
   */
  public clear(): void {
    this.events = [];
    this.eventCounter = 0;
  }

  /**
   * Subscribes a listener callback to real-time diagnostic events.
   * Returns an unsubscribe cleanup function.
   */
  public subscribe(listener: PlaybackDiagnosticListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

// Global in-memory diagnostics singleton
export const playbackDiagnostics = new PlaybackDiagnosticsRegistry();

export function recordPlaybackDiagnostic(
  event: Omit<PlaybackDiagnosticEvent, "id" | "timestamp"> & { timestamp?: number }
): PlaybackDiagnosticEvent {
  return playbackDiagnostics.record(event);
}

export function getRecentPlaybackDiagnostics(): ReadonlyArray<PlaybackDiagnosticEvent> {
  return playbackDiagnostics.getRecent();
}

export function clearPlaybackDiagnostics(): void {
  playbackDiagnostics.clear();
}

export function subscribePlaybackDiagnostics(
  listener: PlaybackDiagnosticListener
): () => void {
  return playbackDiagnostics.subscribe(listener);
}
