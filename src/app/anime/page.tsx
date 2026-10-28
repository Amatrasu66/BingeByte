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
import { JikanSpotlight } from "@/components/anime/jikan-spotlight";
import {
  getTVGenres,
  discoverAnime,
  parseDiscoverSearchParams,
  getSafeErrorMessage,
  TMDBConfigError,
} from "@/lib/tmdb";
import { getJikanTopAnime } from "@/lib/jikan";
import type { TMDBGenre, PaginatedResult, NormalizedMedia } from "@/lib/tmdb/types";

export const metadata = {
  title: "Anime — Japanese Animated Series Discovery | BingeByte",
  description:
    "Curated Japanese animated series discovery filtered by genre, release year, and audience rating.",
};

export interface AnimePageProps {
  searchParams: Promise<{
    genre?: string;
    yearFrom?: string;
    yearTo?: string;
    rating?: string;
    minRating?: string;
    sort?: string;
    sortBy?: string;
    page?: string;
  }>;
}

function AnimeGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5 animate-pulse-subtle">
      {Array.from({ length: 15 }).map((_, i) => (
        <MediaCardSkeleton key={i} />
      ))}
    </div>
  );
}

async function AnimeDiscoveryContent({ searchParams }: AnimePageProps) {
  const params = await searchParams;
  const validatedFilters = parseDiscoverSearchParams(params);

  const hasActiveFilters = Boolean(
    validatedFilters.genre ||
      validatedFilters.yearFrom ||
      validatedFilters.yearTo ||
      validatedFilters.minRating ||
      (validatedFilters.sortBy && validatedFilters.sortBy !== "popularity.desc")
  );

  const isDefaultView = !hasActiveFilters && validatedFilters.page === 1;

  // Fetch TV genres (for secondary genre selection), discover anime, and optional Jikan spotlight in parallel
  const [genresRes, discoverRes, jikanRes] = await Promise.allSettled([
    getTVGenres(),
    discoverAnime(validatedFilters),
    isDefaultView ? getJikanTopAnime(1).catch(() => null) : Promise.resolve(null),
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
    // Exclude Animation genre itself (16) from secondary genre picker since it is the fixed baseline
    genres = genresRes.value.filter((g) => g.id !== 16);
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

  const jikanItems =
    jikanRes.status === "fulfilled" && jikanRes.value?.results
      ? jikanRes.value.results
      : null;

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Configuration Guidance if Credentials are missing */}
      {isConfigError && <ConfigNotice />}

      {/* Header with Title, Statistics, and Documented Anime Approximation Disclaimer */}
      <DiscoveryHeader
        title="Anime Discovery"
        description="Browse Japanese animated television series filtered by sub-genre, release year, and audience rating."
        totalResults={totalResults}
        currentPage={currentPage}
        totalPages={totalPages}
        curatedNote="Curated metadata approximation: TMDB does not provide a native standalone anime media type. BingeByte curates this catalog by querying series with the official Animation genre (16) and Japanese original audio language (ja). Non-Japanese co-productions or animated films are categorized in their respective Movie and TV sections."
      />

      {/* Filter Control Bar with Language Locked to Japanese */}
      <FilterBar
        basePath="/anime"
        genres={genres}
        currentFilters={validatedFilters}
        genreError={genreError}
        yearLabel="Release Year"
        disableLanguageFilter={true}
      />

      {/* Jikan Supplementary MAL Spotlight (Rendered on default view when data is available) */}
      {isDefaultView && <JikanSpotlight items={jikanItems} />}

      {/* Content Results State */}
      {discoverError ? (
        <div
          role="alert"
          className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]"
        >
          <p className="font-medium text-[var(--color-text-primary)]">
            Unable to load anime catalog at this time.
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
            {discoverError}
          </p>
        </div>
      ) : items.length > 0 ? (
        <>
          {/* Anime Media Grid */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
            {items.map((item) => {
              const cardProps = mediaItemToCardProps(item);
              return (
                <MediaCard
                  key={`anime-${item.id}`}
                  {...cardProps}
                  mediaType="anime"
                />
              );
            })}
          </div>

          {/* Pagination Controls */}
          <DiscoveryPagination
            basePath="/anime"
            currentFilters={validatedFilters}
            currentPage={currentPage}
            totalPages={totalPages}
          />
        </>
      ) : (
        /* Empty State */
        <DiscoveryEmptyState
          basePath="/anime"
          hasFilters={hasActiveFilters}
          mediaTypeLabel="anime series"
        />
      )}
    </div>
  );
}

export default function AnimePage({ searchParams }: AnimePageProps) {
  return (
    <AppShell>
      <main className="py-8 sm:py-12">
        <MainContainer className="space-y-12">
          <Suspense fallback={<AnimeGridSkeleton />}>
            <AnimeDiscoveryContent searchParams={searchParams} />
          </Suspense>

          <TMDBAttribution />
        </MainContainer>
      </main>
    </AppShell>
  );
}
