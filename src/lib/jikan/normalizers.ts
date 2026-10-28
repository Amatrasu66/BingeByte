/**
 * BingeByte — Jikan Normalizers
 * Maps raw Jikan v4 responses into normalized data structures.
 *
 * CRITICAL IDENTIFIER ISOLATION:
 * Preserves mal_id as malId to ensure complete separation from TMDB numeric IDs.
 */

import type {
  JikanAnime,
  JikanCharacterItem,
  NormalizedJikanAnime,
  NormalizedJikanCharacter,
} from "./types";

/**
 * Normalizes an individual Jikan anime object.
 */
export function normalizeJikanAnime(item: JikanAnime): NormalizedJikanAnime {
  const imageUrl =
    item.images.webp?.large_image_url ||
    item.images.webp?.image_url ||
    item.images.jpg.large_image_url ||
    item.images.jpg.image_url;

  const largeImageUrl =
    item.images.webp?.large_image_url ||
    item.images.jpg.large_image_url ||
    null;

  const studios = (item.studios || []).map((s) => s.name);
  const genres = (item.genres || []).map((g) => g.name);

  return {
    malId: item.mal_id,
    title: item.title,
    titleEnglish: item.title_english ?? null,
    titleJapanese: item.title_japanese ?? null,
    imageUrl,
    largeImageUrl,
    synopsis: item.synopsis ?? null,
    score: item.score ?? null,
    episodes: item.episodes ?? null,
    status: item.status ?? null,
    type: item.type ?? null,
    season: item.season ?? null,
    year: item.year ?? item.aired?.prop?.from?.year ?? null,
    studios,
    genres,
    rank: item.rank ?? null,
    popularity: item.popularity ?? null,
    url: item.url,
  };
}

/**
 * Normalizes a list of Jikan anime items.
 */
export function normalizeJikanAnimeList(
  items: JikanAnime[] | undefined
): NormalizedJikanAnime[] {
  if (!Array.isArray(items)) return [];
  return items.map(normalizeJikanAnime);
}

/**
 * Normalizes a character item from Jikan characters endpoint.
 */
export function normalizeJikanCharacter(
  item: JikanCharacterItem
): NormalizedJikanCharacter {
  const va = item.voice_actors?.[0];

  return {
    malId: item.character.mal_id,
    name: item.character.name,
    role: item.role,
    imageUrl:
      item.character.images.webp?.image_url ||
      item.character.images.jpg.image_url,
    voiceActor: va
      ? {
          name: va.person.name,
          language: va.language,
        }
      : undefined,
  };
}
