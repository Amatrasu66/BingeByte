import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  normalizeMovie,
  normalizeTVShow,
  normalizeMedia,
  normalizePaginated,
  normalizeMovieDetails,
  normalizeTVDetails,
  normalizeSeasonDetails,
  normalizeCredits,
} from "./normalizers";
import type {
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBSeasonDetails,
  TMDBCreditsResponse,
  TMDBPaginatedResponse,
} from "./types";

describe("TMDB Normalizers", () => {
  it("should normalize a standard TMDB movie", () => {
    const raw: TMDBMovie = {
      id: 550,
      title: "Fight Club",
      original_title: "Fight Club",
      overview: "An insomniac office worker...",
      poster_path: "/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg",
      backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
      release_date: "1999-10-15",
      vote_average: 8.433,
      vote_count: 26280,
      popularity: 61.416,
      genre_ids: [18, 53, 35],
      original_language: "en",
    };

    const normalized = normalizeMovie(raw);

    assert.strictEqual(normalized.id, 550);
    assert.strictEqual(normalized.mediaType, "movie");
    assert.strictEqual(normalized.title, "Fight Club");
    assert.strictEqual(normalized.overview, "An insomniac office worker...");
    assert.strictEqual(normalized.posterPath, "/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg");
    assert.strictEqual(normalized.backdropPath, "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg");
    assert.strictEqual(normalized.releaseDate, "1999-10-15");
    assert.strictEqual(normalized.voteAverage, 8.433);
    assert.strictEqual(normalized.voteCount, 26280);
    assert.deepStrictEqual(normalized.genreIds, [18, 53, 35]);
    assert.strictEqual(normalized.originalLanguage, "en");
    assert.strictEqual(normalized.popularity, 61.416);
  });

  it("should safely handle a movie with missing optional fields", () => {
    const raw: TMDBMovie = {
      id: 999,
      title: "",
      original_title: "Alternate Title",
      overview: "",
      poster_path: null,
      backdrop_path: null,
      vote_average: 0,
      vote_count: 0,
      popularity: 0,
      original_language: "fr",
    };

    const normalized = normalizeMovie(raw);

    assert.strictEqual(normalized.id, 999);
    assert.strictEqual(normalized.mediaType, "movie");
    assert.strictEqual(normalized.title, "Alternate Title");
    assert.strictEqual(normalized.posterPath, null);
    assert.strictEqual(normalized.backdropPath, null);
    assert.strictEqual(normalized.releaseDate, null);
    assert.deepStrictEqual(normalized.genreIds, []);
  });

  it("should normalize a TMDB TV show, mapping name to title and first_air_date to releaseDate", () => {
    const raw: TMDBTVShow = {
      id: 1399,
      name: "Game of Thrones",
      original_name: "Game of Thrones",
      overview: "Seven noble families fight for control...",
      poster_path: "/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg",
      backdrop_path: "/suopoADq0k8YZr4dQXLiSJg0Ygi.jpg",
      first_air_date: "2011-04-17",
      vote_average: 8.452,
      vote_count: 23145,
      popularity: 345.12,
      genre_ids: [10765, 18, 10759],
      original_language: "en",
    };

    const normalized = normalizeTVShow(raw);

    assert.strictEqual(normalized.id, 1399);
    assert.strictEqual(normalized.mediaType, "tv");
    assert.strictEqual(normalized.title, "Game of Thrones");
    assert.strictEqual(normalized.releaseDate, "2011-04-17");
    assert.strictEqual(normalized.voteAverage, 8.452);
    assert.deepStrictEqual(normalized.genreIds, [10765, 18, 10759]);
  });

  it("should normalize generic media items and preserve explicit mediaType", () => {
    const movieRaw = {
      id: 1,
      title: "Movie One",
      original_title: "Movie One",
      overview: "Desc",
      poster_path: null,
      backdrop_path: null,
      vote_average: 7,
      vote_count: 10,
      popularity: 5,
      original_language: "en",
      media_type: "movie" as const,
    };

    const tvRaw = {
      id: 2,
      name: "Show One",
      original_name: "Show One",
      overview: "Desc",
      poster_path: null,
      backdrop_path: null,
      vote_average: 8,
      vote_count: 20,
      popularity: 15,
      original_language: "ja",
      media_type: "tv" as const,
    };

    assert.strictEqual(normalizeMedia(movieRaw).mediaType, "movie");
    assert.strictEqual(normalizeMedia(movieRaw).title, "Movie One");
    assert.strictEqual(normalizeMedia(tvRaw).mediaType, "tv");
    assert.strictEqual(normalizeMedia(tvRaw).title, "Show One");
  });

  it("should normalize paginated response accurately", () => {
    const rawPaginated: TMDBPaginatedResponse<TMDBMovie> = {
      page: 2,
      total_pages: 10,
      total_results: 200,
      results: [
        {
          id: 101,
          title: "Page Movie",
          original_title: "Page Movie",
          overview: "Overview",
          poster_path: "/p.jpg",
          backdrop_path: "/b.jpg",
          vote_average: 8,
          vote_count: 100,
          popularity: 20,
          original_language: "en",
        },
      ],
    };

    const normalized = normalizePaginated(rawPaginated, normalizeMovie);

    assert.strictEqual(normalized.page, 2);
    assert.strictEqual(normalized.totalPages, 10);
    assert.strictEqual(normalized.totalResults, 200);
    assert.strictEqual(normalized.results.length, 1);
    assert.strictEqual(normalized.results[0].title, "Page Movie");
    assert.strictEqual(normalized.results[0].mediaType, "movie");
  });

  it("should normalize movie details including runtime and status", () => {
    const rawDetails: TMDBMovieDetails = {
      id: 11,
      title: "Star Wars",
      original_title: "Star Wars",
      overview: "Princess Leia is captured...",
      poster_path: "/poster.jpg",
      backdrop_path: "/backdrop.jpg",
      release_date: "1977-05-25",
      vote_average: 8.2,
      vote_count: 19000,
      popularity: 90,
      original_language: "en",
      budget: 11000000,
      revenue: 775398007,
      runtime: 121,
      status: "Released",
      tagline: "A long time ago...",
      genres: [{ id: 12, name: "Adventure" }],
      production_companies: [
        { id: 1, name: "Lucasfilm Ltd.", logo_path: null, origin_country: "US" },
      ],
      production_countries: [{ iso_3166_1: "US", name: "United States" }],
      spoken_languages: [{ english_name: "English", iso_639_1: "en", name: "English" }],
    };

    const normalized = normalizeMovieDetails(rawDetails);

    assert.strictEqual(normalized.id, 11);
    assert.strictEqual(normalized.runtime, 121);
    assert.strictEqual(normalized.status, "Released");
    assert.strictEqual(normalized.tagline, "A long time ago...");
    assert.strictEqual(normalized.budget, 11000000);
    assert.strictEqual(normalized.revenue, 775398007);
    assert.strictEqual(normalized.genres[0].name, "Adventure");
  });

  it("should normalize TV show details including seasons and episode counts", () => {
    const rawTVDetails: TMDBTVShowDetails = {
      id: 100,
      name: "Breaking Bad",
      original_name: "Breaking Bad",
      overview: "A chemistry teacher...",
      poster_path: "/bb.jpg",
      backdrop_path: "/bb_bg.jpg",
      first_air_date: "2008-01-20",
      vote_average: 8.9,
      vote_count: 13000,
      popularity: 200,
      original_language: "en",
      in_production: false,
      languages: ["en"],
      last_air_date: "2013-09-29",
      number_of_episodes: 62,
      number_of_seasons: 5,
      status: "Ended",
      tagline: "Change the equation.",
      genres: [{ id: 18, name: "Drama" }],
      seasons: [
        {
          id: 101,
          name: "Season 1",
          overview: "Season 1 overview",
          season_number: 1,
          episode_count: 7,
          air_date: "2008-01-20",
          poster_path: "/s1.jpg",
        },
      ],
      production_companies: [],
      production_countries: [],
      spoken_languages: [],
    };

    const normalized = normalizeTVDetails(rawTVDetails);

    assert.strictEqual(normalized.id, 100);
    assert.strictEqual(normalized.numberOfSeasons, 5);
    assert.strictEqual(normalized.numberOfEpisodes, 62);
    assert.strictEqual(normalized.seasons.length, 1);
    assert.strictEqual(normalized.seasons[0].episodeCount, 7);
  });

  it("should normalize season details and episode listings", () => {
    const rawSeason: TMDBSeasonDetails = {
      id: 500,
      name: "Season 1",
      overview: "Synopsis",
      season_number: 1,
      air_date: "2024-01-01",
      poster_path: "/s1.jpg",
      episodes: [
        {
          id: 501,
          name: "Pilot",
          overview: "First episode",
          episode_number: 1,
          season_number: 1,
          air_date: "2024-01-01",
          still_path: "/ep1.jpg",
          vote_average: 8.5,
          vote_count: 250,
          runtime: 55,
        },
      ],
    };

    const normalized = normalizeSeasonDetails(rawSeason);

    assert.strictEqual(normalized.seasonNumber, 1);
    assert.strictEqual(normalized.episodes.length, 1);
    assert.strictEqual(normalized.episodes[0].name, "Pilot");
    assert.strictEqual(normalized.episodes[0].runtime, 55);
  });

  it("should normalize cast and crew credits", () => {
    const rawCredits: TMDBCreditsResponse = {
      id: 550,
      cast: [
        {
          id: 819,
          name: "Edward Norton",
          character: "The Narrator",
          profile_path: "/norton.jpg",
          order: 0,
        },
      ],
      crew: [
        {
          id: 7467,
          name: "David Fincher",
          job: "Director",
          department: "Directing",
          profile_path: "/fincher.jpg",
        },
      ],
    };

    const normalized = normalizeCredits(rawCredits);

    assert.strictEqual(normalized.cast.length, 1);
    assert.strictEqual(normalized.cast[0].name, "Edward Norton");
    assert.strictEqual(normalized.cast[0].role, "The Narrator");
    assert.strictEqual(normalized.crew.length, 1);
    assert.strictEqual(normalized.crew[0].name, "David Fincher");
    assert.strictEqual(normalized.crew[0].role, "Director");
    assert.strictEqual(normalized.crew[0].department, "Directing");
  });
});
