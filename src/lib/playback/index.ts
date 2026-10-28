/**
 * BingeByte — Playback Provider Module
 * Public interface and registry for playback provider adapters.
 */

import { PlaybackProvider } from "./types";
import { NexStreamAdapter, NexStreamConfig } from "./nexstream";
import { playbackRegistry } from "./registry";

export * from "./types";
export * from "./nexstream";
export * from "./framextv";
export * from "./security";
export * from "./registry";

/**
 * Returns the active default playback provider.
 * Uses NexStream by default via the provider registry, or creates an adapter with explicit config.
 */
export function getDefaultPlaybackProvider(
  config?: NexStreamConfig
): PlaybackProvider {
  if (config) {
    return new NexStreamAdapter(config);
  }
  return playbackRegistry.getDefault();
}
