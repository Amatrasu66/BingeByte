import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  FrameXTVAdapter,
  FRAMEXTV_DEFAULT_BASE_URL,
  FRAMEXTV_DOCUMENTED_SERVERS,
  FRAMEXTV_EXTRACTION_SERVERS,
  isValidFrameXMessageOrigin,
} from "./framextv";

describe("Phase 14B FrameXTV Adapter (Verified Contract)", () => {
  describe("Production Disabled Safeguard", () => {
    it("should be disabled by default in production", () => {
      const adapter = new FrameXTVAdapter();
      assert.strictEqual(adapter.isAvailable(), false);
      assert.strictEqual(adapter.id, "framextv");
      assert.strictEqual(adapter.name, "FrameXTV");
      assert.deepStrictEqual(adapter.supportedMediaTypes, ["movie", "tv"]);
      assert.strictEqual(FRAMEXTV_DEFAULT_BASE_URL, "https://framextv.xyz");
    });

    it("should return unavailable status when queried while disabled", async () => {
      const adapter = new FrameXTVAdapter();
      const movieRes = await adapter.getMovieEmbedUrl(550);

      assert.strictEqual(movieRes.status, "unavailable");
      assert.strictEqual(movieRes.providerId, "framextv");
      assert.match(movieRes.reason, /disabled pending terms and embedding verification/i);

      const tvRes = await adapter.getTVEmbedUrl(1399, 1, 1);
      assert.strictEqual(tvRes.status, "unavailable");
    });
  });

  describe("Embed URL Resolution When Enabled (Test Mode)", () => {
    const enabledAdapter = new FrameXTVAdapter({ enabled: true });

    it("should resolve officially documented movie embed URL (/embed/{id}) with extraction servers", async () => {
      const res = await enabledAdapter.getMovieEmbedUrl(550);
      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.strictEqual(res.url, `${FRAMEXTV_DEFAULT_BASE_URL}/embed/550`);
        assert.strictEqual(res.providerId, "framextv");
        assert.strictEqual(res.target.tmdbId, 550);

        // Verify documented extraction servers are mapped
        assert.ok(Array.isArray(res.sources));
        assert.strictEqual(res.sources.length, FRAMEXTV_EXTRACTION_SERVERS.length);
        assert.strictEqual(res.sources[0].serverId, "barbarian");
        assert.match(res.sources[0].name, /Barbarian I/);
        assert.strictEqual(
          res.sources[0].url,
          `${FRAMEXTV_DEFAULT_BASE_URL}/embed/550?server=barbarian`
        );
      }
    });

    it("should resolve officially documented TV embed URL (/embed/{id}/{s}/{e}) with extraction servers", async () => {
      const res = await enabledAdapter.getTVEmbedUrl(1399, 2, 4);
      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.strictEqual(res.url, `${FRAMEXTV_DEFAULT_BASE_URL}/embed/1399/2/4`);
        assert.strictEqual(res.target.tmdbId, 1399);
        if (res.target.mediaType === "tv") {
          assert.strictEqual(res.target.season, 2);
          assert.strictEqual(res.target.episode, 4);
        }

        assert.ok(Array.isArray(res.sources));
        assert.strictEqual(res.sources.length, FRAMEXTV_DOCUMENTED_SERVERS.length);
        assert.strictEqual(res.sources[1].serverId, "archer");
        assert.match(res.sources[1].name, /Archer II/);
        assert.strictEqual(
          res.sources[1].url,
          `${FRAMEXTV_DEFAULT_BASE_URL}/embed/1399/2/4?server=archer`
        );
      }
    });

    it("should support season 0 TV specials", async () => {
      const res = await enabledAdapter.getTVEmbedUrl(1399, 0, 1);
      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.strictEqual(res.url, `${FRAMEXTV_DEFAULT_BASE_URL}/embed/1399/0/1`);
      }
    });

    it("should support legacy patterns when useLegacyPatterns is explicitly enabled", async () => {
      const legacyAdapter = new FrameXTVAdapter({ enabled: true, useLegacyPatterns: true });
      const movieRes = await legacyAdapter.getMovieEmbedUrl(550);
      assert.strictEqual(movieRes.status, "ready");
      if (movieRes.status === "ready") {
        assert.strictEqual(movieRes.url, `${FRAMEXTV_DEFAULT_BASE_URL}/embed/movie/550`);
      }

      const tvRes = await legacyAdapter.getTVEmbedUrl(1399, 1, 2);
      assert.strictEqual(tvRes.status, "ready");
      if (tvRes.status === "ready") {
        assert.strictEqual(tvRes.url, `${FRAMEXTV_DEFAULT_BASE_URL}/embed/tv/1399/1/2`);
      }
    });

    it("should resolve generically via resolvePlayback()", async () => {
      const movieRes = await enabledAdapter.resolvePlayback({
        mediaType: "movie",
        tmdbId: 687163,
      });
      assert.strictEqual(movieRes.status, "ready");

      const tvRes = await enabledAdapter.resolvePlayback({
        mediaType: "tv",
        tmdbId: 1399,
        season: 1,
        episode: 1,
      });
      assert.strictEqual(tvRes.status, "ready");
    });
  });

  describe("Input Parameter Validation", () => {
    const adapter = new FrameXTVAdapter({ enabled: true });

    it("should reject negative or zero movie IDs", async () => {
      const zero = await adapter.getMovieEmbedUrl(0);
      assert.strictEqual(zero.status, "invalid_input");

      const neg = await adapter.getMovieEmbedUrl(-5);
      assert.strictEqual(neg.status, "invalid_input");

      const nan = await adapter.getMovieEmbedUrl("invalid");
      assert.strictEqual(nan.status, "invalid_input");
    });

    it("should reject negative TV season numbers", async () => {
      const res = await adapter.getTVEmbedUrl(1399, -1, 1);
      assert.strictEqual(res.status, "invalid_input");
    });

    it("should reject non-positive TV episode numbers", async () => {
      const zeroEp = await adapter.getTVEmbedUrl(1399, 1, 0);
      assert.strictEqual(zeroEp.status, "invalid_input");

      const negEp = await adapter.getTVEmbedUrl(1399, 1, -2);
      assert.strictEqual(negEp.status, "invalid_input");
    });
  });

  describe("PostMessage Origin Security Validation", () => {
    it("should accept approved FrameXTV domains", () => {
      assert.strictEqual(isValidFrameXMessageOrigin("https://framextv.tech"), true);
      assert.strictEqual(isValidFrameXMessageOrigin("https://framextv.cc"), true);
      assert.strictEqual(isValidFrameXMessageOrigin("https://framextv.xyz"), true);
      assert.strictEqual(isValidFrameXMessageOrigin("https://framextv.pro"), true);
      assert.strictEqual(isValidFrameXMessageOrigin("https://player.framextv.tech"), true);
    });

    it("should reject untrusted or spoofed origins", () => {
      assert.strictEqual(isValidFrameXMessageOrigin("https://framextv.tech.attacker.com"), false);
      assert.strictEqual(isValidFrameXMessageOrigin("https://fake-framextv.tech"), false);
      assert.strictEqual(isValidFrameXMessageOrigin("https://evil.com"), false);
      assert.strictEqual(isValidFrameXMessageOrigin(""), false);
    });
  });
});
