/**
 * BingeByte — Playback Provider Module
 * Public interface and registry for playback provider adapters.
 */

import { PlaybackProvider } from "./types";
import { NexStreamAdapter, NexStreamConfig } from "./nexstream";

export * from "./types";
export * from "./nexstream";

/**
 * Returns the active default playback provider.
 * Uses NexStream by default, but allows swapping providers transparently.
 */
export function getDefaultPlaybackProvider(
  config?: NexStreamConfig
): PlaybackProvider {
  return new NexStreamAdapter(config);
}
