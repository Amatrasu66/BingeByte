import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  NexStreamAdapter,
  getDefaultPlaybackProvider,
  isValidPositiveInteger,
  isValidNonNegativeInteger,
  sanitizeBaseUrl,
  isValidSourceUrl,
} from "./index";
import type { PlaybackTarget } from "./types";

describe("Phase 9 Playback Provider Adapter (NextStream)", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      NEXSTREAM_BASE_URL: "https://api.codespecters.com",
      NEXSTREAM_API_KEY: "mock_test_key_12345",
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
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

    it("should validate source URLs", () => {
      assert.strictEqual(isValidSourceUrl("https://embedmaster.link/movie/550"), true);
      assert.strictEqual(isValidSourceUrl("http://embedmaster.link/tv/1399/1/1"), true);
      assert.strictEqual(isValidSourceUrl("javascript:alert(1)"), false);
      assert.strictEqual(isValidSourceUrl("not-a-url"), false);
      assert.strictEqual(isValidSourceUrl(null), false);
    });
  });

  describe("Movie Stream Resolution via Server-Side API", () => {
    it("should request /api/movie/{id} with apiKey and return ready status with clean source", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            success: true,
            type: "movie",
            tmdbId: "550",
            sources: [
              {
                name: "CodeSpecter",
                url: "https://embedmaster.link/movie/550",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getMovieEmbedUrl(550);

      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        assert.strictEqual(result.url, "https://embedmaster.link/movie/550");
        assert.strictEqual(result.providerName, "NextStream");
        assert.strictEqual(result.target.tmdbId, 550);
      }

      // Verify that the server called the API with the apiKey
      assert.ok(capturedUrl.includes("/api/movie/550"));
      assert.ok(capturedUrl.includes("apikey=mock_test_key_12345"));
    });

    it("should return unavailable status when provider returns empty sources", async () => {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            success: true,
            type: "movie",
            tmdbId: "9999999",
            sources: [],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getMovieEmbedUrl(9999999);

      assert.strictEqual(result.status, "unavailable");
      assert.match(result.reason, /no playable streaming source/i);
    });
  });

  describe("TV Episode Stream Resolution via Server-Side API", () => {
    it("should request /api/tv/{id}/{season}/{episode} and return ready status", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            success: true,
            type: "tv",
            tmdbId: "1399",
            season: "1",
            episode: "1",
            sources: [
              {
                name: "CodeSpecter",
                url: "https://embedmaster.link/tv/1399/1/1",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getTVEmbedUrl(1399, 1, 1);

      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        assert.strictEqual(result.url, "https://embedmaster.link/tv/1399/1/1");
        assert.strictEqual(result.target.mediaType, "tv");
        assert.strictEqual((result.target as { season: number }).season, 1);
        assert.strictEqual((result.target as { episode: number }).episode, 1);
      }

      assert.ok(capturedUrl.includes("/api/tv/1399/1/1"));
    });

    it("should support season 0 specials", async () => {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            success: true,
            type: "tv",
            tmdbId: "1399",
            season: "0",
            episode: "1",
            sources: [{ name: "CodeSpecter", url: "https://embedmaster.link/tv/1399/0/1" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getTVEmbedUrl(1399, 0, 1);

      assert.strictEqual(result.status, "ready");
      if (result.status === "ready") {
        assert.strictEqual(result.url, "https://embedmaster.link/tv/1399/0/1");
      }
    });
  });

  describe("Authentication, Network & Upstream Error Handling", () => {
    it("should handle 401 unauthorized response with auth_error status", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ error: "Invalid API Key." }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getMovieEmbedUrl(550);

      assert.strictEqual(result.status, "auth_error");
      assert.match(result.reason, /authentication failed/i);
    });

    it("should handle 500 error response with api_error status", async () => {
      globalThis.fetch = (async () => {
        return new Response("Internal Server Error", { status: 500 });
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getMovieEmbedUrl(550);

      assert.strictEqual(result.status, "api_error");
      assert.match(result.reason, /status 500/i);
    });

    it("should handle network connection failure with api_error status", async () => {
      globalThis.fetch = (async () => {
        throw new TypeError("fetch failed: ECONNRESET");
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const result = await provider.getMovieEmbedUrl(550);

      assert.strictEqual(result.status, "api_error");
      assert.match(result.reason, /unable to reach/i);
    });
  });

  describe("Validation of Invalid Parameters", () => {
    const provider = new NexStreamAdapter();

    it("should reject negative or zero movie IDs", async () => {
      const resNeg = await provider.getMovieEmbedUrl(-550);
      assert.strictEqual(resNeg.status, "invalid_input");

      const resZero = await provider.getMovieEmbedUrl(0);
      assert.strictEqual(resZero.status, "invalid_input");

      const resString = await provider.getMovieEmbedUrl("invalid_id");
      assert.strictEqual(resString.status, "invalid_input");
    });

    it("should reject invalid TV season numbers", async () => {
      const resNegSeason = await provider.getTVEmbedUrl(1399, -1, 1);
      assert.strictEqual(resNegSeason.status, "invalid_input");
      assert.match(resNegSeason.reason, /season/i);
    });

    it("should reject invalid TV episode numbers", async () => {
      const resZeroEp = await provider.getTVEmbedUrl(1399, 1, 0);
      assert.strictEqual(resZeroEp.status, "invalid_input");
      assert.match(resZeroEp.reason, /episode/i);

      const resNegEp = await provider.getTVEmbedUrl(1399, 1, -2);
      assert.strictEqual(resNegEp.status, "invalid_input");
    });
  });

  describe("Missing Environment Configuration", () => {
    it("should report unconfigured status when API key is missing", async () => {
      delete process.env.NEXSTREAM_API_KEY;
      delete process.env.NEXTSTREAM_API_KEY;

      const provider = new NexStreamAdapter({
        baseUrl: "https://api.codespecters.com",
        apiKey: undefined,
      });

      const result = await provider.getMovieEmbedUrl(550);
      assert.strictEqual(result.status, "unconfigured");
      assert.match(result.reason, /API key/i);
    });
  });

  describe("Generic resolvePlayback & Unsupported Media Types", () => {
    it("should resolve movie targets via resolvePlayback", async () => {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            success: true,
            sources: [{ name: "CodeSpecter", url: "https://embedmaster.link/movie/680" }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const provider = new NexStreamAdapter();
      const target: PlaybackTarget = { mediaType: "movie", tmdbId: 680 };
      const res = await provider.resolvePlayback(target);

      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.strictEqual(res.url, "https://embedmaster.link/movie/680");
      }
    });

    it("should return invalid_input for unsupported media types", async () => {
      const provider = new NexStreamAdapter();
      const target = {
        mediaType: "game",
        tmdbId: 100,
      } as unknown as PlaybackTarget;

      const res = await provider.resolvePlayback(target);
      assert.strictEqual(res.status, "invalid_input");
      assert.match(res.reason, /unsupported media type/i);
    });
  });

  describe("Factory getDefaultPlaybackProvider", () => {
    it("should instantiate default NexStreamAdapter with configured name and id", () => {
      const provider = getDefaultPlaybackProvider();
      assert.strictEqual(provider.id, "nextstream");
      assert.strictEqual(provider.name, "NextStream");
    });
  });
});
