/**
 * ============================================================================
 * Raw TMDB Response Interfaces
 * ============================================================================
 */

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBGenreListResponse {
  genres: TMDBGenre[];
}

export interface TMDBPaginatedResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  original_language: string;
  adult?: boolean;
  video?: boolean;
  media_type?: "movie";
}

export interface TMDBTVShow {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids?: number[];
  original_language: string;
  origin_country?: string[];
  media_type?: "tv";
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBProductionCountry {
  iso_3166_1: string;
  name: string;
}

export interface TMDBSpokenLanguage {
  english_name: string;
  iso_639_1: string;
  name: string;
}

export interface TMDBMovieDetails extends TMDBMovie {
  budget: number;
  revenue: number;
  runtime: number | null;
  status: string;
  tagline: string | null;
  genres: TMDBGenre[];
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  spoken_languages: TMDBSpokenLanguage[];
}

export interface TMDBSeason {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  episode_count: number;
  air_date: string | null;
  poster_path: string | null;
  vote_average?: number;
}

export interface TMDBTVShowDetails extends TMDBTVShow {
  episode_run_time?: number[];
  in_production: boolean;
  languages: string[];
  last_air_date: string | null;
  number_of_episodes: number;
  number_of_seasons: number;
  seasons: TMDBSeason[];
  status: string;
  tagline: string | null;
  genres: TMDBGenre[];
  production_companies: TMDBProductionCompany[];
  production_countries: TMDBProductionCountry[];
  spoken_languages: TMDBSpokenLanguage[];
}

export interface TMDBEpisode {
  id: number;
  name: string;
  overview: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  still_path: string | null;
  vote_average: number;
  vote_count: number;
  runtime: number | null;
}

export interface TMDBSeasonDetails {
  id: number;
  name: string;
  overview: string;
  season_number: number;
  air_date: string | null;
  poster_path: string | null;
  episodes: TMDBEpisode[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
  known_for_department?: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCreditsResponse {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

/**
 * ============================================================================
 * Normalized Application Interfaces
 * ============================================================================
 */

export type MediaType = "movie" | "tv";

export interface NormalizedMedia {
  id: number;
  mediaType: MediaType;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string | null;
  voteAverage: number;
  voteCount: number;
  genreIds: number[];
  originalLanguage: string;
  popularity: number;
}

export interface PaginatedResult<T> {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
}

export interface NormalizedMovieDetails extends NormalizedMedia {
  runtime: number | null;
  status: string;
  tagline: string | null;
  budget: number;
  revenue: number;
  genres: TMDBGenre[];
  productionCompanies: TMDBProductionCompany[];
}

export interface NormalizedSeason {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  episodeCount: number;
  airDate: string | null;
  posterPath: string | null;
}

export interface NormalizedTVDetails extends NormalizedMedia {
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status: string;
  tagline: string | null;
  genres: TMDBGenre[];
  seasons: NormalizedSeason[];
  productionCompanies: TMDBProductionCompany[];
}

export interface NormalizedEpisode {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  stillPath: string | null;
  voteAverage: number;
  voteCount: number;
  runtime: number | null;
}

export interface NormalizedSeasonDetails {
  id: number;
  seasonNumber: number;
  name: string;
  overview: string;
  airDate: string | null;
  posterPath: string | null;
  episodes: NormalizedEpisode[];
}

export interface NormalizedCredit {
  id: number;
  name: string;
  role: string;
  department?: string;
  profilePath: string | null;
}

export interface NormalizedCredits {
  id: number;
  cast: NormalizedCredit[];
  crew: NormalizedCredit[];
}
