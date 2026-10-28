import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  FrameXTVAdapter,
  FRAMEXTV_DEFAULT_BASE_URL,
  FRAMEXTV_DOCUMENTED_SERVERS,
  FRAMEXTV_EXTRACTION_SERVERS,
  isValidFrameXMessageOrigin,
  parseFrameXTelemetryEvent,
  createFrameXCommandMessage,
} from "./framextv";

describe("Phase 14C FrameXTV Controlled Integration & Provider Readiness", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.ENABLE_FRAMEXTV_PROVIDER;
    delete process.env.FRAMEXTV_PRODUCTION_APPROVED;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Production Disabled Safeguard & Dual-Guard Gating", () => {
    it("should be disabled by default in production and development", () => {
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

    it("should enable in non-production when ENABLE_FRAMEXTV_PROVIDER=true", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "development";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";

      const adapter = new FrameXTVAdapter();
      assert.strictEqual(adapter.isAvailable(), true);
    });

    it("should remain BLOCKED in production if ENABLE_FRAMEXTV_PROVIDER=true without FRAMEXTV_PRODUCTION_APPROVED=true", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";

      const adapter = new FrameXTVAdapter();
      assert.strictEqual(adapter.isAvailable(), false);
    });

    it("should only enable in production when explicitly approved via FRAMEXTV_PRODUCTION_APPROVED=true", () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      process.env.ENABLE_FRAMEXTV_PROVIDER = "true";
      process.env.FRAMEXTV_PRODUCTION_APPROVED = "true";

      const adapter = new FrameXTVAdapter();
      assert.strictEqual(adapter.isAvailable(), true);
    });
  });

  describe("Embed URL Resolution with Neutral Extraction Server Names", () => {
    const enabledAdapter = new FrameXTVAdapter({ enabled: true });

    it("should resolve officially documented movie embed URL (/embed/{id}) with neutral server names", async () => {
      const res = await enabledAdapter.getMovieEmbedUrl(550);
      assert.strictEqual(res.status, "ready");
      if (res.status === "ready") {
        assert.strictEqual(res.url, `${FRAMEXTV_DEFAULT_BASE_URL}/embed/550`);
        assert.strictEqual(res.providerId, "framextv");
        assert.strictEqual(res.target.tmdbId, 550);

        // Verify documented extraction servers are mapped with neutral labels
        assert.ok(Array.isArray(res.sources));
        assert.strictEqual(res.sources.length, FRAMEXTV_EXTRACTION_SERVERS.length);
        assert.strictEqual(res.sources[0].serverId, "barbarian");
        assert.strictEqual(res.sources[0].name, "Barbarian");
        assert.strictEqual(
          res.sources[0].url,
          `${FRAMEXTV_DEFAULT_BASE_URL}/embed/550?server=barbarian`
        );
        assert.strictEqual(res.sources[1].serverId, "archer");
        assert.strictEqual(res.sources[1].name, "Archer");
        assert.strictEqual(res.sources[2].serverId, "goblin");
        assert.strictEqual(res.sources[2].name, "Goblin");
        assert.strictEqual(res.sources[3].serverId, "pekka");
        assert.strictEqual(res.sources[3].name, "Pekka");
      }
    });

    it("should resolve officially documented TV embed URL (/embed/{id}/{s}/{e}) with neutral server names", async () => {
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
        assert.strictEqual(res.sources[1].name, "Archer");
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

  describe("PostMessage Security & Telemetry Event Parsing", () => {
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

    it("should parse valid FrameXTV telemetry events from approved origins", () => {
      const mockWindow = {};
      const telemetry = parseFrameXTelemetryEvent(
        { event: "frameXTV:timeupdate", currentTime: 42.5, duration: 120.0 },
        "https://framextv.cc",
        mockWindow,
        mockWindow
      );

      assert.deepStrictEqual(telemetry, {
        event: "frameXTV:timeupdate",
        currentTime: 42.5,
        duration: 120.0,
      });
    });

    it("should reject telemetry events from unauthorized origins", () => {
      const telemetry = parseFrameXTelemetryEvent(
        { event: "frameXTV:timeupdate", currentTime: 10, duration: 100 },
        "https://malicious-site.com"
      );
      assert.strictEqual(telemetry, null);
    });

    it("should reject telemetry events with mismatched source windows", () => {
      const expectedWindow = {};
      const rogueWindow = {};
      const telemetry = parseFrameXTelemetryEvent(
        { event: "frameXTV:timeupdate", currentTime: 10, duration: 100 },
        "https://framextv.cc",
        rogueWindow,
        expectedWindow
      );
      assert.strictEqual(telemetry, null);
    });

    it("should reject malformed or negative telemetry data", () => {
      assert.strictEqual(
        parseFrameXTelemetryEvent(
          { event: "frameXTV:timeupdate", currentTime: -5, duration: 100 },
          "https://framextv.cc"
        ),
        null
      );
      assert.strictEqual(
        parseFrameXTelemetryEvent(
          { event: "other_event", currentTime: 10, duration: 100 },
          "https://framextv.cc"
        ),
        null
      );
      assert.strictEqual(parseFrameXTelemetryEvent(null, "https://framextv.cc"), null);
    });

    it("should construct valid, hardened command messages", () => {
      // Basic actions
      assert.deepStrictEqual(createFrameXCommandMessage("play"), { action: "play" });
      assert.deepStrictEqual(createFrameXCommandMessage("pause"), { action: "pause" });
      assert.deepStrictEqual(createFrameXCommandMessage("mute"), { action: "mute" });

      // Seek
      assert.deepStrictEqual(createFrameXCommandMessage("seek", { time: 120 }), {
        action: "seek",
        time: 120,
      });
      assert.strictEqual(createFrameXCommandMessage("seek", { time: -10 }), null);

      // Volume clamping (0.0 to 1.0)
      assert.deepStrictEqual(createFrameXCommandMessage("setVolume", { volume: 0.8 }), {
        action: "setVolume",
        volume: 0.8,
      });
      assert.deepStrictEqual(createFrameXCommandMessage("setVolume", { volume: 1.5 }), {
        action: "setVolume",
        volume: 1.0,
      });
      assert.deepStrictEqual(createFrameXCommandMessage("setVolume", { volume: -0.5 }), {
        action: "setVolume",
        volume: 0.0,
      });

      // Provider selection
      assert.deepStrictEqual(
        createFrameXCommandMessage("setProvider", { provider: "archer" }),
        { action: "setProvider", provider: "archer" }
      );
    });
  });
});
