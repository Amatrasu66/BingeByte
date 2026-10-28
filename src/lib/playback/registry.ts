/**
 * BingeByte — Playback Provider Registry
 * Centralized, provider-neutral registry for managing, selecting, and resolving streaming providers.
 */

import {
  PlaybackProvider,
  PlaybackEmbedResult,
  PlaybackTarget,
  PlaybackProviderDescriptor,
  getProviderDescriptor,
} from "./types";
import { NexStreamAdapter } from "./nexstream";
import { FrameXTVAdapter } from "./framextv";

class ProviderRegistry {
  private providers = new Map<string, PlaybackProvider>();
  private defaultProviderId: string = "nextstream";

  constructor() {
    this.registerDefaultProviders();
  }

  /**
   * Resets the registry to its default production state.
   */
  public reset(): void {
    this.providers.clear();
    this.defaultProviderId = "nextstream";
    this.registerDefaultProviders();
  }

  private registerDefaultProviders(): void {
    const nextstream = new NexStreamAdapter();
    this.providers.set(nextstream.id, nextstream);

    // Register FrameXTV (disabled by default in production)
    const framextv = new FrameXTVAdapter();
    this.providers.set(framextv.id, framextv);
  }

  /**
   * Registers a playback provider adapter.
   */
  public register(provider: PlaybackProvider): void {
    if (!provider || !provider.id) {
      throw new Error("Invalid provider: missing ID");
    }
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregisters a provider by its ID.
   */
  public unregister(id: string): boolean {
    return this.providers.delete(id);
  }

  /**
   * Retrieves a registered provider by ID.
   */
  public get(id: string): PlaybackProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Sets the default provider ID.
   */
  public setDefaultId(id: string): void {
    if (!this.providers.has(id)) {
      throw new Error(`Cannot set default provider: '${id}' is not registered.`);
    }
    this.defaultProviderId = id;
  }

  /**
   * Returns all registered providers.
   */
  public getAll(): PlaybackProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Returns all providers that are currently available and enabled.
   */
  public getAvailable(): PlaybackProvider[] {
    return this.getAll().filter((p) => {
      if (typeof p.isAvailable === "function") {
        return p.isAvailable();
      }
      return p.isConfigured();
    });
  }

  /**
   * Returns public descriptors of all registered providers.
   */
  public getDescriptors(): PlaybackProviderDescriptor[] {
    return this.getAll().map(getProviderDescriptor);
  }

  /**
   * Returns public descriptors of available providers.
   */
  public getAvailableDescriptors(): PlaybackProviderDescriptor[] {
    return this.getAvailable().map(getProviderDescriptor);
  }

  /**
   * Retrieves the active default provider.
   */
  public getDefault(): PlaybackProvider {
    const provider = this.providers.get(this.defaultProviderId);
    if (provider) {
      return provider;
    }
    // Fallback to first available provider
    const available = this.getAvailable();
    if (available.length > 0) {
      return available[0];
    }
    // Fallback to instantiated NexStream adapter
    return new NexStreamAdapter();
  }

  /**
   * Resolves playback using an explicitly specified provider, or falls back to the default provider.
   */
  public async resolve(
    target: PlaybackTarget,
    providerId?: string
  ): Promise<PlaybackEmbedResult> {
    const selectedId = providerId || this.defaultProviderId;
    const provider = this.providers.get(selectedId);

    if (!provider) {
      return {
        status: "unavailable",
        providerId: selectedId,
        providerName: selectedId,
        reason: `Requested playback provider '${selectedId}' is not registered.`,
        target,
      };
    }

    const isAvail =
      typeof provider.isAvailable === "function"
        ? provider.isAvailable()
        : provider.isConfigured();

    if (!isAvail) {
      return {
        status: "unavailable",
        providerId: provider.id,
        providerName: provider.name,
        reason: `Playback provider '${provider.name}' is currently unavailable or disabled.`,
        target,
      };
    }

    // Verify media type support
    if (
      provider.supportedMediaTypes &&
      !provider.supportedMediaTypes.includes(target.mediaType)
    ) {
      return {
        status: "invalid_input",
        providerId: provider.id,
        providerName: provider.name,
        reason: `Provider '${provider.name}' does not support media type '${target.mediaType}'.`,
        target,
      };
    }

    return provider.resolvePlayback(target);
  }
}

// Global singleton instance
export const playbackRegistry = new ProviderRegistry();

// Functional exports conforming to BingeByte conventions
export function registerPlaybackProvider(provider: PlaybackProvider): void {
  playbackRegistry.register(provider);
}

export function unregisterPlaybackProvider(id: string): boolean {
  return playbackRegistry.unregister(id);
}

export function getPlaybackProvider(id: string): PlaybackProvider | undefined {
  return playbackRegistry.get(id);
}

export function getAllPlaybackProviders(): PlaybackProvider[] {
  return playbackRegistry.getAll();
}

export function getAvailablePlaybackProviders(): PlaybackProvider[] {
  return playbackRegistry.getAvailable();
}

export function getProviderDescriptors(): PlaybackProviderDescriptor[] {
  return playbackRegistry.getDescriptors();
}

export function getAvailableProviderDescriptors(): PlaybackProviderDescriptor[] {
  return playbackRegistry.getAvailableDescriptors();
}

export function getDefaultPlaybackProvider(): PlaybackProvider {
  return playbackRegistry.getDefault();
}

export function setDefaultPlaybackProviderId(id: string): void {
  playbackRegistry.setDefaultId(id);
}

export function resolvePlaybackWithProvider(
  target: PlaybackTarget,
  providerId?: string
): Promise<PlaybackEmbedResult> {
  return playbackRegistry.resolve(target, providerId);
}

export function resetProviderRegistry(): void {
  playbackRegistry.reset();
}
