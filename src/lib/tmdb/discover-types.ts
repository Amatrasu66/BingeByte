/**
 * Shared Discovery Constants, Types, and URL Serialization.
 * This file is client-safe and does not depend on server-only or network fetchers.
 */

/**
 * Permitted sort orders for entertainment discovery.
 */
export const DISCOVER_SORT_OPTIONS = [
  "popularity.desc",
  "popularity.asc",
  "vote_average.desc",
  "vote_average.asc",
  "release_date.desc",
  "release_date.asc",
] as const;

export type DiscoverSortOption = (typeof DISCOVER_SORT_OPTIONS)[number];

/**
 * Filter parameters for discovery queries.
 */
export interface DiscoverFilters {
  genre?: number | string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  language?: string;
  sortBy?: DiscoverSortOption;
  page?: number;
}

/**
 * Validated and sanitized filter parameters.
 */
export interface ValidatedDiscoverFilters {
  genre?: string;
  yearFrom?: number;
  yearTo?: number;
  minRating?: number;
  language?: string;
  sortBy: DiscoverSortOption;
  page: number;
}

/**
 * Human-readable sort option labels for UI presentation.
 */
export const SORT_LABELS: Record<DiscoverSortOption, string> = {
  "popularity.desc": "Most Popular",
  "popularity.asc": "Least Popular",
  "vote_average.desc": "Highest Rated",
  "vote_average.asc": "Lowest Rated",
  "release_date.desc": "Newest First",
  "release_date.asc": "Oldest First",
};

/**
 * Curated allowlist of supported languages with English display names.
 */
export const SUPPORTED_LANGUAGES = [
  { code: "", label: "All Languages" },
  { code: "en", label: "English" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "es", label: "Spanish" },
  { code: "fr", label: "French" },
  { code: "de", label: "German" },
  { code: "it", label: "Italian" },
  { code: "hi", label: "Hindi" },
  { code: "zh", label: "Chinese" },
  { code: "pt", label: "Portuguese" },
] as const;

export const MIN_ALLOWED_YEAR = 1888;
export const DEFAULT_MAX_YEAR = 2035;
export const MAX_ALLOWED_YEAR = DEFAULT_MAX_YEAR;

/**
 * Validates and sanitizes raw filter inputs to prevent arbitrary or malformed parameters.
 */
