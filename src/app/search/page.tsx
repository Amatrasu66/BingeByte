import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { SearchInput } from "@/components/search/search-input";
import { MediaCard, mediaItemToCardProps } from "@/components/media/media-card";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import { Button } from "@/components/ui/button";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import { multiSearch } from "@/lib/tmdb";
import type { PaginatedResult, NormalizedMedia } from "@/lib/tmdb/types";

export interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    page?: string;
  }>;
}

function SearchFallback() {
  return (
    <div className="space-y-8 animate-pulse-subtle">
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <div className="h-8 w-48 bg-[var(--color-surface)] rounded mx-auto" />
        <div className="h-4 w-96 bg-[var(--color-surface)] rounded mx-auto" />
        <div className="h-12 w-full max-w-2xl bg-[var(--color-surface)] rounded-md mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
        <MediaCardSkeleton />
        <MediaCardSkeleton />
        <MediaCardSkeleton />
        <MediaCardSkeleton />
        <MediaCardSkeleton />
      </div>
    </div>
  );
}

async function SearchResults({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const rawQuery = params.q || "";
  const query = rawQuery.trim();
  const currentPage = Math.max(1, parseInt(params.page || "1", 10) || 1);

  let searchResult: PaginatedResult<NormalizedMedia> | null = null;
  let searchError: string | null = null;

  if (query) {
    try {
      searchResult = await multiSearch(query, currentPage);
    } catch (err: unknown) {
      if (err instanceof Error) {
        searchError = err.message;
      } else {
        searchError = "An unexpected error occurred while searching.";
      }
    }
  }

  const results = searchResult?.results || [];
  const totalResults = searchResult?.totalResults || 0;
  const totalPages = searchResult?.totalPages || 0;
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-8 sm:space-y-12">
      {/* Search Header & Input */}
      <div className="space-y-4 text-center max-w-2xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Search Catalog
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Find movies, television series, and anime across the TMDB entertainment database.
        </p>
        <div className="pt-2">
          <SearchInput initialQuery={query} />
        </div>
      </div>

      {/* Results State */}
      {query ? (
        <div className="space-y-6">
          {/* Results Summary Heading */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[var(--color-border-subtle)]">
            <h2 className="text-lg font-semibold tracking-tight text-[var(--color-text-primary)]">
              Results for &ldquo;{query}&rdquo;
            </h2>
            <span className="text-xs text-[var(--color-text-secondary)]">
              {totalResults} {totalResults === 1 ? "title" : "titles"} found
              {totalPages > 1 && ` · Page ${currentPage} of ${totalPages}`}
            </span>
          </div>

          {/* Error Message */}
          {searchError ? (
            <div
              role="alert"
              className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]"
            >
              <p className="font-medium text-[var(--color-text-primary)]">
                Search request could not be completed.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
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

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="pt-8 flex items-center justify-center gap-3">
                  {hasPrevious ? (
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}
                    >
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
                    <Link
                      href={`/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}
                    >
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
              <p className="mt-2 text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
                Try checking for spelling errors, using fewer keywords, or searching for a general franchise name.
              </p>
            </div>
          )}
        </div>
      ) : (
        /* Initial Empty State */
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/50 p-12 text-center text-sm text-[var(--color-text-secondary)]">
          <p className="text-base font-medium text-[var(--color-text-primary)]">
            Enter a title or keyword above
          </p>
          <p className="mt-2 text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
            Search across millions of movies, television series, and anime titles powered by The Movie Database.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <AppShell>
      <main className="py-8 sm:py-12">
        <MainContainer className="space-y-8 sm:space-y-12">
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
