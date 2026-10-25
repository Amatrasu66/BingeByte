import type {
  TMDBMovie,
  TMDBTVShow,
  TMDBMovieDetails,
  TMDBTVShowDetails,
  TMDBSeasonDetails,
  TMDBCreditsResponse,
  TMDBPaginatedResponse,
  NormalizedMedia,
  NormalizedMovieDetails,
  NormalizedTVDetails,
  NormalizedSeasonDetails,
  NormalizedCredits,
  PaginatedResult,
} from "./types";

/**
 * Normalizes a raw TMDB Movie into the unified application media representation.
 */
export function normalizeMovie(raw: TMDBMovie): NormalizedMedia {
  return {
    id: raw.id,
    mediaType: "movie",
    title: raw.title || raw.original_title || "Untitled",
    overview: raw.overview || "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date || null,
    voteAverage: typeof raw.vote_average === "number" ? raw.vote_average : 0,
    voteCount: typeof raw.vote_count === "number" ? raw.vote_count : 0,
    genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids : [],
    originalLanguage: raw.original_language || "en",
    popularity: typeof raw.popularity === "number" ? raw.popularity : 0,
  };
}

/**
 * Normalizes a raw TMDB TV Show into the unified application media representation.
 */
export function normalizeTVShow(raw: TMDBTVShow): NormalizedMedia {
  return {
    id: raw.id,
    mediaType: "tv",
    title: raw.name || raw.original_name || "Untitled",
    overview: raw.overview || "",
    posterPath: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.first_air_date || null,
    voteAverage: typeof raw.vote_average === "number" ? raw.vote_average : 0,
    voteCount: typeof raw.vote_count === "number" ? raw.vote_count : 0,
    genreIds: Array.isArray(raw.genre_ids) ? raw.genre_ids : [],
    originalLanguage: raw.original_language || "en",
    popularity: typeof raw.popularity === "number" ? raw.popularity : 0,
  };
}

/**
 * Normalizes any media item (movie or TV) based on explicit media_type or property presence.
 */
export function normalizeMedia(
  raw: (TMDBMovie | TMDBTVShow) & { media_type?: string }
): NormalizedMedia {
  if (raw.media_type === "tv" || ("name" in raw && !("title" in raw))) {
    return normalizeTVShow(raw as TMDBTVShow);
  }
  return normalizeMovie(raw as TMDBMovie);
}

/**
 * Normalizes a TMDB paginated response using a mapping function.
 */
export function normalizePaginated<R, N>(
  raw: TMDBPaginatedResponse<R>,
  normalizer: (item: R) => N
): PaginatedResult<N> {
  const results = Array.isArray(raw.results) ? raw.results.map(normalizer) : [];
  return {
    page: raw.page || 1,
    totalPages: raw.total_pages || 0,
    totalResults: raw.total_results || 0,
    results,
  };
}

/**
 * Normalizes detailed movie metadata.
 */
export function normalizeMovieDetails(raw: TMDBMovieDetails): NormalizedMovieDetails {
  const base = normalizeMovie(raw);
  return {
    ...base,
    runtime: typeof raw.runtime === "number" && raw.runtime > 0 ? raw.runtime : null,
    status: raw.status || "Unknown",
    tagline: raw.tagline || null,
    budget: typeof raw.budget === "number" ? raw.budget : 0,
    revenue: typeof raw.revenue === "number" ? raw.revenue : 0,
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    productionCompanies: Array.isArray(raw.production_companies)
      ? raw.production_companies
      : [],
  };
}

/**
 * Normalizes detailed TV show metadata.
 */
export function normalizeTVDetails(raw: TMDBTVShowDetails): NormalizedTVDetails {
  const base = normalizeTVShow(raw);
  return {
    ...base,
    numberOfSeasons: typeof raw.number_of_seasons === "number" ? raw.number_of_seasons : 0,
    numberOfEpisodes:
      typeof raw.number_of_episodes === "number" ? raw.number_of_episodes : 0,
    status: raw.status || "Unknown",
    tagline: raw.tagline || null,
    genres: Array.isArray(raw.genres) ? raw.genres : [],
    seasons: Array.isArray(raw.seasons)
      ? raw.seasons.map((s) => ({
          id: s.id,
          seasonNumber: s.season_number,
          name: s.name || `Season ${s.season_number}`,
          overview: s.overview || "",
          episodeCount: s.episode_count || 0,
          airDate: s.air_date || null,
          posterPath: s.poster_path ?? null,
        }))
      : [],
    productionCompanies: Array.isArray(raw.production_companies)
      ? raw.production_companies
      : [],
  };
}

/**
 * Normalizes TV season and episode details.
 */
export function normalizeSeasonDetails(raw: TMDBSeasonDetails): NormalizedSeasonDetails {
  return {
    id: raw.id,
    seasonNumber: raw.season_number,
    name: raw.name || `Season ${raw.season_number}`,
    overview: raw.overview || "",
    airDate: raw.air_date || null,
    posterPath: raw.poster_path ?? null,
    episodes: Array.isArray(raw.episodes)
      ? raw.episodes.map((ep) => ({
          id: ep.id,
          episodeNumber: ep.episode_number,
          seasonNumber: ep.season_number,
          name: ep.name || `Episode ${ep.episode_number}`,
          overview: ep.overview || "",
          airDate: ep.air_date || null,
          stillPath: ep.still_path ?? null,
          voteAverage: typeof ep.vote_average === "number" ? ep.vote_average : 0,
          voteCount: typeof ep.vote_count === "number" ? ep.vote_count : 0,
          runtime: typeof ep.runtime === "number" && ep.runtime > 0 ? ep.runtime : null,
        }))
      : [],
  };
}

/**
 * Normalizes cast and crew credits.
 */
export function normalizeCredits(raw: TMDBCreditsResponse): NormalizedCredits {
  return {
    id: raw.id,
    cast: Array.isArray(raw.cast)
      ? raw.cast.map((c) => ({
          id: c.id,
          name: c.name || "Unknown",
          role: c.character || "Cast",
          department: c.known_for_department,
          profilePath: c.profile_path ?? null,
        }))
      : [],
    crew: Array.isArray(raw.crew)
      ? raw.crew.map((c) => ({
          id: c.id,
          name: c.name || "Unknown",
          role: c.job || "Crew",
          department: c.department,
          profilePath: c.profile_path ?? null,
        }))
      : [],
  };
}
