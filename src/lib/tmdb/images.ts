import {
  TMDB_CONFIG,
  type PosterSize,
  type BackdropSize,
  type ProfileSize,
  type StillSize,
} from "./config";

/**
 * Constructs a fully qualified TMDB image URL.
 * Returns null if the provided path is null, undefined, or empty.
 */
export function getTMDBImageUrl(
  path: string | null | undefined,
  size: string = "original"
): string | null {
  if (!path || typeof path !== "string") {
    return null;
  }

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${TMDB_CONFIG.IMAGE_BASE_URL}/${size}${cleanPath}`;
}

/**
 * Constructs a poster image URL for movie/series artwork.
 * Default size: w500 (high density for cards).
 */
export function getPosterUrl(
  path: string | null | undefined,
  size: PosterSize = "w500"
): string | null {
  return getTMDBImageUrl(path, size);
}

/**
 * Constructs a wide backdrop image URL for hero and header displays.
 * Default size: w1280.
 */
export function getBackdropUrl(
  path: string | null | undefined,
  size: BackdropSize = "w1280"
): string | null {
  return getTMDBImageUrl(path, size);
}

/**
 * Constructs a profile image URL for cast and crew headshots.
 * Default size: w185.
 */
export function getProfileUrl(
  path: string | null | undefined,
  size: ProfileSize = "w185"
): string | null {
  return getTMDBImageUrl(path, size);
}

/**
 * Constructs a still image URL for TV episodes.
 * Default size: w300.
 */
export function getStillUrl(
  path: string | null | undefined,
  size: StillSize = "w300"
): string | null {
  return getTMDBImageUrl(path, size);
}
