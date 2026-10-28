/**
 * BingeByte — Jikan v4 Anime API Types
 * Unofficial MyAnimeList (MAL) metadata types and normalized structures.
 */

export interface JikanImageVariant {
  image_url: string;
  small_image_url?: string;
  large_image_url?: string;
}

export interface JikanImages {
  jpg: JikanImageVariant;
  webp?: JikanImageVariant;
}

export interface JikanTrailer {
  youtube_id?: string | null;
  url?: string | null;
  embed_url?: string | null;
}

export interface JikanTitle {
  type: string;
  title: string;
}

export interface JikanDateProp {
  day?: number | null;
  month?: number | null;
  year?: number | null;
}

export interface JikanAired {
  from?: string | null;
  to?: string | null;
  prop?: {
    from?: JikanDateProp;
    to?: JikanDateProp;
  };
  string?: string;
}

export interface JikanResourceItem {
  mal_id: number;
  type: string;
  name: string;
  url?: string;
}

export interface JikanAnime {
  mal_id: number;
  url: string;
  images: JikanImages;
  trailer?: JikanTrailer;
  approved?: boolean;
  titles?: JikanTitle[];
  title: string;
  title_english?: string | null;
  title_japanese?: string | null;
  type?: string | null;
  source?: string | null;
  episodes?: number | null;
  status?: string | null;
  airing?: boolean;
  aired?: JikanAired;
  duration?: string | null;
  rating?: string | null;
  score?: number | null;
  scored_by?: number | null;
  rank?: number | null;
  popularity?: number | null;
  members?: number | null;
  favorites?: number | null;
  synopsis?: string | null;
  background?: string | null;
  season?: string | null;
  year?: number | null;
  studios?: JikanResourceItem[];
  genres?: JikanResourceItem[];
  explicit_genres?: JikanResourceItem[];
  themes?: JikanResourceItem[];
  demographics?: JikanResourceItem[];
}

export interface JikanPagination {
  last_visible_page: number;
  has_next_page: boolean;
  current_page: number;
  items?: {
    count: number;
    total: number;
    per_page: number;
  };
}

export interface JikanResponse<T> {
  data: T;
  pagination?: JikanPagination;
}

export interface JikanGenreItem {
  mal_id: number;
  name: string;
  url: string;
  count: number;
}

export interface JikanCharacterItem {
  character: {
    mal_id: number;
    url: string;
    images: JikanImages;
    name: string;
  };
  role: string;
  favorites?: number;
  voice_actors?: Array<{
    person: {
      mal_id: number;
      name: string;
      images: { jpg: { image_url: string } };
    };
    language: string;
  }>;
}

export interface JikanStaffItem {
  person: {
    mal_id: number;
    url: string;
    images: { jpg: { image_url: string } };
    name: string;
  };
  positions: string[];
}

export interface JikanRecommendationEntry {
  entry: {
    mal_id: number;
    url: string;
    images: JikanImages;
    title: string;
  };
  votes: number;
}

/**
 * Normalized supplementary anime item for BingeByte UI components.
 * CRITICAL: Keeps malId separate from TMDB id.
 */
export interface NormalizedJikanAnime {
  malId: number;
  title: string;
  titleEnglish: string | null;
  titleJapanese: string | null;
  imageUrl: string;
  largeImageUrl: string | null;
  synopsis: string | null;
  score: number | null;
  episodes: number | null;
  status: string | null;
  type: string | null;
  season: string | null;
  year: number | null;
  studios: string[];
  genres: string[];
  rank: number | null;
  popularity: number | null;
  url: string;
}

export interface NormalizedJikanCharacter {
  malId: number;
  name: string;
  role: string;
  imageUrl: string;
  voiceActor?: {
    name: string;
    language: string;
  };
}
