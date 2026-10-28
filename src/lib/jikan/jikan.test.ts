import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  jikanClient,
  jikanRateLimiter,
  searchJikanAnime,
  getJikanAnimeDetails,
  getJikanTopAnime,
  getJikanSeasonalAnime,
  getJikanAnimeGenres,
  getJikanAnimeCharacters,
  getJikanAnimeStaff,
  getJikanAnimeRecommendations,
  normalizeJikanAnime,
} from "./index";
import type { JikanAnime } from "./types";

describe("Phase 14A Jikan Supplementary Anime Metadata Service", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    jikanClient.clearCache();
    jikanRateLimiter.reset();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    jikanClient.setCustomFetch(undefined);
  });

  const mockAnimeItem: JikanAnime = {
    mal_id: 1,
    url: "https://myanimelist.net/anime/1/Cowboy_Bebop",
    images: {
      jpg: {
        image_url: "https://cdn.myanimelist.net/images/anime/4/19644.jpg",
        large_image_url: "https://cdn.myanimelist.net/images/anime/4/19644l.jpg",
      },
      webp: {
        image_url: "https://cdn.myanimelist.net/images/anime/4/19644.webp",
        large_image_url: "https://cdn.myanimelist.net/images/anime/4/19644l.webp",
      },
    },
    title: "Cowboy Bebop",
    title_english: "Cowboy Bebop",
    title_japanese: "カウボーイビバップ",
    type: "TV",
    episodes: 26,
    status: "Finished Airing",
    score: 8.75,
    rank: 42,
    popularity: 39,
    synopsis: "In the year 2071, humanity has colonized several of the planets and moons...",
    season: "spring",
    year: 1998,
    studios: [{ mal_id: 14, type: "anime", name: "Sunrise" }],
    genres: [
      { mal_id: 1, type: "anime", name: "Action" },
      { mal_id: 24, type: "anime", name: "Sci-Fi" },
    ],
  };

  describe("Anime Search (searchJikanAnime)", () => {
    it("should return empty results without network call when query is empty or whitespace", async () => {
      let fetchCalled = false;
      jikanClient.setCustomFetch(async () => {
        fetchCalled = true;
        return new Response(JSON.stringify({ data: [] }), { status: 200 });
      });

      const res = await searchJikanAnime("   ");
      assert.strictEqual(fetchCalled, false);
      assert.deepStrictEqual(res, { results: [] });
    });

    it("should query /anime?q=... and return normalized results", async () => {
      let capturedUrl = "";
      jikanClient.setCustomFetch(async (input) => {
        capturedUrl = String(input);
        return new Response(
          JSON.stringify({
            data: [mockAnimeItem],
            pagination: { current_page: 1, has_next_page: false, items: { total: 1 } },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      });

      const res = await searchJikanAnime("Cowboy Bebop", 1);
      assert.ok(res);
      assert.strictEqual(capturedUrl.includes("q=Cowboy+Bebop"), true);
      assert.strictEqual(res.results.length, 1);

      const item = res.results[0];
      assert.strictEqual(item.malId, 1);
      assert.strictEqual(item.title, "Cowboy Bebop");
      assert.strictEqual(item.score, 8.75);
      assert.strictEqual(item.year, 1998);
      assert.deepStrictEqual(item.genres, ["Action", "Sci-Fi"]);
      assert.deepStrictEqual(item.studios, ["Sunrise"]);
    });
  });

  describe("Anime Details (getJikanAnimeDetails)", () => {
    it("should reject non-positive or non-integer MAL IDs without network call", async () => {
      let called = false;
      jikanClient.setCustomFetch(async () => {
        called = true;
        return new Response(JSON.stringify({ data: mockAnimeItem }), { status: 200 });
      });

      assert.strictEqual(await getJikanAnimeDetails(0), null);
      assert.strictEqual(await getJikanAnimeDetails(-5), null);
      assert.strictEqual(await getJikanAnimeDetails(3.14), null);
      assert.strictEqual(called, false);
    });

    it("should fetch anime details by mal_id and normalize fields cleanly", async () => {
      jikanClient.setCustomFetch(async () => {
        return new Response(JSON.stringify({ data: mockAnimeItem }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      });

      const details = await getJikanAnimeDetails(1);
      assert.ok(details);
      assert.strictEqual(details.malId, 1);
      assert.strictEqual(details.title, "Cowboy Bebop");
      assert.strictEqual(details.status, "Finished Airing");
      assert.strictEqual(details.episodes, 26);
      assert.strictEqual(details.largeImageUrl, "https://cdn.myanimelist.net/images/anime/4/19644l.webp");
    });
  });

  describe("Rankings, Seasons, Genres & Recommendations", () => {
    it("should fetch top anime rankings", async () => {
      jikanClient.setCustomFetch(async () => {
        return new Response(
          JSON.stringify({
            data: [mockAnimeItem],
            pagination: { current_page: 1, has_next_page: true },
          }),
          { status: 200 }
        );
      });

      const top = await getJikanTopAnime(1, "bypopularity");
      assert.ok(top);
      assert.strictEqual(top.results.length, 1);
      assert.strictEqual(top.hasNextPage, true);
    });

    it("should fetch currently airing seasonal anime", async () => {
      jikanClient.setCustomFetch(async () => {
        return new Response(
          JSON.stringify({
            data: [mockAnimeItem],
            pagination: { current_page: 1, has_next_page: false },
          }),
          { status: 200 }
        );
      });

      const seasonal = await getJikanSeasonalAnime(1);
      assert.ok(seasonal);
      assert.strictEqual(seasonal.results.length, 1);
      assert.strictEqual(seasonal.hasNextPage, false);
    });

    it("should fetch anime genres catalog", async () => {
      const mockGenres = [
        { mal_id: 1, name: "Action", url: "https://myanimelist.net/anime/genre/1", count: 4500 },
        { mal_id: 2, name: "Adventure", url: "https://myanimelist.net/anime/genre/2", count: 3200 },
      ];

      jikanClient.setCustomFetch(async () => {
        return new Response(JSON.stringify({ data: mockGenres }), { status: 200 });
      });

      const genres = await getJikanAnimeGenres();
      assert.ok(genres);
      assert.strictEqual(genres.length, 2);
      assert.strictEqual(genres[0].name, "Action");
    });

    it("should fetch anime character listings", async () => {
      const mockCharacters = [
        {
          character: {
            mal_id: 1,
            url: "https://myanimelist.net/character/1",
            images: { jpg: { image_url: "https://cdn.mal.net/char1.jpg" } },
            name: "Spike Spiegel",
          },
          role: "Main",
          voice_actors: [
            {
              person: { mal_id: 11, name: "Kouichi Yamadera", images: { jpg: { image_url: "" } } },
              language: "Japanese",
            },
          ],
        },
      ];

      jikanClient.setCustomFetch(async () => {
        return new Response(JSON.stringify({ data: mockCharacters }), { status: 200 });
      });

      const chars = await getJikanAnimeCharacters(1);
      assert.ok(chars);
      assert.strictEqual(chars.length, 1);
      assert.strictEqual(chars[0].name, "Spike Spiegel");
      assert.strictEqual(chars[0].role, "Main");
      assert.strictEqual(chars[0].voiceActor?.name, "Kouichi Yamadera");
    });

    it("should fetch anime staff listings", async () => {
      const mockStaff = [
        {
          person: { mal_id: 200, name: "Shinichiro Watanabe", images: { jpg: { image_url: "" } }, url: "" },
          positions: ["Director"],
        },
      ];

      jikanClient.setCustomFetch(async () => {
        return new Response(JSON.stringify({ data: mockStaff }), { status: 200 });
      });

      const staff = await getJikanAnimeStaff(1);
      assert.ok(staff);
      assert.strictEqual(staff.length, 1);
      assert.strictEqual(staff[0].person.name, "Shinichiro Watanabe");
    });

    it("should fetch anime recommendations", async () => {
      const mockRecs = [
        {
          entry: {
            mal_id: 205,
            url: "",
            images: { jpg: { image_url: "https://cdn.mal.net/205.jpg" } },
            title: "Samurai Champloo",
          },
          votes: 120,
        },
      ];

      jikanClient.setCustomFetch(async () => {
        return new Response(JSON.stringify({ data: mockRecs }), { status: 200 });
      });

      const recs = await getJikanAnimeRecommendations(1);
      assert.ok(recs);
      assert.strictEqual(recs.length, 1);
      assert.strictEqual(recs[0].entry.title, "Samurai Champloo");
    });
  });

  describe("Caching and Deduplication", () => {
    it("should serve repeat requests from in-memory cache without hitting network", async () => {
      let fetchCount = 0;
      jikanClient.setCustomFetch(async () => {
        fetchCount++;
        return new Response(JSON.stringify({ data: mockAnimeItem }), { status: 200 });
      });

      const call1 = await getJikanAnimeDetails(1);
      const call2 = await getJikanAnimeDetails(1);

      assert.strictEqual(fetchCount, 1);
      assert.deepStrictEqual(call1, call2);
    });

    it("should deduplicate in-flight concurrent requests for the exact same endpoint", async () => {
      let networkDispatches = 0;
      jikanClient.setCustomFetch(async () => {
        networkDispatches++;
        await new Promise((r) => setTimeout(r, 50));
        return new Response(JSON.stringify({ data: mockAnimeItem }), { status: 200 });
      });

      const [res1, res2, res3] = await Promise.all([
        getJikanAnimeDetails(99),
        getJikanAnimeDetails(99),
        getJikanAnimeDetails(99),
      ]);

      assert.strictEqual(networkDispatches, 1);
      assert.deepStrictEqual(res1, res2);
      assert.deepStrictEqual(res2, res3);
    });
  });

  describe("Rate Limiting, 429 Backoff & Error Resilience", () => {
    it("should back off on HTTP 429 and retry successfully when retry quota permits", async () => {
      let attempts = 0;
      jikanClient.setCustomFetch(async () => {
        attempts++;
        if (attempts === 1) {
          return new Response(JSON.stringify({ status: 429, message: "Too Many Requests" }), {
            status: 429,
            headers: { "Retry-After": "1" },
          });
        }
        return new Response(JSON.stringify({ data: mockAnimeItem }), { status: 200 });
      });

      const res = await getJikanAnimeDetails(500);
      assert.strictEqual(attempts, 2);
      assert.ok(res);
      assert.strictEqual(res.title, "Cowboy Bebop");
    });

    it("should return null gracefully on 404 without throwing", async () => {
      jikanClient.setCustomFetch(async () => {
        return new Response(JSON.stringify({ status: 404, message: "Resource not found" }), {
          status: 404,
        });
      });

      const res = await getJikanAnimeDetails(9999999);
      assert.strictEqual(res, null);
    });

    it("should return null gracefully on timeout or network abort", async () => {
      jikanClient.setCustomFetch(async () => {
        const err = new Error("Connection timed out");
        err.name = "TimeoutError";
        throw err;
      });

      const res = await getJikanAnimeDetails(1);
      assert.strictEqual(res, null);
    });
  });

  describe("Identifier Isolation", () => {
    it("should preserve malId as an isolated property separate from TMDB id", () => {
      const normalized = normalizeJikanAnime(mockAnimeItem);
      assert.strictEqual(normalized.malId, 1);
      // Ensure property is named malId and not generic id
      assert.strictEqual((normalized as unknown as { id?: number }).id, undefined);
    });
  });
});
