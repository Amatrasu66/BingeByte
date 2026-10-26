import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getDetailedMovie,
  getDetailedTV,
  getMovieVideos,
  getTVVideos,
  getTVSeasonDetails,
} from "./index";
import {
  normalizeVideos,
  selectPrimaryTrailer,
  formatRuntime,
  formatCurrency,
} from "./normalizers";
import { DEFAULT_MAX_YEAR, MIN_ALLOWED_YEAR } from "./discover-types";
import { TMDBNotFoundError } from "./client";
import type { TMDBVideosResponse, NormalizedVideo } from "./types";

describe("Phase 6 Media Detail Services & Normalizers", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv, TMDB_API_READ_ACCESS_TOKEN: "mock_token" };
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  describe("Formatters", () => {
    it("should format runtime correctly in hours and minutes", () => {
      assert.strictEqual(formatRuntime(142), "2h 22m");
      assert.strictEqual(formatRuntime(60), "1h");
      assert.strictEqual(formatRuntime(45), "45m");
      assert.strictEqual(formatRuntime(0), "—");
      assert.strictEqual(formatRuntime(null), "—");
      assert.strictEqual(formatRuntime(undefined), "—");
    });

    it("should format USD currency amounts correctly", () => {
      assert.strictEqual(formatCurrency(200000000), "$200,000,000");
      assert.strictEqual(formatCurrency(1500000), "$1,500,000");
      assert.strictEqual(formatCurrency(0), "—");
      assert.strictEqual(formatCurrency(null), "—");
      assert.strictEqual(formatCurrency(undefined), "—");
    });
  });

  describe("Video Normalization & Trailer Selection", () => {
    it("should normalize raw TMDB video response", () => {
      const raw: TMDBVideosResponse = {
        id: 550,
        results: [
          {
            id: "vid_1",
            iso_639_1: "en",
            iso_3166_1: "US",
            name: "Official Teaser",
            key: "teaser123",
            site: "YouTube",
            size: 1080,
            type: "Teaser",
            official: false,
            published_at: "2020-01-01T00:00:00.000Z",
          },
          {
            id: "vid_2",
            iso_639_1: "en",
            iso_3166_1: "US",
            name: "Main Trailer",
            key: "trailer456",
            site: "YouTube",
            size: 1080,
            type: "Trailer",
            official: true,
            published_at: "2020-02-01T00:00:00.000Z",
          },
        ],
      };

      const normalized = normalizeVideos(raw);
      assert.strictEqual(normalized.length, 2);
      assert.strictEqual(normalized[0].key, "teaser123");
      assert.strictEqual(normalized[1].official, true);
    });

    it("should prioritize official YouTube trailers", () => {
      const videos: NormalizedVideo[] = [
        {
          id: "1",
          name: "Behind the Scenes",
          key: "bts",
          site: "YouTube",
          type: "Featurette",
          official: true,
          publishedAt: "",
        },
        {
          id: "2",
          name: "Fan Trailer",
          key: "fan",
          site: "YouTube",
          type: "Trailer",
          official: false,
          publishedAt: "",
        },
        {
          id: "3",
          name: "Official Trailer",
          key: "official_trailer",
          site: "YouTube",
          type: "Trailer",
          official: true,
          publishedAt: "",
        },
      ];

      const selected = selectPrimaryTrailer(videos);
      assert.ok(selected);
      assert.strictEqual(selected.key, "official_trailer");
    });

    it("should gracefully return null when no YouTube videos exist", () => {
      const videos: NormalizedVideo[] = [
        {
          id: "1",
          name: "Vimeo clip",
          key: "vimeo_123",
          site: "Vimeo",
          type: "Clip",
          official: true,
          publishedAt: "",
        },
      ];

      assert.strictEqual(selectPrimaryTrailer(videos), null);
      assert.strictEqual(selectPrimaryTrailer([]), null);
    });
  });

  describe("Movie Detail Service with append_to_response", () => {
    it("should request /movie/{id} with append_to_response=credits,videos,recommendations,similar", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 550,
            title: "Fight Club",
            overview: "An insomniac office worker...",
            poster_path: "/poster.jpg",
            backdrop_path: "/backdrop.jpg",
            release_date: "1999-10-15",
            runtime: 139,
            vote_average: 8.4,
            vote_count: 26000,
            budget: 63000000,
            revenue: 100853753,
            status: "Released",
            genres: [{ id: 18, name: "Drama" }],
            production_companies: [{ id: 1, name: "Fox 2000 Pictures" }],
            credits: {
              id: 550,
              cast: [
                {
                  id: 287,
                  name: "Brad Pitt",
                  character: "Tyler Durden",
                  profile_path: "/brad.jpg",
                },
              ],
              crew: [
                {
                  id: 7467,
                  name: "David Fincher",
                  job: "Director",
                  department: "Directing",
                  profile_path: null,
                },
              ],
            },
            videos: {
              id: 550,
              results: [
                {
                  id: "v1",
                  key: "fight_trailer",
                  name: "Official Trailer",
                  site: "YouTube",
                  type: "Trailer",
                  official: true,
                },
              ],
            },
            recommendations: {
              page: 1,
              results: [
                {
                  id: 680,
                  title: "Pulp Fiction",
                  poster_path: "/pulp.jpg",
                  vote_average: 8.5,
                  release_date: "1994-09-10",
                },
              ],
            },
            similar: {
              page: 1,
              results: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await getDetailedMovie(550);

      assert.match(capturedUrl, /\/movie\/550/);
      assert.match(capturedUrl, /append_to_response=credits%2Cvideos%2Crecommendations%2Csimilar/);
      assert.strictEqual(result.details.title, "Fight Club");
      assert.strictEqual(result.details.runtime, 139);
      assert.strictEqual(result.credits.cast.length, 1);
      assert.strictEqual(result.credits.cast[0].name, "Brad Pitt");
      assert.strictEqual(result.credits.crew[0].name, "David Fincher");
      assert.strictEqual(result.primaryTrailer?.key, "fight_trailer");
      assert.strictEqual(result.recommendations.length, 1);
      assert.strictEqual(result.recommendations[0].title, "Pulp Fiction");
    });

    it("should handle missing optional supplementary data safely", async () => {
      globalThis.fetch = (async () => {
        return new Response(
          JSON.stringify({
            id: 100,
            title: "Minimal Movie",
            overview: "",
            poster_path: null,
            backdrop_path: null,
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await getDetailedMovie(100);
      assert.strictEqual(result.details.title, "Minimal Movie");
      assert.deepStrictEqual(result.credits.cast, []);
      assert.deepStrictEqual(result.videos, []);
      assert.strictEqual(result.primaryTrailer, null);
      assert.deepStrictEqual(result.recommendations, []);
    });

    it("should throw TMDBNotFoundError on 404 response", async () => {
      globalThis.fetch = (async () => {
        return new Response(JSON.stringify({ status_message: "The resource you requested could not be found." }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }) as typeof fetch;

      await assert.rejects(async () => {
        await getDetailedMovie(9999999);
      }, TMDBNotFoundError);
    });

    it("should fetch movie videos standalone via getMovieVideos", async () => {
      let capturedUrl = "";
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 550,
            results: [
              {
                id: "v1",
                key: "trailer_key",
                name: "Trailer",
                site: "YouTube",
                type: "Trailer",
                official: true,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const videos = await getMovieVideos(550);
      assert.match(capturedUrl, /\/movie\/550\/videos/);
      assert.strictEqual(videos.length, 1);
      assert.strictEqual(videos[0].key, "trailer_key");
    });
  });

  describe("TV Detail & Season Services", () => {
    it("should request /tv/{id} with append_to_response", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 1399,
            name: "Game of Thrones",
            overview: "Seven noble families...",
            first_air_date: "2011-04-17",
            number_of_seasons: 8,
            number_of_episodes: 73,
            status: "Ended",
            genres: [{ id: 10765, name: "Sci-Fi & Fantasy" }],
            seasons: [
              {
                id: 3624,
                season_number: 1,
                name: "Season 1",
                episode_count: 10,
              },
            ],
            credits: {
              id: 1399,
              cast: [{ id: 1, name: "Emilia Clarke", character: "Daenerys" }],
              crew: [],
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await getDetailedTV(1399);

      assert.match(capturedUrl, /\/tv\/1399/);
      assert.match(capturedUrl, /append_to_response=credits%2Cvideos%2Crecommendations%2Csimilar/);
      assert.strictEqual(result.details.title, "Game of Thrones");
      assert.strictEqual(result.details.numberOfSeasons, 8);
      assert.strictEqual(result.details.seasons.length, 1);
      assert.strictEqual(result.credits.cast[0].name, "Emilia Clarke");
    });

    it("should request individual season details via getTVSeasonDetails", async () => {
      let capturedUrl = "";

      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 3624,
            season_number: 1,
            name: "Season 1",
            overview: "Trouble is brewing in Westeros...",
            episodes: [
              {
                id: 63056,
                episode_number: 1,
                season_number: 1,
                name: "Winter Is Coming",
                overview: "Jon Arryn is dead...",
                still_path: "/winter.jpg",
                vote_average: 8.8,
                runtime: 62,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const result = await getTVSeasonDetails(1399, 1);

      assert.match(capturedUrl, /\/tv\/1399\/season\/1/);
      assert.strictEqual(result.seasonNumber, 1);
      assert.strictEqual(result.episodes.length, 1);
      assert.strictEqual(result.episodes[0].name, "Winter Is Coming");
      assert.strictEqual(result.episodes[0].runtime, 62);
    });

    it("should fetch TV series videos via getTVVideos", async () => {
      let capturedUrl = "";
      globalThis.fetch = (async (input: RequestInfo | URL) => {
        capturedUrl = input.toString();
        return new Response(
          JSON.stringify({
            id: 1399,
            results: [
              {
                id: "tv_v1",
                key: "got_trailer",
                name: "Series Trailer",
                site: "YouTube",
                type: "Trailer",
                official: true,
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }) as typeof fetch;

      const videos = await getTVVideos(1399);
      assert.match(capturedUrl, /\/tv\/1399\/videos/);
      assert.strictEqual(videos.length, 1);
      assert.strictEqual(videos[0].key, "got_trailer");
    });
  });

  describe("Prerender Determinism Regression", () => {
    it("should have deterministic min and max year bounds in discover-types", () => {
      assert.strictEqual(MIN_ALLOWED_YEAR, 1888);
      assert.strictEqual(DEFAULT_MAX_YEAR, 2035);
      assert.ok(DEFAULT_MAX_YEAR > 2025, "DEFAULT_MAX_YEAR should comfortably encompass current and upcoming titles");
    });
  });
});
