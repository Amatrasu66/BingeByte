import { tmdbFetch } from "./client";
import { normalizeMovie, normalizeTVShow, normalizePaginated } from "./normalizers";
import type {
  TMDBMovie,
  TMDBTVShow,
  TMDBPaginatedResponse,
  NormalizedMedia,
  PaginatedResult,
} from "./types";

/**
 * Searches movies by title query.
 * Returns an empty result immediately if query is empty or blank.
 */
export async function searchMovies(
  query: string,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { page: 1, totalPages: 0, totalResults: 0, results: [] };
  }

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/search/movie", {
    params: {
      query: trimmed,
      page,
      include_adult: false,
    },
    revalidate: 0, // Search queries should not be heavily cached
  });

  return normalizePaginated(data, normalizeMovie);
}

/**
 * Searches TV series by name query.
 * Returns an empty result immediately if query is empty or blank.
 */
export async function searchTV(
  query: string,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { page: 1, totalPages: 0, totalResults: 0, results: [] };
  }

  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>("/search/tv", {
    params: {
      query: trimmed,
      page,
      include_adult: false,
    },
    revalidate: 0,
  });

  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Multi-search across movies and TV series.
 * Automatically filters out unsupported media types (e.g. 'person').
 */
export async function multiSearch(
  query: string,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { page: 1, totalPages: 0, totalResults: 0, results: [] };
  }

  type MultiItem = (TMDBMovie | TMDBTVShow) & { media_type?: string };

  const data = await tmdbFetch<TMDBPaginatedResponse<MultiItem>>("/search/multi", {
    params: {
      query: trimmed,
      page,
      include_adult: false,
    },
    revalidate: 0,
  });

  // Filter to supported media types (movies and tv shows)
  const filteredResults: NormalizedMedia[] = [];

  for (const item of data.results || []) {
    if (item.media_type === "movie") {
      filteredResults.push(normalizeMovie(item as TMDBMovie));
    } else if (item.media_type === "tv") {
      filteredResults.push(normalizeTVShow(item as TMDBTVShow));
    } else if (!item.media_type) {
      if ("title" in item) {
        filteredResults.push(normalizeMovie(item as TMDBMovie));
      } else if ("name" in item) {
        filteredResults.push(normalizeTVShow(item as TMDBTVShow));
      }
    }
  }

  return {
    page: data.page || 1,
    totalPages: data.total_pages || 0,
    totalResults: data.total_results || 0,
    results: filteredResults,
  };
}
