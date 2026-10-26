import { tmdbFetch } from "./client";
import { TMDB_CONFIG } from "./config";
import { normalizeTVShow, normalizePaginated } from "./normalizers";
import type { TMDBTVShow, TMDBPaginatedResponse, NormalizedMedia, PaginatedResult } from "./types";

/**
 * Initial Anime Discovery query using TMDB Discover endpoint.
 *
 * Approximation Strategy:
 * Queries TV series with the official TMDB Animation genre ID (16) and Japanese
 * original language ('ja'), sorted by popularity.
 * Note: TMDB does not have a dedicated 'anime' media type. This is an initial
 * approximation for discovery that will be refined in future phases.
 */
export async function getAnimeDiscovery(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>("/discover/tv", {
    params: {
      with_genres: "16", // TMDB Animation genre ID
      with_original_language: "ja", // Japanese original language
      sort_by: "popularity.desc",
      page,
    },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });

  return normalizePaginated(data, normalizeTVShow);
}