export function validateDiscoverFilters(
  raw: Partial<DiscoverFilters> = {}
): ValidatedDiscoverFilters {
  // Validate and clamp page number (1 <= page <= 500)
  let page = 1;
  if (raw.page !== undefined) {
    const parsedPage = typeof raw.page === "number" ? raw.page : parseInt(String(raw.page), 10);
    if (!Number.isNaN(parsedPage) && parsedPage >= 1) {
      page = Math.min(500, Math.floor(parsedPage));
    }
  }

  // Validate sort order against allowlist
  let sortBy: DiscoverSortOption = "popularity.desc";
  if (raw.sortBy && (DISCOVER_SORT_OPTIONS as readonly string[]).includes(raw.sortBy)) {
    sortBy = raw.sortBy as DiscoverSortOption;
  }

  // Validate genre IDs (comma-separated positive integers)
  let genre: string | undefined = undefined;
  if (raw.genre !== undefined && raw.genre !== null) {
    const rawGenreStr = String(raw.genre).trim();
    if (rawGenreStr) {
      const validIds = rawGenreStr
        .split(/[,|]/)
        .map((s) => s.trim())
        .map((s) => parseInt(s, 10))
        .filter((n) => !Number.isNaN(n) && n > 0);

      if (validIds.length > 0) {
        genre = validIds.join(",");
      }
    }
  }

  // Validate year range
  let yearFrom: number | undefined = undefined;
  if (raw.yearFrom !== undefined && raw.yearFrom !== null) {
    const yf = typeof raw.yearFrom === "number" ? raw.yearFrom : parseInt(String(raw.yearFrom), 10);
    if (!Number.isNaN(yf) && yf >= MIN_ALLOWED_YEAR && yf <= MAX_ALLOWED_YEAR) {
      yearFrom = yf;
    }
  }

  let yearTo: number | undefined = undefined;
  if (raw.yearTo !== undefined && raw.yearTo !== null) {
    const yt = typeof raw.yearTo === "number" ? raw.yearTo : parseInt(String(raw.yearTo), 10);
    if (!Number.isNaN(yt) && yt >= MIN_ALLOWED_YEAR && yt <= MAX_ALLOWED_YEAR) {
      yearTo = yt;
    }
  }

  // If both year bounds exist and yearFrom > yearTo, swap them
  if (yearFrom !== undefined && yearTo !== undefined && yearFrom > yearTo) {
    const temp = yearFrom;
    yearFrom = yearTo;
    yearTo = temp;
  }

  // Validate minimum rating (0 to 10)
  let minRating: number | undefined = undefined;
  if (raw.minRating !== undefined && raw.minRating !== null) {
    const rating =
      typeof raw.minRating === "number" ? raw.minRating : parseFloat(String(raw.minRating));
    if (!Number.isNaN(rating) && rating >= 0 && rating <= 10) {
      minRating = Math.round(rating * 10) / 10;
    }
  }

  // Validate language code format (2-letter ISO 639-1)
  let language: string | undefined = undefined;
  if (raw.language !== undefined && raw.language !== null) {
    const cleanLang = String(raw.language).trim().toLowerCase();
    if (/^[a-z]{2}$/.test(cleanLang)) {
      language = cleanLang;
    }
  }

  return {
    genre,
    yearFrom,
    yearTo,
    minRating,
    language,
    sortBy,
    page,
  };
}

/**
 * Parses URL search parameters into DiscoverFilters.
 */
export function parseDiscoverSearchParams(params: {
  genre?: string;
  yearFrom?: string;
  yearTo?: string;
  rating?: string;
  minRating?: string;
  lang?: string;
  language?: string;
  sort?: string;
  sortBy?: string;
  page?: string;
}): ValidatedDiscoverFilters {
  const genre = params.genre;
  const yearFrom = params.yearFrom ? parseInt(params.yearFrom, 10) : undefined;
  const yearTo = params.yearTo ? parseInt(params.yearTo, 10) : undefined;
  const ratingStr = params.rating || params.minRating;
  const minRating = ratingStr ? parseFloat(ratingStr) : undefined;
  const language = params.language || params.lang;
  const sortBy = (params.sort || params.sortBy) as DiscoverSortOption | undefined;
  const page = params.page ? parseInt(params.page, 10) : undefined;

  return validateDiscoverFilters({
    genre,
    yearFrom,
    yearTo,
    minRating,
    language,
    sortBy,
    page,
  });
}

/**
 * Serializes ValidatedDiscoverFilters into URL query string parameters.
 * Omits default and empty values to keep URLs clean and bookmarkable.
 */
export function serializeDiscoverSearchParams(
  filters: Partial<ValidatedDiscoverFilters>,
  overrides: { page?: number } = {}
): string {
  const searchParams = new URLSearchParams();

  if (filters.genre) {
    searchParams.set("genre", filters.genre);
  }
  if (filters.yearFrom) {
    searchParams.set("yearFrom", String(filters.yearFrom));
  }
  if (filters.yearTo) {
    searchParams.set("yearTo", String(filters.yearTo));
  }
  if (filters.minRating && filters.minRating > 0) {
    searchParams.set("rating", String(filters.minRating));
  }
  if (filters.language) {
    searchParams.set("language", filters.language);
  }
  if (filters.sortBy && filters.sortBy !== "popularity.desc") {
    searchParams.set("sort", filters.sortBy);
  }

  const targetPage = overrides.page !== undefined ? overrides.page : filters.page;
  if (targetPage && targetPage > 1) {
    searchParams.set("page", String(targetPage));
  }

  const queryStr = searchParams.toString();
  return queryStr ? `?${queryStr}` : "";
}
