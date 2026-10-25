import { tmdbFetch } from "./client";
import { TMDB_CONFIG } from "./config";
import { normalizeMovie, normalizeTVShow } from "./normalizers";
import type {
  TMDBMovie,
  TMDBTVShow,
  TMDBPaginatedResponse,
  NormalizedMedia,
  PaginatedResult,
} from "./types";

/**
 * Retrieves trending movies and TV series across all media types.
 */
export async function getTrendingAll(
  timeWindow: "day" | "week" = "day",
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  type TrendingItem = (TMDBMovie | TMDBTVShow) & { media_type?: string };

  const data = await tmdbFetch<TMDBPaginatedResponse<TrendingItem>>(
    `/trending/all/${timeWindow}`,
    {
      params: { page },
      revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
    }
  );

  const results: NormalizedMedia[] = [];

  for (const item of data.results || []) {
    if (item.media_type === "movie") {
      results.push(normalizeMovie(item as TMDBMovie));
    } else if (item.media_type === "tv") {
      results.push(normalizeTVShow(item as TMDBTVShow));
    } else if (!item.media_type) {
      if ("title" in item) {
        results.push(normalizeMovie(item as TMDBMovie));
      } else if ("name" in item) {
        results.push(normalizeTVShow(item as TMDBTVShow));
      }
    }
  }

  return {
    page: data.page || 1,
    totalPages: data.total_pages || 0,
    totalResults: data.total_results || 0,
    results,
  };
}
