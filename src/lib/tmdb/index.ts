/**
 * BingeByte TMDB API Module
 * Server-side metadata client, image builders, normalizers, and query services.
 */

export { TMDB_CONFIG } from "./config";
export type {
  PosterSize,
  BackdropSize,
  ProfileSize,
  StillSize,
} from "./config";

export {
  tmdbFetch,
  TMDBError,
  TMDBConfigError,
  TMDBAuthError,
  TMDBNotFoundError,
  TMDBRateLimitError,
  TMDBTimeoutError,
} from "./client";
export type { TMDBFetchOptions } from "./client";

export {
  getTMDBImageUrl,
  getPosterUrl,
  getBackdropUrl,
  getProfileUrl,
  getStillUrl,
} from "./images";

export {
  normalizeMovie,
  normalizeTVShow,
  normalizeMedia,
  normalizePaginated,
  normalizeMovieDetails,
  normalizeTVDetails,
  normalizeSeasonDetails,
  normalizeCredits,
  normalizeVideos,
  selectPrimaryTrailer,
  formatRuntime,
  formatCurrency,
} from "./normalizers";

export * from "./types";
export * from "./movies";
export * from "./tv";
export * from "./anime";
export * from "./search";
export * from "./trending";
export * from "./discover";
export * from "./errors";
