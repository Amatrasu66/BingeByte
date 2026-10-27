import * as React from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { GooeySearchBar, type SearchContentType } from "@/components/search/gooey-search-bar";
import { MediaCard, mediaItemToCardProps } from "@/components/media/media-card";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { Button } from "@/components/ui/button";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import { multiSearch, searchMovies, searchTV, getSafeErrorMessage } from "@/lib/tmdb";
import type { PaginatedResult, NormalizedMedia } from "@/lib/tmdb/types";

export interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    type?: string;
    page?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: SearchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q?.trim();
  if (q) {
    return {
      title: `Search: ${q} | BingeByte`,
      description: `Search results for "${q}" across the BingeByte movie and TV catalog.`,
    };
  }
  return {
    title: "Search Catalog | BingeByte",
    description: "Search movies, television series, and entertainment on BingeByte.",
  };
}

function SearchFallback() {
  return (
    <div className="space-y-8 animate-pulse-subtle max-w-5xl mx-auto py-12">
      <div className="h-14 w-full max-w-2xl bg-[var(--color-surface)] rounded-full mx-auto" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5 pt-8">
        {Array.from({ length: 5 }).map((_, i) => (
          <MediaCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

function buildSearchUrl(q: string, type: SearchContentType, page: number): string {
  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (type !== "all") {
    params.set("type", type);
  }
  if (page > 1) {
    params.set("page", String(page));
  }
  const queryStr = params.toString();
  return queryStr ? `/search?${queryStr}` : "/search";
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = params.q || "";
  const query = rawQuery.trim();

  // Validate and sanitize content type
  const rawType = params.type || "all";
  const contentType: SearchContentType =
    rawType === "movie" || rawType === "tv" ? rawType : "all";

  // Validate and clamp page number (1 <= page <= 500)
  const rawPage = parseInt(params.page || "1", 10);
  const currentPage = !Number.isNaN(rawPage) && rawPage >= 1 ? Math.min(500, rawPage) : 1;

  let searchResult: PaginatedResult<NormalizedMedia> | null = null;
  let searchError: string | null = null;

  if (query) {
    try {
      if (contentType === "movie") {
        searchResult = await searchMovies(query, currentPage);
      } else if (contentType === "tv") {
        searchResult = await searchTV(query, currentPage);
      } else {
        searchResult = await multiSearch(query, currentPage);
      }
    } catch (err: unknown) {
      searchError = getSafeErrorMessage(err);
    }
  }

  const results = searchResult?.results || [];
  const totalResults = searchResult?.totalResults || 0;
  const totalPages = Math.min(500, searchResult?.totalPages || 0);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const typeLabels: Record<SearchContentType, string> = {
    all: "All Titles",
    movie: "Movies",
    tv: "TV Series",
  };

  // 1. Initial State: No query entered yet (Center Vertically in fullscreen nearly-black container)
  if (!query) {
    return (
      <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Search BingeByte
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)]">
              Discover millions of movies, television series, and anime.
            </p>
          </div>

          {/* Centered White Rounded Gooey Search Bar */}
          <GooeySearchBar initialQuery="" initialType={contentType} />

          {/* Suggested quick searches */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-[var(--color-text-secondary)]">
            <span className="font-medium text-neutral-400">Popular:</span>
            {["Inception", "Breaking Bad", "Attack on Titan", "Interstellar", "Dark"].map((tag) => (
              <Link
                key={tag}
                href={`/search?q=${encodeURIComponent(tag)}`}
                className="rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-2.5 py-1 text-xs text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Search Results State
  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Search Header with Centered Gooey Input */}
      <div className="space-y-4 pt-2">
        <GooeySearchBar initialQuery={query} initialType={contentType} />
      </div>

      <div className="space-y-6">
        {/* Results Summary Heading */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--color-border-subtle)]">
          <div className="flex items-baseline gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
              Results for &ldquo;{query}&rdquo;
            </h2>
            <span className="text-xs text-[var(--color-text-secondary)]">
              in {typeLabels[contentType]}
            </span>
          </div>
          <span className="text-xs text-[var(--color-text-secondary)]">
            {totalResults.toLocaleString()} {totalResults === 1 ? "title" : "titles"} found
            {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
          </span>
        </div>

        {/* Safe Error Message */}
        {searchError ? (
          <div
            role="alert"
            className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]"
          >
            <p className="font-medium text-[var(--color-text-primary)]">
              Search request could not be completed.
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
              {searchError}
            </p>
          </div>
        ) : results.length > 0 ? (
          <>
            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
              {results.map((item) => (
                <MediaCard
                  key={`${item.mediaType}-${item.id}`}
                  {...mediaItemToCardProps(item)}
                />
              ))}
            </div>

            {/* Pagination Controls preserving query and content type */}
            {totalPages > 1 && (
              <div className="pt-8 flex items-center justify-center gap-3">
                {hasPrevious ? (
                  <Link href={buildSearchUrl(query, contentType, currentPage - 1)}>
                    <Button variant="secondary" size="sm">
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" disabled>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}

                <span className="text-xs text-[var(--color-text-secondary)] px-2">
                  {currentPage} / {totalPages}
                </span>

                {hasNext ? (
                  <Link href={buildSearchUrl(query, contentType, currentPage + 1)}>
                    <Button variant="secondary" size="sm">
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </Link>
                ) : (
                  <Button variant="secondary" size="sm" disabled>
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          /* No Results State */
          <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-text-secondary)]">
            <p className="text-base font-medium text-[var(--color-text-primary)]">
              No titles found matching &ldquo;{query}&rdquo;
            </p>
            <p className="mt-2 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
              {contentType !== "all"
                ? `Try switching to "All Titles" or searching for a broader keyword.`
                : "Try checking for spelling errors, using fewer keywords, or searching for a general title."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <AppShell>
      <main className="py-6 sm:py-10">
        <MainContainer className="space-y-6 sm:space-y-8">
          {/* Breadcrumb / Back Navigation */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded-xs py-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Discovery</span>
            </Link>
          </div>

          <Suspense fallback={<SearchFallback />}>
            <SearchResults searchParams={searchParams} />
          </Suspense>

          {/* TMDB Attribution */}
          <TMDBAttribution />
        </MainContainer>
      </main>
    </AppShell>
  );
}
