import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  FrameXTVAdapter,
  resetProviderRegistry,
  getAvailablePlaybackProviders,
  getAvailableProviderDescriptors,
  resolvePlaybackWithProvider,
  type PlaybackTarget,
} from "./index";

describe("Phase 14D.2 Production Playback Provider Selection & Parity", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_FRAMEXTV_PROVIDER;
    delete process.env.FRAMEXTV_PRODUCTION_APPROVED;
    resetProviderRegistry();
  });

  afterEach(() => {
    process.env = originalEnv;
    resetProviderRegistry();
  });

  describe("Environment Gating & Production Parity Audit", () => {
    it("should keep FrameXTV disabled by default in production and development", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      resetProviderRegistry();

      const descriptors = getAvailableProviderDescriptors();
      assert.strictEqual(descriptors.length, 1);
      assert.strictEqual(descriptors[0].id, "nextstream");
      assert.strictEqual(descriptors.some((d) => d.id === "framextv"), false);
    });

    it("should remain BLOCKED in production if ENABLE_FRAMEXTV_PROVIDER=true without FRAMEXTV_PRODUCTION_APPROVED=true", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      delete process.env.FRAMEXTV_PRODUCTION_APPROVED;
      resetProviderRegistry();

      const descriptors = getAvailableProviderDescriptors();
      assert.strictEqual(descriptors.length, 1);
      assert.strictEqual(descriptors[0].id, "nextstream");
      assert.strictEqual(descriptors.some((d) => d.id === "framextv"), false);

      const adapter = new FrameXTVAdapter();
      assert.strictEqual(adapter.isAvailable(), false);
    });

    it("should enable FrameXTV in production when BOTH ENABLE_FRAMEXTV_PROVIDER=true and FRAMEXTV_PRODUCTION_APPROVED=true are set", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      process.env.FRAMEXTV_PRODUCTION_APPROVED = "true";
      resetProviderRegistry();

      const descriptors = getAvailableProviderDescriptors();
      assert.strictEqual(descriptors.length, 2);
      assert.strictEqual(descriptors.some((d) => d.id === "nextstream"), true);
      assert.strictEqual(descriptors.some((d) => d.id === "framextv"), true);

      const framexDesc = descriptors.find((d) => d.id === "framextv");
      assert.ok(framexDesc);
      assert.strictEqual(framexDesc.isAvailable, true);
      assert.strictEqual(framexDesc.capabilities?.supportsExtractionServers, true);
    });

    it("should handle whitespace, casing, and boolean string variants safely in production environment", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      // Simulate dashboard configuration formatting quirks (e.g. trailing space or uppercase)
      process.env.ENABLE_FRAMEXTV_PROVIDER = " true ";
      process.env.FRAMEXTV_PRODUCTION_APPROVED = "TRUE";
      resetProviderRegistry();

      const descriptors = getAvailableProviderDescriptors();
      assert.strictEqual(descriptors.some((d) => d.id === "framextv"), true);

      const adapter = new FrameXTVAdapter();
      assert.strictEqual(adapter.isAvailable(), true);
    });

    it("should enable in non-production when only ENABLE_FRAMEXTV_PROVIDER=true is configured", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      delete process.env.FRAMEXTV_PRODUCTION_APPROVED;
      resetProviderRegistry();

      const descriptors = getAvailableProviderDescriptors();
      assert.strictEqual(descriptors.length, 2);
      assert.strictEqual(descriptors.some((d) => d.id === "framextv"), true);
    });
  });

  describe("API Resolution & Server Selection Consistency", () => {
    const movieTarget: PlaybackTarget = { mediaType: "movie", tmdbId: 550 };
    const tvTarget: PlaybackTarget = { mediaType: "tv", tmdbId: 1399, season: 1, episode: 1 };

    it("should reject resolution of FrameXTV in production when unapproved", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      delete process.env.FRAMEXTV_PRODUCTION_APPROVED;
      resetProviderRegistry();

      const res = await resolvePlaybackWithProvider(movieTarget, "framextv");
      assert.strictEqual(res.status, "unavailable");
      assert.strictEqual(res.providerId, "framextv");
      assert.match(res.reason, /unavailable or disabled/i);
    });

    it("should resolve FrameXTV with 4 documented servers in production when approved", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      process.env.FRAMEXTV_PRODUCTION_APPROVED = "true";
      resetProviderRegistry();

      const res = await resolvePlaybackWithProvider(movieTarget, "framextv");
      assert.strictEqual(res.status, "ready");
      assert.strictEqual(res.providerId, "framextv");

      if (res.status === "ready") {
        assert.ok(Array.isArray(res.sources));
        assert.strictEqual(res.sources.length, 4);
        assert.strictEqual(res.sources[0].name, "Barbarian");
        assert.strictEqual(res.sources[1].name, "Archer");
        assert.strictEqual(res.sources[2].name, "Goblin");
        assert.strictEqual(res.sources[3].name, "Pekka");
      }
    });

    it("should preserve TV season and episode when switching between providers in approved production", async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      process.env.FRAMEXTV_PRODUCTION_APPROVED = "true";
      resetProviderRegistry();

      // Resolve TV with NexStream
      const nexRes = await resolvePlaybackWithProvider(tvTarget, "nextstream");
      assert.strictEqual(nexRes.status, "ready");
      assert.strictEqual(nexRes.providerId, "nextstream");

      // Switch to FrameXTV
      const framexRes = await resolvePlaybackWithProvider(tvTarget, "framextv");
      assert.strictEqual(framexRes.status, "ready");
      assert.strictEqual(framexRes.providerId, "framextv");
      if (framexRes.status === "ready") {
        assert.match(framexRes.url, /\/embed\/1399\/1\/1/);
      }
    });
  });
});
