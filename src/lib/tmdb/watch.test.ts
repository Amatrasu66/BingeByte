import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseWatchParams,
  isSafeExternalUrl,
  isValidYouTubeKey,
  selectPrimaryTrailer,
  tmdbFetch,
  TMDBNotFoundError,
  TMDBAuthError,
} from "./index";
import type { NormalizedVideo } from "./types";

describe("Phase 7 Watch Parameters, Trailers & Providers", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, TMDB_API_READ_ACCESS_TOKEN: "mock_token" };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  describe("Watch Parameter Validation (parseWatchParams)", () => {
    it("should validate standard movie parameters", () => {
      const result = parseWatchParams({ type: "movie", id: "550" });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.type, "movie");
        assert.strictEqual(result.data.id, 550);
        assert.strictEqual(result.data.season, undefined);
        assert.strictEqual(result.data.episode, undefined);
      }
    });

    it("should validate TV parameters with custom season and episode", () => {
      const result = parseWatchParams({
        type: "tv",
        id: "1399",
        season: "2",
        episode: "5",
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.type, "tv");
        assert.strictEqual(result.data.id, 1399);
        assert.strictEqual(result.data.season, 2);
        assert.strictEqual(result.data.episode, 5);
      }
    });

    it("should default TV season and episode to 1 when omitted", () => {
      const result = parseWatchParams({ type: "tv", id: "1399" });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.season, 1);
        assert.strictEqual(result.data.episode, 1);
      }
    });

    it("should accept season 0 for TV specials", () => {
      const result = parseWatchParams({
        type: "tv",
        id: "1399",
        season: "0",
        episode: "1",
      });
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.season, 0);
      }
    });

    it("should reject missing or invalid media type", () => {
      assert.strictEqual(parseWatchParams({ id: "550" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "", id: "550" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "book", id: "550" }).success, false);
    });

    it("should reject missing, malformed, or negative IDs", () => {
      assert.strictEqual(parseWatchParams({ type: "movie" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "movie", id: "" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "movie", id: "-1" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "movie", id: "0" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "movie", id: "abc" }).success, false);
      assert.strictEqual(parseWatchParams({ type: "movie", id: "12.5" }).success, false);
    });

    it("should reject negative or malformed TV season/episode parameters", () => {
      assert.strictEqual(
        parseWatchParams({ type: "tv", id: "1399", season: "-1" }).success,
        false
      );
      assert.strictEqual(
        parseWatchParams({ type: "tv", id: "1399", episode: "0" }).success,
        false
      );
      assert.strictEqual(
        parseWatchParams({ type: "tv", id: "1399", episode: "-5" }).success,
        false
      );
      assert.strictEqual(
        parseWatchParams({ type: "tv", id: "1399", season: "xyz" }).success,
        false
      );
    });

    it("should support URLSearchParams instances directly", () => {
      const searchParams = new URLSearchParams("type=movie&id=680");
      const result = parseWatchParams(searchParams);
      assert.strictEqual(result.success, true);
      if (result.success) {
        assert.strictEqual(result.data.id, 680);
      }
    });
  });

  describe("Safe External URL Allowlist (isSafeExternalUrl)", () => {
    it("should allow verified official partner domains", () => {
      assert.strictEqual(
        isSafeExternalUrl("https://www.themoviedb.org/movie/550-fight-club/watch"),
        true
      );
      assert.strictEqual(
        isSafeExternalUrl("https://themoviedb.org/tv/1399/watch"),
        true
      );
      assert.strictEqual(
        isSafeExternalUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        true
      );
      assert.strictEqual(
        isSafeExternalUrl("https://youtu.be/dQw4w9WgXcQ"),
        true
      );
    });

    it("should reject dangerous, unpermitted, or non-whitelisted destinations", () => {
      assert.strictEqual(isSafeExternalUrl("https://www.justwatch.com/in/movie/fight-club"), false);
      assert.strictEqual(isSafeExternalUrl("javascript:alert(1)"), false);
      assert.strictEqual(isSafeExternalUrl("data:text/html,test"), false);
      assert.strictEqual(isSafeExternalUrl("http://malicious-stream-site.com/movie/550"), false);
      assert.strictEqual(isSafeExternalUrl("https://notthemoviedb.org"), false);
      assert.strictEqual(isSafeExternalUrl(""), false);
      assert.strictEqual(isSafeExternalUrl(null), false);
    });
  });

  describe("YouTube Key Validation & Trailer Selection", () => {
    it("should validate standard and safe YouTube video keys", () => {
      assert.strictEqual(isValidYouTubeKey("dQw4w9WgXcQ"), true);
      assert.strictEqual(isValidYouTubeKey("BdJKmP58560"), true);
      assert.strictEqual(isValidYouTubeKey("official_trailer"), true);
      assert.strictEqual(isValidYouTubeKey("ab"), false); // too short
      assert.strictEqual(
        isValidYouTubeKey("way_too_long_identifier_with_excessive_characters_exceeding_the_allowed_length_limit_1234567890"),
        false
      ); // exceeds 64 chars
      assert.strictEqual(isValidYouTubeKey("invalid key with space"), false);
      assert.strictEqual(isValidYouTubeKey("invalid<script>"), false);
      assert.strictEqual(isValidYouTubeKey("path/traversal"), false);
      assert.strictEqual(isValidYouTubeKey(null), false);
    });

    it("should filter out trailers with invalid YouTube keys", () => {
      const videos: NormalizedVideo[] = [
        {
          id: "1",
          name: "Broken Trailer with script",
          key: "bad<script>",
          site: "YouTube",
          type: "Trailer",
          official: true,
          publishedAt: "",
        },
        {
          id: "2",
          name: "Valid Teaser",
          key: "BdJKmP58560",
          site: "YouTube",
          type: "Teaser",
          official: true,
          publishedAt: "",
        },
      ];

      const selected = selectPrimaryTrailer(videos);
      assert.ok(selected);
      assert.strictEqual(selected.key, "BdJKmP58560");
    });
  });



  describe("Reliability & Transient Network Error Recovery", () => {
    it("should retry once on transient socket failure and succeed on second attempt", async () => {
      let attempt = 0;

      globalThis.fetch = (async () => {
        attempt++;
        if (attempt === 1) {
          throw new TypeError("fetch failed: ECONNRESET");
        }
        return new Response(
          JSON.stringify({
            id: 550,
            title: "Fight Club",
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await tmdbFetch<{ id: number; title: string }>("/movie/550");
      assert.strictEqual(attempt, 2);
      assert.strictEqual(result.id, 550);
      assert.strictEqual(result.title, "Fight Club");
    });

    it("should NOT retry permanent 404 or 401 errors", async () => {
      let notFoundAttempts = 0;
      globalThis.fetch = (async () => {
        notFoundAttempts++;
        return new Response(
          JSON.stringify({ status_message: "The resource you requested could not be found." }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      await assert.rejects(async () => {
        await tmdbFetch("/movie/999999");
      }, TMDBNotFoundError);
      assert.strictEqual(notFoundAttempts, 1, "Should not retry permanent 404 errors");

      let authAttempts = 0;
      globalThis.fetch = (async () => {
        authAttempts++;
        return new Response(
          JSON.stringify({ status_message: "Invalid API key" }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      await assert.rejects(async () => {
        await tmdbFetch("/movie/550");
      }, TMDBAuthError);
      assert.strictEqual(authAttempts, 1, "Should not retry permanent 401 auth errors");
    });
  });
});
