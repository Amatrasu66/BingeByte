import "server-only";
import { tmdbFetch } from "./client";
import { TMDB_CONFIG } from "./config";
import { normalizeMovie, normalizeTVShow, normalizePaginated } from "./normalizers";
import type {
  TMDBMovie,
  TMDBTVShow,
  TMDBPaginatedResponse,
  NormalizedMedia,
  PaginatedResult,
} from "./types";
import {
  type DiscoverFilters,
  type DiscoverSortOption,
  validateDiscoverFilters,
} from "./discover-types";

export * from "./discover-types";

/**
 * Maps normalized sort options to TMDB movie sort parameters.
 */
function mapMovieSortParam(sort: DiscoverSortOption): string {
  switch (sort) {
    case "release_date.desc":
      return "primary_release_date.desc";
    case "release_date.asc":
      return "primary_release_date.asc";
    default:
      return sort;
  }
}

/**
 * Maps normalized sort options to TMDB TV sort parameters.
 */
function mapTVSortParam(sort: DiscoverSortOption): string {
  switch (sort) {
    case "release_date.desc":
      return "first_air_date.desc";
    case "release_date.asc":
      return "first_air_date.asc";
    default:
      return sort;
  }
}

/**
 * Discovers movies based on validated filtering parameters.
 * Uses TMDB endpoint: GET /discover/movie
 */
export async function discoverMovies(
  filters: DiscoverFilters = {}
): Promise<PaginatedResult<NormalizedMedia>> {
  const validated = validateDiscoverFilters(filters);
  const params: Record<string, string | number | boolean | undefined> = {
    page: validated.page,
    sort_by: mapMovieSortParam(validated.sortBy),
    include_adult: false,
  };

  if (validated.genre) {
    params.with_genres = validated.genre;
  }

  if (validated.yearFrom) {
    params["primary_release_date.gte"] = `${validated.yearFrom}-01-01`;
  }

  if (validated.yearTo) {
    params["primary_release_date.lte"] = `${validated.yearTo}-12-31`;
  }

  if (validated.minRating !== undefined && validated.minRating > 0) {
    params["vote_average.gte"] = validated.minRating;
    params["vote_count.gte"] = 50; // Filter out zero/low-vote statistical outliers
  } else if (validated.sortBy === "vote_average.desc") {
    params["vote_count.gte"] = 100; // Require meaningful review sample size
  }

  if (validated.language) {
    params.with_original_language = validated.language;
  }

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/discover/movie", {
    params,
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });

  return normalizePaginated(data, normalizeMovie);
}

/**
 * Discovers TV shows based on validated filtering parameters.
 * Uses TMDB endpoint: GET /discover/tv
 */
export async function discoverTV(
  filters: DiscoverFilters = {}
): Promise<PaginatedResult<NormalizedMedia>> {
  const validated = validateDiscoverFilters(filters);
  const params: Record<string, string | number | boolean | undefined> = {
    page: validated.page,
    sort_by: mapTVSortParam(validated.sortBy),
    include_adult: false,
  };

  if (validated.genre) {
    params.with_genres = validated.genre;
  }

  if (validated.yearFrom) {
    params["first_air_date.gte"] = `${validated.yearFrom}-01-01`;
  }

  if (validated.yearTo) {
    params["first_air_date.lte"] = `${validated.yearTo}-12-31`;
  }

  if (validated.minRating !== undefined && validated.minRating > 0) {
    params["vote_average.gte"] = validated.minRating;
    params["vote_count.gte"] = 25;
  } else if (validated.sortBy === "vote_average.desc") {
    params["vote_count.gte"] = 50;
  }

  if (validated.language) {
    params.with_original_language = validated.language;
  }

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>("/discover/tv", {
    params,
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });

  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Discovers Anime titles based on curated TMDB Discover TV approximation.
 * Combines Animation genre (16) and Japanese original language ('ja') with user filters.
 */
export async function discoverAnime(
  filters: DiscoverFilters = {}
): Promise<PaginatedResult<NormalizedMedia>> {
  const validated = validateDiscoverFilters(filters);

  // Combine baseline animation genre (16) with any user-selected secondary genre
  let combinedGenres = "16";
  if (validated.genre) {
    const genreTokens = validated.genre.split(",").filter((id) => id !== "16");
    if (genreTokens.length > 0) {
      combinedGenres = `16,${genreTokens.join(",")}`;
    }
  }

  const params: Record<string, string | number | boolean | undefined> = {
    page: validated.page,
    sort_by: mapTVSortParam(validated.sortBy),
    with_genres: combinedGenres,
    with_original_language: "ja", // Enforced Japanese audio origin
    include_adult: false,
  };

  if (validated.yearFrom) {
    params["first_air_date.gte"] = `${validated.yearFrom}-01-01`;
  }

  if (validated.yearTo) {
    params["first_air_date.lte"] = `${validated.yearTo}-12-31`;
  }

  if (validated.minRating !== undefined && validated.minRating > 0) {
    params["vote_average.gte"] = validated.minRating;
    params["vote_count.gte"] = 15;
  } else if (validated.sortBy === "vote_average.desc") {
    params["vote_count.gte"] = 30;
  }

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>("/discover/tv", {
    params,
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });

  return normalizePaginated(data, normalizeTVShow);
}
