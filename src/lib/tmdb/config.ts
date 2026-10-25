/**
 * TMDB API Configuration Constants
 * Centralizes URLs, default parameters, and Next.js revalidation intervals.
 */
export const TMDB_CONFIG = {
  API_BASE_URL: "https://api.themoviedb.org/3",
  IMAGE_BASE_URL: "https://image.tmdb.org/t/p",
  DEFAULT_LANGUAGE: "en-US",
  DEFAULT_TIMEOUT_MS: 8000,

  /**
   * Caching and revalidation intervals (in seconds) for Next.js fetch.
   */
  REVALIDATE: {
    /** Relatively static lists such as genres (24 hours) */
    STATIC: 86400,
    /** Detail views: synopsis, runtime, credits (1 hour) */
    DETAILS: 3600,
    /** Dynamic lists: trending, popular, now playing (30 minutes) */
    DYNAMIC: 1800,
  },

  /**
   * Supported TMDB image size definitions.
   * Reference: https://developer.themoviedb.org/docs/image-basics
   */
  IMAGE_SIZES: {
    POSTER: ["w92", "w154", "w185", "w342", "w500", "w780", "original"] as const,
    BACKDROP: ["w300", "w780", "w1280", "original"] as const,
    PROFILE: ["w45", "w185", "h632", "original"] as const,
    STILL: ["w92", "w185", "w300", "original"] as const,
  },
} as const;

export type PosterSize = (typeof TMDB_CONFIG.IMAGE_SIZES.POSTER)[number];
export type BackdropSize = (typeof TMDB_CONFIG.IMAGE_SIZES.BACKDROP)[number];
export type ProfileSize = (typeof TMDB_CONFIG.IMAGE_SIZES.PROFILE)[number];
export type StillSize = (typeof TMDB_CONFIG.IMAGE_SIZES.STILL)[number];
