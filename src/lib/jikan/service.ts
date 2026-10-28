/**
 * BingeByte — Jikan Supplementary Anime Metadata Service
 *
 * Implements supported read-only endpoints from official Jikan v4 API documentation:
 * - Anime search (/anime?q=...)
 * - Anime details (/anime/{id})
 * - Popular anime rankings (/top/anime)
 * - Seasonal anime discovery (/seasons/now)
 * - Anime genres (/genres/anime)
 * - Character and staff information (/anime/{id}/characters, /anime/{id}/staff)
 * - Recommendations (/anime/{id}/recommendations)
 */

import { jikanClient } from "./client";
import {
  normalizeJikanAnime,
  normalizeJikanAnimeList,
  normalizeJikanCharacter,
} from "./normalizers";
import type {
  JikanAnime,
  JikanGenreItem,
  JikanCharacterItem,
  JikanStaffItem,
  JikanRecommendationEntry,
  NormalizedJikanAnime,
  NormalizedJikanCharacter,
} from "./types";

/**
 * Searches anime by keyword.
 */
export async function searchJikanAnime(
  query: string,
  page: number = 1
): Promise<{ results: NormalizedJikanAnime[]; total?: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) {
    return { results: [] };
  }

  const res = await jikanClient.get<JikanAnime[]>("/anime", {
    params: { q: trimmed, page, limit: 20 },
    ttlMs: 5 * 60 * 1000, // 5 min cache
  });

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return {
    results: normalizeJikanAnimeList(res.data),
    total: res.pagination?.items?.total,
  };
}

/**
 * Fetches anime details by MAL ID.
 */
export async function getJikanAnimeDetails(
  malId: number
): Promise<NormalizedJikanAnime | null> {
  if (!malId || malId <= 0 || !Number.isInteger(malId)) {
    return null;
  }

  const res = await jikanClient.get<JikanAnime>(`/anime/${malId}`, {
    ttlMs: 60 * 60 * 1000, // 1 hour cache
  });

  if (!res || !res.data) {
    return null;
  }

  return normalizeJikanAnime(res.data);
}

/**
 * Fetches top rated / popular anime rankings.
 */
export async function getJikanTopAnime(
  page: number = 1,
  filter?: "airing" | "upcoming" | "bypopularity" | "favorite"
): Promise<{ results: NormalizedJikanAnime[]; hasNextPage: boolean } | null> {
  const res = await jikanClient.get<JikanAnime[]>("/top/anime", {
    params: { page, filter, limit: 25 },
    ttlMs: 30 * 60 * 1000, // 30 min cache
  });

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return {
    results: normalizeJikanAnimeList(res.data),
    hasNextPage: res.pagination?.has_next_page ?? false,
  };
}

/**
 * Fetches currently airing seasonal anime.
 */
export async function getJikanSeasonalAnime(
  page: number = 1
): Promise<{ results: NormalizedJikanAnime[]; hasNextPage: boolean } | null> {
  const res = await jikanClient.get<JikanAnime[]>("/seasons/now", {
    params: { page, limit: 25 },
    ttlMs: 30 * 60 * 1000, // 30 min cache
  });

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return {
    results: normalizeJikanAnimeList(res.data),
    hasNextPage: res.pagination?.has_next_page ?? false,
  };
}

/**
 * Fetches anime genres catalog.
 */
export async function getJikanAnimeGenres(): Promise<JikanGenreItem[] | null> {
  const res = await jikanClient.get<JikanGenreItem[]>("/genres/anime", {
    ttlMs: 24 * 60 * 60 * 1000, // 24 hour cache
  });

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return res.data;
}

/**
 * Fetches character listings for an anime.
 */
export async function getJikanAnimeCharacters(
  malId: number
): Promise<NormalizedJikanCharacter[] | null> {
  if (!malId || malId <= 0 || !Number.isInteger(malId)) {
    return null;
  }

  const res = await jikanClient.get<JikanCharacterItem[]>(
    `/anime/${malId}/characters`,
    {
      ttlMs: 60 * 60 * 1000,
    }
  );

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return res.data.map(normalizeJikanCharacter);
}

/**
 * Fetches staff listings for an anime.
 */
export async function getJikanAnimeStaff(
  malId: number
): Promise<JikanStaffItem[] | null> {
  if (!malId || malId <= 0 || !Number.isInteger(malId)) {
    return null;
  }

  const res = await jikanClient.get<JikanStaffItem[]>(
    `/anime/${malId}/staff`,
    {
      ttlMs: 60 * 60 * 1000,
    }
  );

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return res.data;
}

/**
 * Fetches anime recommendations related to this title.
 */
export async function getJikanAnimeRecommendations(
  malId: number
): Promise<JikanRecommendationEntry[] | null> {
  if (!malId || malId <= 0 || !Number.isInteger(malId)) {
    return null;
  }

  const res = await jikanClient.get<JikanRecommendationEntry[]>(
    `/anime/${malId}/recommendations`,
    {
      ttlMs: 60 * 60 * 1000,
    }
  );

  if (!res || !Array.isArray(res.data)) {
    return null;
  }

  return res.data;
}
