import * as React from "react";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { MediaCard, mediaItemToCardProps } from "@/components/media/media-card";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import { ConfigNotice } from "@/components/home/config-notice";
import {
  FilterBar,
  DiscoveryHeader,
  DiscoveryPagination,
  DiscoveryEmptyState,
} from "@/components/discovery";
import {
  getMovieGenres,
  discoverMovies,
  parseDiscoverSearchParams,
  getSafeErrorMessage,
  TMDBConfigError,
} from "@/lib/tmdb";
import type { TMDBGenre, PaginatedResult, NormalizedMedia } from "@/lib/tmdb/types";

export const metadata = {
  title: "Movies — Cinematic Catalog Discovery | BingeByte",
  description:
    "Explore and filter the global motion picture catalog by genre, release year, minimum rating, and language.",
};

export interface MoviesPageProps {
  searchParams: Promise<{
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
  }>;
}

function MoviesGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5 animate-pulse-subtle">
      {Array.from({ length: 15 }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function MoviesDiscoveryContent({ searchParams }: MoviesPageProps) {
  const params = await searchParams;
  const validatedFilters = parseDiscoverSearchParams(params);

  // Fetch movie genres and discover results in parallel
  const [genresRes, discoverRes] = await Promise.allSettled([
    getMovieGenres(),
    discoverMovies(validatedFilters),
  ]);

  const isConfigError =
    (discoverRes.status === "rejected" &&
      (discoverRes.reason instanceof TMDBConfigError ||
        discoverRes.reason?.name === "TMDBConfigError")) ||
    (genresRes.status === "rejected" &&
      (genresRes.reason instanceof TMDBConfigError ||
        genresRes.reason?.name === "TMDBConfigError"));

  let genres: TMDBGenre[] = [];
  let genreError: string | null = null;
  if (genresRes.status === "fulfilled") {
    genres = genresRes.value;
  } else {
    genreError = "Genre list temporarily unavailable.";
  }

  let result: PaginatedResult<NormalizedMedia> | null = null;
  let discoverError: string | null = null;
  if (discoverRes.status === "fulfilled") {
    result = discoverRes.value;
  } else {
    discoverError = getSafeErrorMessage(discoverRes.reason);
  }

  const items = result?.results || [];
  const totalResults = result?.totalResults || 0;
  const totalPages = result?.totalPages || 0;
  const currentPage = validatedFilters.page;

  const hasActiveFilters = Boolean(
    validatedFilters.genre ||
      validatedFilters.yearFrom ||
      validatedFilters.yearTo ||
      validatedFilters.minRating ||
      validatedFilters.language ||
      (validatedFilters.sortBy && validatedFilters.sortBy !== "popularity.desc")
  );

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Configuration Guidance if Credentials are missing */}
      {isConfigError && <ConfigNotice />}

      {/* Header with Title and Statistics */}
      <DiscoveryHeader
        title="Movie Discovery"
        description="Filter through the global cinema catalog by genre, release year, minimum rating, and language."
        totalResults={totalResults}
        currentPage={currentPage}
        totalPages={totalPages}
      />

      {/* Filter Control Bar */}
      <FilterBar
        basePath="/movies"
        genres={genres}
        currentFilters={validatedFilters}
        genreError={genreError}
        yearLabel="Release Year"
      />

      {/* Content Results State */}
      {discoverError ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]"
        >
          <p className="font-medium text-[var(--color-text-primary)]">
            Unable to load movies at this time.
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
            {discoverError}
          </p>
        </div>
      ) : items.length > 0 ? (
        <>
          {/* Movies Media Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
            {items.map((item) => (
              <MediaCard
                key={`movie-${item.id}`}
                {...mediaItemToCardProps(item)}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          <DiscoveryPagination
            basePath="/movies"
            currentFilters={validatedFilters}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </>
      ) : (
        /* Empty State */
        <DiscoveryEmptyState
          basePath="/movies"
          hasFilters={hasActiveFilters}
          mediaTypeLabel="movies"
        />
      )}
    </div>
  );
}

export default function MoviesPage({ searchParams }: MoviesPageProps) {
  return (
    <AppShell>
      <main className="py-8 sm:py-12">
        <MainContainer className="space-y-12">
          <Suspense fallback={<MoviesGridSkeleton />}>
            <MoviesDiscoveryContent searchParams={searchParams} />
          </Suspense>

          <TMDBAttribution />
        </MainContainer>
      </main>
    </AppShell>
  );
}
