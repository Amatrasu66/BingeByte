import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { getAnimeDiscovery } from "./anime";

describe("TMDB Anime Discovery Service", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, TMDB_API_READ_ACCESS_TOKEN: "mock_token" };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("should query /discover/tv with genre 16 and original language ja", async () => {
    let capturedUrl = "";

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      capturedUrl = input.toString();
      return new Response(
        JSON.stringify({
          page: 1,
          total_pages: 5,
          total_results: 100,
          results: [
            {
              id: 1429,
              name: "Attack on Titan",
              original_name: "進撃の巨人",
              overview: "Several hundred years ago...",
              poster_path: "/titan.jpg",
              backdrop_path: "/titan_bg.jpg",
              first_air_date: "2013-04-07",
              vote_average: 8.663,
              vote_count: 5900,
              popularity: 125.4,
              genre_ids: [16, 10765, 10759],
              original_language: "ja",
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }) as typeof fetch;

    const result = await getAnimeDiscovery(1);

    assert.match(capturedUrl, /\/discover\/tv/);
    assert.match(capturedUrl, /with_genres=16/);
    assert.match(capturedUrl, /with_original_language=ja/);
    assert.match(capturedUrl, /sort_by=popularity\.desc/);
    assert.strictEqual(result.results.length, 1);
    assert.strictEqual(result.results[0].id, 1429);
    assert.strictEqual(result.results[0].title, "Attack on Titan");
    assert.strictEqual(result.results[0].mediaType, "tv");
    assert.strictEqual(result.results[0].originalLanguage, "ja");
  });
});
