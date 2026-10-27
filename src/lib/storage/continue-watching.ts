/**
 * Client-side Continue Watching storage service.
 * Manages persisting and retrieving in-progress media playback state via localStorage.
 */

export interface ContinueWatchingItem {
  mediaType: "movie" | "tv";
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  lastWatchedAt: number; // Unix timestamp in ms
  progressSeconds?: number;
  durationSeconds?: number;
}

export const STORAGE_KEY = "bingebyte_continue_watching";
export const MAX_ITEMS = 24;
export const STORAGE_CHANGE_EVENT = "bingebyte_continue_watching_updated";

function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined" || !window.localStorage) {
    return false;
  }
  try {
    const testKey = "__bingebyte_storage_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

function notifyStorageChange(): void {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(STORAGE_CHANGE_EVENT));
    } catch {
      // ignore
    }
  }
}

let cachedSnapshot: ContinueWatchingItem[] = [];
let cachedRaw: string | null = null;

/**
 * Retrieve all continue watching items sorted by most recently watched first.
 * Returns a stable memoized array reference when storage has not changed.
 */
export function getContinueWatching(): ContinueWatchingItem[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }
    cachedRaw = raw;
    if (!raw) {
      cachedSnapshot = [];
      return cachedSnapshot;
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cachedSnapshot = [];
      return cachedSnapshot;
    }

    // Validate item structure
    const validItems: ContinueWatchingItem[] = parsed.filter((item): item is ContinueWatchingItem => {
      return (
        item &&
        typeof item === "object" &&
        (item.mediaType === "movie" || item.mediaType === "tv") &&
        typeof item.tmdbId === "number" &&
        item.tmdbId > 0 &&
        typeof item.title === "string" &&
        typeof item.lastWatchedAt === "number"
      );
    });

    // Sort descending by lastWatchedAt
    cachedSnapshot = validItems.sort((a, b) => b.lastWatchedAt - a.lastWatchedAt);
    return cachedSnapshot;
  } catch (error) {
    console.error("Failed to parse continue watching storage:", error);
    cachedSnapshot = [];
    return cachedSnapshot;
  }
}

/**
 * Save or update a continue watching entry.
 */
export function saveWatchProgress(
  item: Omit<ContinueWatchingItem, "lastWatchedAt"> & { lastWatchedAt?: number }
): ContinueWatchingItem[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const current = getContinueWatching();

    const entryToSave: ContinueWatchingItem = {
      ...item,
      lastWatchedAt: item.lastWatchedAt ?? Date.now(),
    };

    // Dedup: for TV shows, keep 1 continue watching entry per show pointing to the latest episode watched.
    // For movies, keep 1 entry per movie.
    const filtered = current.filter((existing) => {
      if (existing.mediaType !== entryToSave.mediaType) return true;
      if (existing.tmdbId !== entryToSave.tmdbId) return true;
      return false;
    });

    const updated = [entryToSave, ...filtered].slice(0, MAX_ITEMS);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyStorageChange();
    return updated;
  } catch (error) {
    console.error("Failed to save continue watching item:", error);
    return [];
  }
}

/**
 * Remove a specific item from continue watching.
 */
export function removeContinueWatchingItem(
  mediaType: "movie" | "tv",
  tmdbId: number
): ContinueWatchingItem[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const current = getContinueWatching();
    const updated = current.filter(
      (item) => !(item.mediaType === mediaType && item.tmdbId === tmdbId)
    );

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    notifyStorageChange();
    return updated;
  } catch (error) {
    console.error("Failed to remove continue watching item:", error);
    return [];
  }
}

/**
 * Clear all continue watching history.
 */
export function clearContinueWatching(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
    notifyStorageChange();
  } catch (error) {
    console.error("Failed to clear continue watching:", error);
  }
}
