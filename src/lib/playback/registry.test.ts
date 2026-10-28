import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  registerPlaybackProvider,
  unregisterPlaybackProvider,
  getPlaybackProvider,
  getAllPlaybackProviders,
  getAvailablePlaybackProviders,
  getDefaultPlaybackProvider,
  setDefaultPlaybackProviderId,
  resolvePlaybackWithProvider,
  resetProviderRegistry,
  getAvailableProviderDescriptors,
} from "./registry";
import type {
  PlaybackProvider,
  PlaybackEmbedResult,
  PlaybackTarget,
  PlaybackMediaType,
} from "./types";

describe("Provider-Neutral Playback Registry", () => {
  beforeEach(() => {
    resetProviderRegistry();
  });

  afterEach(() => {
    resetProviderRegistry();
  });

  // Mock test provider fixture for exercising selection and resolution flows
  class MockTestProvider implements PlaybackProvider {
    public readonly id: string;
    public readonly name: string;
    public readonly supportedMediaTypes: ReadonlyArray<PlaybackMediaType>;
    public available: boolean;

    constructor(
      id: string = "mock-provider",
      name: string = "Mock Provider",
      supportedMediaTypes: ReadonlyArray<PlaybackMediaType> = ["movie", "tv"],
      available: boolean = true
    ) {
      this.id = id;
      this.name = name;
      this.supportedMediaTypes = supportedMediaTypes;
      this.available = available;
    }

    public isConfigured(): boolean {
      return true;
    }

    public isAvailable(): boolean {
      return this.available;
    }

    public async getMovieEmbedUrl(tmdbId: number | string): Promise<PlaybackEmbedResult> {
      return {
        status: "ready",
        url: `https://embedmaster.link/movie/${tmdbId}`,
        providerId: this.id,
        providerName: this.name,
        target: { mediaType: "movie", tmdbId: Number(tmdbId) },
      };
    }

    public async getTVEmbedUrl(
      tmdbId: number | string,
      season: number | string,
      episode: number | string
    ): Promise<PlaybackEmbedResult> {
      return {
        status: "ready",
        url: `https://embedmaster.link/tv/${tmdbId}/${season}/${episode}`,
        providerId: this.id,
        providerName: this.name,
        target: {
          mediaType: "tv",
          tmdbId: Number(tmdbId),
          season: Number(season),
          episode: Number(episode),
        },
      };
    }

    public async resolvePlayback(target: PlaybackTarget): Promise<PlaybackEmbedResult> {
      if (target.mediaType === "movie") {
        return this.getMovieEmbedUrl(target.tmdbId);
      }
      return this.getTVEmbedUrl(target.tmdbId, target.season, target.episode);
    }
  }

  describe("Provider Registration and Lookup", () => {
    it("should initialize with NextStream and FrameXTV registered by default", () => {
      const all = getAllPlaybackProviders();
      assert.strictEqual(all.length >= 2, true);
      assert.strictEqual(all.some((p) => p.id === "nextstream"), true);
      assert.strictEqual(all.some((p) => p.id === "framextv"), true);
    });

    it("should register and retrieve a custom provider by ID", () => {
      const mock = new MockTestProvider("test-1", "Test Provider 1");
      registerPlaybackProvider(mock);

      const retrieved = getPlaybackProvider("test-1");
      assert.ok(retrieved);
      assert.strictEqual(retrieved.id, "test-1");
      assert.strictEqual(retrieved.name, "Test Provider 1");
    });

    it("should unregister a provider correctly", () => {
      const mock = new MockTestProvider("temp-provider", "Temp");
      registerPlaybackProvider(mock);
      assert.ok(getPlaybackProvider("temp-provider"));

      const removed = unregisterPlaybackProvider("temp-provider");
      assert.strictEqual(removed, true);
      assert.strictEqual(getPlaybackProvider("temp-provider"), undefined);
    });

    it("should throw when registering an invalid provider without an ID", () => {
      assert.throws(() => {
        registerPlaybackProvider({} as unknown as PlaybackProvider);
      }, /missing ID/i);
    });
  });

  describe("Availability and Descriptors", () => {
    it("should distinguish available providers from disabled providers", () => {
      const enabled = new MockTestProvider("enabled-provider", "Enabled", ["movie"], true);
      const disabled = new MockTestProvider("disabled-provider", "Disabled", ["movie"], false);

      registerPlaybackProvider(enabled);
      registerPlaybackProvider(disabled);

      const available = getAvailablePlaybackProviders();
      assert.strictEqual(available.some((p) => p.id === "enabled-provider"), true);
      assert.strictEqual(available.some((p) => p.id === "disabled-provider"), false);

      const descriptors = getAvailableProviderDescriptors();
      assert.strictEqual(descriptors.some((d) => d.id === "enabled-provider"), true);
      assert.strictEqual(descriptors.some((d) => d.id === "disabled-provider"), false);
    });

    it("should keep FrameXTV disabled by default in production", () => {
      const originalEnv = process.env.ENABLE_FRAMEXTV_PROVIDER;
      delete process.env.ENABLE_FRAMEXTV_PROVIDER;

      try {
        resetProviderRegistry();
        const available = getAvailablePlaybackProviders();
        assert.strictEqual(available.some((p) => p.id === "framextv"), false);
      } finally {
        process.env.ENABLE_FRAMEXTV_PROVIDER = originalEnv;
      }
    });
  });

  describe("Default Provider Selection and Fallbacks", () => {
    it("should return NextStream as the initial default provider", () => {
      const defaultProvider = getDefaultPlaybackProvider();
      assert.strictEqual(defaultProvider.id, "nextstream");
    });

    it("should allow setting a custom default provider ID", () => {
      const mock = new MockTestProvider("custom-default", "Custom Default");
      registerPlaybackProvider(mock);

      setDefaultPlaybackProviderId("custom-default");
      assert.strictEqual(getDefaultPlaybackProvider().id, "custom-default");
    });

    it("should throw when setting default to an unregistered provider ID", () => {
      assert.throws(() => {
        setDefaultPlaybackProviderId("non-existent");
      }, /is not registered/i);
    });
  });

  describe("Resolution with Provider Selection", () => {
    it("should resolve movie playback using the specified provider", async () => {
      const mock = new MockTestProvider("custom-p", "Custom P");
      registerPlaybackProvider(mock);

      const target: PlaybackTarget = { mediaType: "movie", tmdbId: 550 };
      const res = await resolvePlaybackWithProvider(target, "custom-p");

      assert.strictEqual(res.status, "ready");
      assert.strictEqual(res.providerId, "custom-p");
      if (res.status === "ready") {
        assert.strictEqual(res.url, "https://embedmaster.link/movie/550");
      }
    });

    it("should resolve TV playback using the specified provider preserving season and episode", async () => {
      const mock = new MockTestProvider("custom-tv", "Custom TV");
      registerPlaybackProvider(mock);

      const target: PlaybackTarget = {
        mediaType: "tv",
        tmdbId: 1399,
        season: 2,
        episode: 5,
      };
      const res = await resolvePlaybackWithProvider(target, "custom-tv");

      assert.strictEqual(res.status, "ready");
      assert.strictEqual(res.providerId, "custom-tv");
      if (res.status === "ready") {
        assert.strictEqual(res.url, "https://embedmaster.link/tv/1399/2/5");
        assert.strictEqual(res.target.tmdbId, 1399);
        if (res.target.mediaType === "tv") {
          assert.strictEqual(res.target.season, 2);
          assert.strictEqual(res.target.episode, 5);
        }
      }
    });

    it("should return unavailable status when an unregistered provider is requested", async () => {
      const target: PlaybackTarget = { mediaType: "movie", tmdbId: 550 };
      const res = await resolvePlaybackWithProvider(target, "unregistered-id");

      assert.strictEqual(res.status, "unavailable");
      assert.strictEqual(res.providerId, "unregistered-id");
      assert.match(res.reason, /not registered/i);
    });

    it("should return unavailable status when a disabled provider is requested", async () => {
      const disabled = new MockTestProvider("offline-p", "Offline", ["movie"], false);
      registerPlaybackProvider(disabled);

      const target: PlaybackTarget = { mediaType: "movie", tmdbId: 550 };
      const res = await resolvePlaybackWithProvider(target, "offline-p");

      assert.strictEqual(res.status, "unavailable");
      assert.match(res.reason, /unavailable or disabled/i);
    });

    it("should reject resolution when media type is not supported by the provider", async () => {
      // Provider that only supports movies
      const movieOnly = new MockTestProvider("movie-only", "Movies Only", ["movie"], true);
      registerPlaybackProvider(movieOnly);

      const tvTarget: PlaybackTarget = { mediaType: "tv", tmdbId: 1399, season: 1, episode: 1 };
      const res = await resolvePlaybackWithProvider(tvTarget, "movie-only");

      assert.strictEqual(res.status, "invalid_input");
      assert.match(res.reason, /does not support media type 'tv'/i);
    });
  });
});
