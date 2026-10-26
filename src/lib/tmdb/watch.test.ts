import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  parseWatchParams,
  isSafeExternalUrl,
  isValidYouTubeKey,
  selectPrimaryTrailer,
  normalizeWatchProviders,
  getMovieWatchProviders,
  getTVWatchProviders,
  tmdbFetch,
  TMDBNotFoundError,
  TMDBAuthError,
} from "./index";
import type {
  TMDBWatchProvidersResponse,
  NormalizedVideo,
} from "./types";

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
        isSafeExternalUrl("https://www.themoviedb.org/movie/550-fight-club/watch?locale=IN"),
        true
      );
      assert.strictEqual(
        isSafeExternalUrl("https://themoviedb.org/tv/1399/watch"),
        true
      );
      assert.strictEqual(
        isSafeExternalUrl("https://www.justwatch.com/in/movie/fight-club"),
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

  describe("Watch Providers Normalization & Regional Extraction", () => {
    const mockProvidersResponse: TMDBWatchProvidersResponse = {
      id: 550,
      results: {
        IN: {
          link: "https://www.themoviedb.org/movie/550-fight-club/watch?locale=IN",
          flatrate: [
            {
              logo_path: "/amazon.jpg",
              provider_id: 119,
              provider_name: "Amazon Prime Video",
              display_priority: 1,
            },
          ],
          rent: [
            {
              logo_path: "/apple.jpg",
              provider_id: 2,
              provider_name: "Apple TV",
              display_priority: 3,
            },
          ],
          buy: [
            {
              logo_path: "/google.jpg",
              provider_id: 3,
              provider_name: "Google Play Movies",
              display_priority: 8,
            },
          ],
          free: [
            {
              logo_path: "/mx.jpg",
              provider_id: 500,
              provider_name: "MX Player",
              display_priority: 2,
            },
          ],
        },
        US: {
          link: "https://www.themoviedb.org/movie/550-fight-club/watch?locale=US",
          flatrate: [
            {
              logo_path: "/hulu.jpg",
              provider_id: 15,
              provider_name: "Hulu",
              display_priority: 1,
            },
          ],
        },
      },
    };

    it("should extract India (IN) watch providers accurately", () => {
      const normalized = normalizeWatchProviders(550, mockProvidersResponse, "IN");

      assert.strictEqual(normalized.id, 550);
      assert.strictEqual(normalized.region, "IN");
      assert.strictEqual(normalized.hasProviders, true);
      assert.strictEqual(normalized.stream.length, 1);
      assert.strictEqual(normalized.stream[0].name, "Amazon Prime Video");
      assert.strictEqual(normalized.rent.length, 1);
      assert.strictEqual(normalized.rent[0].name, "Apple TV");
      assert.strictEqual(normalized.buy.length, 1);
      assert.strictEqual(normalized.buy[0].name, "Google Play Movies");
      assert.strictEqual(normalized.free.length, 1);
      assert.strictEqual(normalized.free[0].name, "MX Player");
      assert.ok(normalized.link?.includes("locale=IN"));
    });

    it("should handle missing regional data gracefully", () => {
      const normalized = normalizeWatchProviders(550, mockProvidersResponse, "JP");

      assert.strictEqual(normalized.id, 550);
      assert.strictEqual(normalized.region, "JP");
      assert.strictEqual(normalized.hasProviders, false);
      assert.strictEqual(normalized.stream.length, 0);
      assert.strictEqual(normalized.rent.length, 0);
      assert.strictEqual(normalized.buy.length, 0);
      assert.strictEqual(normalized.link, null);
    });

    it("should handle null or malformed provider responses safely", () => {
      const normalized = normalizeWatchProviders(550, null, "IN");
      assert.strictEqual(normalized.hasProviders, false);
      assert.strictEqual(normalized.stream.length, 0);
      assert.strictEqual(normalized.link, null);
    });
  });

  describe("Watch Provider Services (getMovieWatchProviders & getTVWatchProviders)", () => {
    it("should query /movie/{id}/watch/providers and normalize for India", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 550,
            results: {
              IN: {
                link: "https://www.themoviedb.org/movie/550/watch?locale=IN",
                flatrate: [
                  {
                    logo_path: "/prime.jpg",
                    provider_id: 119,
                    provider_name: "Prime Video",
                    display_priority: 1,
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const providers = await getMovieWatchProviders(550, "IN");

      assert.match(capturedUrl, /\/movie\/550\/watch\/providers/);
      assert.strictEqual(providers.hasProviders, true);
      assert.strictEqual(providers.stream[0].name, "Prime Video");
    });

    it("should query /tv/{id}/watch/providers for TV series", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 1399,
            results: {
              IN: {
                link: "https://www.themoviedb.org/tv/1399/watch?locale=IN",
                flatrate: [
                  {
                    logo_path: "/jiocinema.jpg",
                    provider_id: 220,
                    provider_name: "JioCinema",
                    display_priority: 1,
                  },
                ],
              },
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const providers = await getTVWatchProviders(1399, "IN");

      assert.match(capturedUrl, /\/tv\/1399\/watch\/providers/);
      assert.strictEqual(providers.hasProviders, true);
      assert.strictEqual(providers.stream[0].name, "JioCinema");
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
