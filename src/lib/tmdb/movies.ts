import { tmdbFetch } from "./client";
import { TMDB_CONFIG } from "./config";
import {
  normalizeMovie,
  normalizeMovieDetails,
  normalizeCredits,
  normalizePaginated,
} from "./normalizers";
import type {
  TMDBMovie,
  TMDBMovieDetails,
  TMDBCreditsResponse,
  TMDBGenreListResponse,
  TMDBPaginatedResponse,
  TMDBGenre,
  NormalizedMedia,
  NormalizedMovieDetails,
  NormalizedCredits,
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
