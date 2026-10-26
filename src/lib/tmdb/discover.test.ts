import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  validateDiscoverFilters,
  parseDiscoverSearchParams,
  serializeDiscoverSearchParams,
  discoverMovies,
  discoverTV,
  discoverAnime,
} from "./discover";
import {
  TMDBAuthError,
  TMDBConfigError,
  TMDBNotFoundError,
  TMDBRateLimitError,
  TMDBTimeoutError,
} from "./client";
import { getSafeErrorMessage } from "./errors";

describe("TMDB Discover Service & Filter Validation", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, TMDB_API_READ_ACCESS_TOKEN: "mock_token" };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  describe("Filter Validation & Sanitization", () => {
    it("should clamp page numbers between 1 and 500", () => {
      assert.strictEqual(validateDiscoverFilters({ page: -5 }).page, 1);
      assert.strictEqual(validateDiscoverFilters({ page: 0 }).page, 1);
      assert.strictEqual(validateDiscoverFilters({ page: 12 }).page, 12);
      assert.strictEqual(validateDiscoverFilters({ page: 999 }).page, 500);
      assert.strictEqual(validateDiscoverFilters({ page: "not-a-number" as unknown as number }).page, 1);
    });

    it("should validate and sanitize genre IDs", () => {
      assert.strictEqual(validateDiscoverFilters({ genre: 28 }).genre, "28");
      assert.strictEqual(validateDiscoverFilters({ genre: "28, 12, 878" }).genre, "28,12,878");
      assert.strictEqual(validateDiscoverFilters({ genre: "invalid, -1, 0, 35" }).genre, "35");
      assert.strictEqual(validateDiscoverFilters({ genre: "all-invalid" }).genre, undefined);
    });

    it("should validate year bounds and swap if yearFrom > yearTo", () => {
      const valid = validateDiscoverFilters({ yearFrom: 2010, yearTo: 2020 });
      assert.strictEqual(valid.yearFrom, 2010);
      assert.strictEqual(valid.yearTo, 2020);

      // Inverted year bounds should swap safely
      const inverted = validateDiscoverFilters({ yearFrom: 2025, yearTo: 2015 });
      assert.strictEqual(inverted.yearFrom, 2015);
      assert.strictEqual(inverted.yearTo, 2025);

      // Out of bounds years should be ignored
      const outOfBounds = validateDiscoverFilters({ yearFrom: 1800, yearTo: 3000 });
      assert.strictEqual(outOfBounds.yearFrom, undefined);
      assert.strictEqual(outOfBounds.yearTo, undefined);
    });

    it("should validate rating thresholds between 0 and 10", () => {
      assert.strictEqual(validateDiscoverFilters({ minRating: 7.5 }).minRating, 7.5);
      assert.strictEqual(validateDiscoverFilters({ minRating: 12 }).minRating, undefined);
      assert.strictEqual(validateDiscoverFilters({ minRating: -2 }).minRating, undefined);
    });

    it("should validate ISO 639-1 language codes", () => {
      assert.strictEqual(validateDiscoverFilters({ language: "JA" }).language, "ja");
      assert.strictEqual(validateDiscoverFilters({ language: "en" }).language, "en");
      assert.strictEqual(validateDiscoverFilters({ language: "english" }).language, undefined);
      assert.strictEqual(validateDiscoverFilters({ language: "123" }).language, undefined);
    });

    it("should enforce sort order allowlist and fallback to popularity.desc", () => {
      assert.strictEqual(validateDiscoverFilters({ sortBy: "popularity.desc" }).sortBy, "popularity.desc");
      assert.strictEqual(validateDiscoverFilters({ sortBy: "vote_average.desc" }).sortBy, "vote_average.desc");
      assert.strictEqual(validateDiscoverFilters({ sortBy: "release_date.desc" }).sortBy, "release_date.desc");
      assert.strictEqual(
        validateDiscoverFilters({ sortBy: "arbitrary_field.desc" as unknown as "popularity.desc" }).sortBy,
        "popularity.desc"
      );
    });
  });

  describe("URL Search Parameter Serialization & Parsing", () => {
    it("should parse search params correctly into validated filters", () => {
      const parsed = parseDiscoverSearchParams({
        genre: "28",
        yearFrom: "2015",
        yearTo: "2024",
        rating: "7",
        lang: "ko",
        sort: "vote_average.desc",
        page: "3",
      });

      assert.strictEqual(parsed.genre, "28");
      assert.strictEqual(parsed.yearFrom, 2015);
      assert.strictEqual(parsed.yearTo, 2024);
      assert.strictEqual(parsed.minRating, 7);
      assert.strictEqual(parsed.language, "ko");
      assert.strictEqual(parsed.sortBy, "vote_average.desc");
      assert.strictEqual(parsed.page, 3);
    });

    it("should serialize filters into query string while omitting defaults", () => {
      const queryStr = serializeDiscoverSearchParams({
        genre: "28",
        yearFrom: 2015,
        minRating: 8,
        sortBy: "vote_average.desc",
        page: 2,
      });

      assert.match(queryStr, /genre=28/);
      assert.match(queryStr, /yearFrom=2015/);
      assert.match(queryStr, /rating=8/);
      assert.match(queryStr, /sort=vote_average\.desc/);
      assert.match(queryStr, /page=2/);

      // Page 1 and default sort popularity.desc should not bloat URL
      const defaultQuery = serializeDiscoverSearchParams({
        genre: "12",
        sortBy: "popularity.desc",
        page: 1,
      });

      assert.strictEqual(defaultQuery, "?genre=12");
    });
  });

  describe("Endpoint Requests & Parameter Mapping", () => {
    it("should query /discover/movie with mapped parameters and normalize results", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            page: 1,
            total_pages: 10,
            total_results: 200,
            results: [
              {
                id: 101,
                title: "Interstellar",
                original_title: "Interstellar",
                overview: "A team of explorers...",
                poster_path: "/interstellar.jpg",
                backdrop_path: "/interstellar_bg.jpg",
                release_date: "2014-11-05",
                vote_average: 8.6,
                vote_count: 32000,
                popularity: 140,
                genre_ids: [12, 18, 878],
                original_language: "en",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await discoverMovies({
        genre: 878,
        yearFrom: 2010,
        yearTo: 2020,
        minRating: 8,
        language: "en",
        sortBy: "release_date.desc",
        page: 2,
      });

      assert.match(capturedUrl, /\/discover\/movie/);
      assert.match(capturedUrl, /with_genres=878/);
      assert.match(capturedUrl, /primary_release_date\.gte=2010-01-01/);
      assert.match(capturedUrl, /primary_release_date\.lte=2020-12-31/);
      assert.match(capturedUrl, /vote_average\.gte=8/);
      assert.match(capturedUrl, /sort_by=primary_release_date\.desc/);
      assert.match(capturedUrl, /page=2/);
      assert.strictEqual(result.results.length, 1);
      assert.strictEqual(result.results[0].mediaType, "movie");
    });

    it("should query /discover/tv with TV-specific first_air_date parameters", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            page: 1,
            total_pages: 5,
            total_results: 80,
            results: [
              {
                id: 201,
                name: "Severance",
                original_name: "Severance",
                overview: "Mark leads a team...",
                poster_path: "/severance.jpg",
                backdrop_path: null,
                first_air_date: "2022-02-18",
                vote_average: 8.5,
                vote_count: 1500,
                popularity: 90,
                genre_ids: [18, 9648, 10765],
                original_language: "en",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await discoverTV({
        genre: 18,
        yearFrom: 2020,
        yearTo: 2024,
        sortBy: "release_date.desc",
      });

      assert.match(capturedUrl, /\/discover\/tv/);
      assert.match(capturedUrl, /with_genres=18/);
      assert.match(capturedUrl, /first_air_date\.gte=2020-01-01/);
      assert.match(capturedUrl, /first_air_date\.lte=2024-12-31/);
      assert.match(capturedUrl, /sort_by=first_air_date\.desc/);
      assert.strictEqual(result.results[0].mediaType, "tv");
    });

    it("should query /discover/tv for anime with animation genre 16 and japanese audio", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            page: 1,
            total_pages: 3,
            total_results: 45,
            results: [
              {
                id: 301,
                name: "Frieren: Beyond Journey's End",
                original_name: "葬送のフリーレン",
                overview: "After the party of heroes defeated the Demon King...",
                poster_path: "/frieren.jpg",
                backdrop_path: null,
                first_air_date: "2023-09-29",
                vote_average: 8.9,
                vote_count: 900,
                popularity: 110,
                genre_ids: [16, 10759, 10765],
                original_language: "ja",
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await discoverAnime({
        genre: 10759, // Action secondary genre
        minRating: 8.5,
      });

      assert.match(capturedUrl, /\/discover\/tv/);
      assert.match(capturedUrl, /with_genres=16%2C10759|with_genres=16,10759/);
      assert.match(capturedUrl, /with_original_language=ja/);
      assert.match(capturedUrl, /vote_average\.gte=8\.5/);
      assert.strictEqual(result.results[0].mediaType, "tv");
      assert.strictEqual(result.results[0].originalLanguage, "ja");
    });
  });

  describe("Safe Error Message Mapping", () => {
    it("should provide sanitized error messages without leaking tokens or URLs", () => {
      const configErr = new TMDBConfigError();
      const authErr = new TMDBAuthError("Secret key leaked in internal trace", 401, "Unauthorized", "/discover/movie");
      const rateLimitErr = new TMDBRateLimitError("Too Many Requests", 429, "Rate limit", "/discover/tv");
      const timeoutErr = new TMDBTimeoutError("/discover/movie", 8000);
      const notFoundErr = new TMDBNotFoundError("Not found", 404, "Not Found", "/movie/999999");
      const genericErr = new Error("Database connection refused");

      const configMsg = getSafeErrorMessage(configErr);
      const authMsg = getSafeErrorMessage(authErr);
      const rateLimitMsg = getSafeErrorMessage(rateLimitErr);
      const timeoutMsg = getSafeErrorMessage(timeoutErr);
      const notFoundMsg = getSafeErrorMessage(notFoundErr);
      const genericMsg = getSafeErrorMessage(genericErr);

      assert.ok(!authMsg.includes("Secret key"));
      assert.ok(!authMsg.includes("/discover/movie"));
      assert.ok(authMsg.includes("credentials"));

      assert.ok(configMsg.includes("API credentials"));
      assert.ok(rateLimitMsg.includes("elevated traffic"));
      assert.ok(timeoutMsg.includes("timed out"));
      assert.ok(notFoundMsg.includes("not be located"));
      assert.ok(genericMsg.includes("Unable to retrieve"));
    });
  });
});
