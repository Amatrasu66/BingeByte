import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { searchMovies, searchTV, multiSearch } from "./search";

describe("TMDB Search Validation & Execution", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, TMDB_API_READ_ACCESS_TOKEN: "mock_token" };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("should return empty results for empty or whitespace query without network call", async () => {
    let networkCalled = false;
    globalThis.fetch = (async () => {
      networkCalled = true;
      return new Response(JSON.stringify({ results: [] }));
    }) as typeof fetch;

    const emptyMovie = await searchMovies("");
    const whitespaceMovie = await searchMovies("   ");
    const emptyTV = await searchTV("");
    const emptyMulti = await multiSearch("");

    assert.strictEqual(networkCalled, false);
    assert.deepStrictEqual(emptyMovie, { page: 1, totalPages: 0, totalResults: 0, results: [] });
    assert.deepStrictEqual(whitespaceMovie, { page: 1, totalPages: 0, totalResults: 0, results: [] });
    assert.deepStrictEqual(emptyTV, { page: 1, totalPages: 0, totalResults: 0, results: [] });
    assert.deepStrictEqual(emptyMulti, { page: 1, totalPages: 0, totalResults: 0, results: [] });
  });

  it("should perform movie search with trimmed query and return normalized results", async () => {
    let requestedUrl = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      requestedUrl = input.toString();
      return new Response(
        JSON.stringify({
          page: 1,
          total_pages: 1,
          total_results: 1,
          results: [
            {
              id: 603,
              title: "The Matrix",
              original_title: "The Matrix",
              overview: "Set in the 22nd century...",
              poster_path: "/matrix.jpg",
              backdrop_path: "/matrix_bg.jpg",
              release_date: "1999-03-30",
              vote_average: 8.2,
              vote_count: 24000,
              popularity: 80,
              genre_ids: [28, 878],
              original_language: "en",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const result = await searchMovies("  The Matrix  ");

    assert.match(requestedUrl, /query=The\+Matrix/);
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].title, "The Matrix");
    assert.strictEqual(result.results[0].mediaType, "movie");
  });

  it("should filter out unsupported media types like 'person' from multiSearch", async () => {
    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({
          page: 1,
          total_pages: 1,
          total_results: 3,
          results: [
            {
              id: 10,
              media_type: "movie",
              title: "Dune",
              original_title: "Dune",
              overview: "Spice...",
              poster_path: "/dune.jpg",
              backdrop_path: null,
              release_date: "2021-09-15",
              vote_average: 8.0,
              vote_count: 9000,
              popularity: 150,
              genre_ids: [878, 12],
              original_language: "en",
            },
            {
              id: 999,
              media_type: "person", // Unsupported type in media search
              name: "Denis Villeneuve",
              known_for_department: "Directing",
            },
            {
              id: 20,
              media_type: "tv",
              name: "Dune: Prophecy",
              original_name: "Dune: Prophecy",
              overview: "Sisterhood...",
              poster_path: "/prophecy.jpg",
              backdrop_path: null,
              first_air_date: "2024-11-17",
              vote_average: 7.8,
              vote_count: 500,
              popularity: 120,
              genre_ids: [10765, 18],
              original_language: "en",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const result = await multiSearch("Dune");

    assert.strictEqual(result.results.length, 2);
    assert.strictEqual(result.results[0].title, "Dune");
    assert.strictEqual(result.results[0].mediaType, "movie");
    assert.strictEqual(result.results[1].title, "Dune: Prophecy");
    assert.strictEqual(result.results[1].mediaType, "tv");
  });
});
