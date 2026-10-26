import { tmdbFetch } from "./client";
import { TMDB_CONFIG } from "./config";
import {
  normalizeMovie,
  normalizeMovieDetails,
  normalizeCredits,
  normalizeVideos,
  selectPrimaryTrailer,
  normalizeWatchProviders,
  normalizePaginated,
} from "./normalizers";
import type {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBCreditsResponse,
  TMDBVideosResponse,
  TMDBWatchProvidersResponse,
  TMDBGenreListResponse,
  TMDBPaginatedResponse,
  TMDBGenre,
  NormalizedMedia,
  NormalizedMovieDetails,
  NormalizedCredits,
  NormalizedVideo,
  NormalizedWatchProviders,
  DetailedMovieData,
  PaginatedResult,
} from "./types";

/**
 * Retrieves trending movies over a time window ('day' | 'week').
 */
export async function getTrendingMovies(
  timeWindow: "day" | "week" = "day",
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
    `/trending/movie/${timeWindow}`,
    {
      params: { page },
      revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
    }
  );
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves popular movies.
 */
export async function getPopularMovies(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/movie/popular", {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves movies currently in theatres / now playing.
 */
export async function getNowPlayingMovies(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/movie/now_playing", {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves upcoming movies.
 */
export async function getUpcomingMovies(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/movie/upcoming", {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves top rated movies.
 */
export async function getTopRatedMovies(
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>("/movie/top_rated", {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves comprehensive movie details by ID.
 */
export async function getMovieDetails(id: number): Promise<NormalizedMovieDetails> {
  const data = await tmdbFetch<TMDBMovieDetails>(`/movie/${id}`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeMovieDetails(data);
}

/**
 * Retrieves cast and crew credits for a movie.
 */
export async function getMovieCredits(id: number): Promise<NormalizedCredits> {
  const data = await tmdbFetch<TMDBCreditsResponse>(`/movie/${id}/credits`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeCredits(data);
}

/**
 * Retrieves movies similar to a specific movie.
 */
export async function getSimilarMovies(
  id: number,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(`/movie/${id}/similar`, {
    params: { page },
    revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
  });
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves curated recommendations based on a specific movie.
 */
export async function getMovieRecommendations(
  id: number,
  page: number = 1
): Promise<PaginatedResult<NormalizedMedia>> {
  const data = await tmdbFetch<TMDBPaginatedResponse<TMDBMovie>>(
    `/movie/${id}/recommendations`,
    {
      params: { page },
      revalidate: TMDB_CONFIG.REVALIDATE.DYNAMIC,
    }
  );
  return normalizePaginated(data, normalizeMovie);
}

/**
 * Retrieves the full list of official movie genres.
 */
export async function getMovieGenres(): Promise<TMDBGenre[]> {
  const data = await tmdbFetch<TMDBGenreListResponse>("/genre/movie/list", {
    revalidate: TMDB_CONFIG.REVALIDATE.STATIC,
  });
  return data.genres || [];
}

/**
 * Retrieves video assets (trailers, teasers, behind-the-scenes) for a movie.
 */
export async function getMovieVideos(id: number): Promise<NormalizedVideo[]> {
  const data = await tmdbFetch<TMDBVideosResponse>(`/movie/${id}/videos`, {
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });
  return normalizeVideos(data);
}

type RawMovieDetailsWithAppend = TMDBMovieDetails & {
  credits?: TMDBCreditsResponse;
  videos?: TMDBVideosResponse;
  recommendations?: TMDBPaginatedResponse<TMDBMovie>;
  similar?: TMDBPaginatedResponse<TMDBMovie>;
};

/**
 * Retrieves full movie detail bundle (details, credits, videos, recommendations, similar)
 * in a single efficient request using TMDB's append_to_response capability.
 */
export async function getDetailedMovie(id: number): Promise<DetailedMovieData> {
  const raw = await tmdbFetch<RawMovieDetailsWithAppend>(`/movie/${id}`, {
    params: {
      append_to_response: "credits,videos,recommendations,similar",
    },
    revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
  });

  const details = normalizeMovieDetails(raw);
  const credits = raw.credits
    ? normalizeCredits(raw.credits)
    : { id, cast: [], crew: [] };
  const videos = raw.videos ? normalizeVideos(raw.videos) : [];
  const primaryTrailer = selectPrimaryTrailer(videos);
  const recommendations = raw.recommendations?.results
    ? raw.recommendations.results.map(normalizeMovie)
    : [];
  const similar = raw.similar?.results ? raw.similar.results.map(normalizeMovie) : [];

  return {
    details,
    credits,
    videos,
    primaryTrailer,
    recommendations,
    similar,
  };
}

/**
 * Retrieves regional streaming, rental, and purchase providers for a movie (default region: IN).
 */
export async function getMovieWatchProviders(
  id: number,
  region: string = "IN"
): Promise<NormalizedWatchProviders> {
  const data = await tmdbFetch<TMDBWatchProvidersResponse>(
    `/movie/${id}/watch/providers`,
    {
      revalidate: TMDB_CONFIG.REVALIDATE.DETAILS,
    }
  );
  return normalizeWatchProviders(id, data, region);
}


