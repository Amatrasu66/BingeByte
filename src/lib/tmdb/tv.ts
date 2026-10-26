import { tmdbFetch } from "./client";
import { TMDB_CONFIG } from "./config";
import {
  normalizeTVShow,
  normalizeTVDetails,
  normalizeSeasonDetails,
  normalizeCredits,
  normalizeVideos,
  selectPrimaryTrailer,
  normalizePaginated,
} from "./normalizers";
import type {
  TMDBTVShow,
  TMDBTVShowDetails,
  TMDBSeasonDetails,
  TMDBCreditsResponse,
  TMDBVideosResponse,
  TMDBGenreListResponse,
  TMDBPaginatedResponse,
  TMDBGenre,
  NormalizedMedia,
  NormalizedTVDetails,
  NormalizedSeasonDetails,
  NormalizedCredits,
  NormalizedVideo,
  DetailedTVData,
  PaginatedResult,
} from "./types";

/**
 * Retrieves trending TV series over a time window ('day' | 'week').
 */
export async function getTrendingTV(
  timeWindow: "day" | "week" = "day",
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>(
    `/trending/tv/${timeWindow}`,
    {
      params: { page },
      revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
    }
  );
  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Retrieves popular TV series.
 */
export async function getPopularTV(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>("/tv/popular", {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Retrieves top-rated TV series.
 */
export async function getTopRatedTV(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>("/tv/top_rated", {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Retrieves comprehensive TV series details by ID.
 */
export async function getTVDetails(id: number): Promise<NormalizedTVDetails> {
  const data = await tmdbFetch<TMDBTVShowDetails>(`/tv/${id}`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeTVDetails(data);
}

/**
 * Retrieves TV season details including episode listings.
 */
export async function getTVSeasonDetails(
  tvId: number,
  seasonNumber: number
): Promise<NormalizedSeasonDetails> {
  const data = await tmdbFetch<TMDBSeasonDetails>(`/tv/${tvId}/season/${seasonNumber}`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeSeasonDetails(data);
}

/**
 * Retrieves cast and crew credits for a TV series.
 */
export async function getTVCredits(id: number): Promise<NormalizedCredits> {
  const data = await tmdbFetch<TMDBCreditsResponse>(`/tv/${id}/credits`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeCredits(data);
}

/**
 * Retrieves TV series similar to a specific series.
 */
export async function getSimilarTV(
  id: number,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>(`/tv/${id}/similar`, {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Retrieves curated recommendations based on a specific TV series.
 */
export async function getTVRecommendations(
  id: number,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBTVShow>>(
    `/tv/${id}/recommendations`,
    {
      params: { page },
      revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
    }
  );
  return normalizePaginated(data, normalizeTVShow);
}

/**
 * Retrieves the full list of official TV series genres.
 */
export async function getTVGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<TMDBGenreListResponse>("/genre/tv/list", {
    revalidate: TMDB_CONFIG.REVALIDATE.STATIC,
  });
  return data.genres || [];
}

/**
 * Retrieves video assets (trailers, teasers, featurettes) for a TV show.
 */
export async function getTVVideos(id: number): Promise<NormalizedVideo[]> {
  const data = await tmdbFetch<TMDBVideosResponse>(`/tv/${id}/videos`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeVideos(data);
}

type RawTVShowDetailsWithAppend = TMDBTVShowDetails & {
  credits?: TMDBCreditsResponse;
  videos?: TMDBVideosResponse;
  recommendations?: TMDBPaginatedResponse<TMDBTVShow>;
  similar?: TMDBPaginatedResponse<TMDBTVShow>;
};

/**
 * Retrieves full TV series detail bundle (details, credits, videos, recommendations, similar)
 * in a single efficient request using TMDB's append_to_response capability.
 */
export async function getDetailedTV(id: number): Promise<DetailedTVData> {
  const raw = await tmdbFetch<RawTVShowDetailsWithAppend>(`/tv/${id}`, {
    params: {
      append_to_response: "credits,videos,recommendations,similar",
    },
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });

  const details = normalizeTVDetails(raw);
  const credits = raw.credits
    ? normalizeCredits(raw.credits)
    : { id, cast: [], crew: [] };
  const videos = raw.videos ? normalizeVideos(raw.videos) : [];
  const primaryTrailer = selectPrimaryTrailer(videos);
  const recommendations = raw.recommendations?.results
    ? raw.recommendations.results.map(normalizeTVShow)
    : [];
  const similar = raw.similar?.results ? raw.similar.results.map(normalizeTVShow) : [];

  return {
    details,
    credits,
    videos,
    primaryTrailer,
    recommendations,
    similar,
  };
}



