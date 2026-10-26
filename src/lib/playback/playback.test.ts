import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  NexStreamAdapter,
  getDefaultPlaybackProvider,
  isValidPositiveInteger,
  isValidNonNegativeInteger,
  sanitizeBaseUrl,
} from "./index";
import type { PlaybackTarget } from "./types";

describe("Phase 8 Playback Provider Adapter (NexStream)", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Input & Base URL Validation Helpers", () => {
    it("should accurately validate positive integers", () => {
      assert.strictEqual(isValidPositiveInteger(1), true);
      assert.strictEqual(isValidPositiveInteger(550), true);
      assert.strictEqual(isValidPositiveInteger("550"), true);
      assert.strictEqual(isValidPositiveInteger("1399"), true);

      assert.strictEqual(isValidPositiveInteger(0), false);
      assert.strictEqual(isValidPositiveInteger(-1), false);
      assert.strictEqual(isValidPositiveInteger(3.14), false);
      assert.strictEqual(isValidPositiveInteger("abc"), false);
      assert.strictEqual(isValidPositiveInteger("550<script>"), false);
      assert.strictEqual(isValidPositiveInteger(null), false);
      assert.strictEqual(isValidPositiveInteger(undefined), false);
    });

    it("should accurately validate non-negative integers (allowing season 0 specials)", () => {
      assert.strictEqual(isValidNonNegativeInteger(0), true);
      assert.strictEqual(isValidNonNegativeInteger("0"), true);
      assert.strictEqual(isValidNonNegativeInteger(1), true);
      assert.strictEqual(isValidNonNegativeInteger("5"), true);

      assert.strictEqual(isValidNonNegativeInteger(-1), false);
      assert.strictEqual(isValidNonNegativeInteger("-5"), false);
      assert.strictEqual(isValidNonNegativeInteger("special"), false);
      assert.strictEqual(isValidNonNegativeInteger(null), false);
    });

    it("should sanitize base URLs and strip trailing slashes", () => {
      assert.strictEqual(
        sanitizeBaseUrl("https://api.codespecters.com/"),
        "https://api.codespecters.com"
      );
      assert.strictEqual(
        sanitizeBaseUrl("https://api.codespecters.com///"),
        "https://api.codespecters.com"
      );
      assert.strictEqual(
        sanitizeBaseUrl("http://localhost:8080"),
        "http://localhost:8080"
      );
      assert.strictEqual(sanitizeBaseUrl("javascript:alert(1)"), null);
      assert.strictEqual(sanitizeBaseUrl("not-a-valid-url"), null);
      assert.strictEqual(sanitizeBaseUrl(""), null);
      assert.strictEqual(sanitizeBaseUrl(undefined), null);
    });
  });

  describe("Authorization & Verification Gate", () => {
    it("should keep provider unverified and gated by default", () => {
      delete process.env.PLAYBACK_PROVIDER_ENABLED;
      delete process.env.ENABLE_EMBED_PLAYBACK;
      delete process.env.NEXSTREAM_ENABLED;

      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "mock_test_key",
      });

      assert.strictEqual(provider.isConfigured(), true);
      assert.strictEqual(provider.isAuthorized(), false);

      const result = provider.getMovieEmbedUrl(550);
      assert.strictEqual(result.status, "unverified");
      assert.strictEqual(result.providerId, "nexstream");
      assert.match(result.reason, /gated pending verification/i);
    });

    it("should allow verified execution when explicit configuration flag is set to true", () => {
      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "mock_test_key",
        isVerified: true,
      });

      assert.strictEqual(provider.isAuthorized(), true);

      const result = provider.getMovieEmbedUrl(550);
      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        assert.ok(result.url.includes("/embed/movie/550"));
        assert.ok(result.url.includes("apikey=mock_test_key"));
      }
    });

    it("should respect environment variable verification flags", () => {
      process.env.PLAYBACK_PROVIDER_ENABLED = "true";

      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "mock_test_key",
      });

      assert.strictEqual(provider.isAuthorized(), true);
      const result = provider.getMovieEmbedUrl(680);
      assert.strictEqual(result.status, "ready");
    });
  });

  describe("Movie Embed URL Construction", () => {
    it("should construct verified movie embed URL with correct path and query parameters", () => {
      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "test_key_123",
        isVerified: true,
      });

      const result = provider.getMovieEmbedUrl(550);
      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        const url = new URL(result.url);
        assert.strictEqual(url.origin, "https://api.codespecters.com");
        assert.strictEqual(url.pathname, "/embed/movie/550");
        assert.strictEqual(url.searchParams.get("apikey"), "test_key_123");
        assert.strictEqual(result.target.mediaType, "movie");
        assert.strictEqual(result.target.tmdbId, 550);
      }
    });

    it("should accept valid string-formatted IDs", () => {
      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "test_key_123",
        isVerified: true,
      });

      const result = provider.getMovieEmbedUrl("299536");
      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        assert.ok(result.url.includes("/embed/movie/299536"));
      }
    });
  });

  describe("TV Episode Embed URL Construction", () => {
    it("should construct verified TV episode embed URL with season and episode", () => {
      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "test_key_123",
        isVerified: true,
      });

      const result = provider.getTVEmbedUrl(1399, 2, 5);
      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        const url = new URL(result.url);
        assert.strictEqual(url.origin, "https://api.codespecters.com");
        assert.strictEqual(url.pathname, "/embed/tv/1399/2/5");
        assert.strictEqual(url.searchParams.get("apikey"), "test_key_123");
        assert.strictEqual(result.target.mediaType, "tv");
        assert.strictEqual((result.target as { season: number }).season, 2);
        assert.strictEqual((result.target as { episode: number }).episode, 5);
      }
    });

    it("should support season 0 for TV specials", () => {
      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: "test_key_123",
        isVerified: true,
      });

      const result = provider.getTVEmbedUrl(1399, 0, 1);
      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        const url = new URL(result.url);
        assert.strictEqual(url.pathname, "/embed/tv/1399/0/1");
      }
    });
  });

  describe("Validation of Invalid Parameters", () => {
    const provider = new NexStreamAdapter({
      baseUrl: "https://api.codespecters.com",
      apiKey: "test_key_123",
      isVerified: true,
    });

    it("should reject negative or zero movie IDs", () => {
      const resNeg = provider.getMovieEmbedUrl(-550);
      assert.strictEqual(resNeg.status, "invalid_input");

      const resZero = provider.getMovieEmbedUrl(0);
      assert.strictEqual(resZero.status, "invalid_input");

      const resString = provider.getMovieEmbedUrl("invalid_id");
      assert.strictEqual(resString.status, "invalid_input");
    });

    it("should reject invalid TV season numbers", () => {
      const resNegSeason = provider.getTVEmbedUrl(1399, -1, 1);
      assert.strictEqual(resNegSeason.status, "invalid_input");
      assert.match(resNegSeason.reason, /season/i);
    });

    it("should reject invalid TV episode numbers", () => {
      const resZeroEp = provider.getTVEmbedUrl(1399, 1, 0);
      assert.strictEqual(resZeroEp.status, "invalid_input");
      assert.match(resZeroEp.reason, /episode/i);

      const resNegEp = provider.getTVEmbedUrl(1399, 1, -2);
      assert.strictEqual(resNegEp.status, "invalid_input");
    });
  });

  describe("Missing Environment Configuration", () => {
    it("should report unconfigured status when API key is missing", () => {
      delete process.env.NEXSTREAM_API_KEY;
      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: undefined,
        isVerified: true,
      });

      const result = provider.getMovieEmbedUrl(550);
      assert.strictEqual(result.status, "unconfigured");
      assert.match(result.reason, /API key/i);
      // Ensure reason does not expose internal secrets
      assert.strictEqual(result.reason.includes("test_key"), false);
    });

    it("should report unconfigured status when Base URL is malformed", () => {
      const provider = new NexStreamAdapter({
        baseUrl: "not-a-valid-domain",
        apiKey: "some_secret_key",
        isVerified: true,
      });

      const result = provider.getMovieEmbedUrl(550);
      assert.strictEqual(result.status, "unconfigured");
      assert.match(result.reason, /base URL/i);
      // Ensure reason does not leak secret key
      assert.strictEqual(result.reason.includes("some_secret_key"), false);
    });
  });

  describe("Generic resolvePlayback & Unsupported Media Types", () => {
    const provider = new NexStreamAdapter({
      baseUrl: "https://api.codespecters.com",
      apiKey: "test_key_123",
      isVerified: true,
    });

    it("should resolve movie targets correctly", () => {
      const target: PlaybackTarget = { mediaType: "movie", tmdbId: 680 };
      const res = provider.resolvePlayback(target);
      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.ok(res.url.includes("/embed/movie/680"));
      }
    });

    it("should resolve TV targets correctly", () => {
      const target: PlaybackTarget = {
        mediaType: "tv",
        tmdbId: 1399,
        season: 3,
        episode: 9,
      };
      const res = provider.resolvePlayback(target);
      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.ok(res.url.includes("/embed/tv/1399/3/9"));
      }
    });

    it("should return invalid_input for unsupported media types", () => {
      const target = {
        mediaType: "game",
        tmdbId: 100,
      } as unknown as PlaybackTarget;

      const res = provider.resolvePlayback(target);
      assert.strictEqual(res.status, "invalid_input");
      assert.match(res.reason, /unsupported media type/i);
    });
  });

  describe("Factory getDefaultPlaybackProvider", () => {
    it("should instantiate default NexStreamAdapter with configured name and id", () => {
      const provider = getDefaultPlaybackProvider();
      assert.strictEqual(provider.id, "nexstream");
      assert.strictEqual(provider.name, "NexStream");
    });
  });
});
