"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DISCOVER_SORT_OPTIONS,
  SORT_LABELS,
  SUPPORTED_LANGUAGES,
  type DiscoverSortOption,
  type ValidatedDiscoverFilters,
  serializeDiscoverSearchParams,
} from "@/lib/tmdb/discover-types";
import type { TMDBGenre } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

export interface FilterBarProps {
  basePath: string; // e.g. "/movies", "/tv", "/anime"
  genres: TMDBGenre[];
  currentFilters: ValidatedDiscoverFilters;
  genreError?: string | null;
  yearLabel?: string; // "Release Year" or "First Air Year"
  disableLanguageFilter?: boolean; // e.g. for anime where language is locked to Japanese
  className?: string;
}

const RATING_OPTIONS = [
  { value: "", label: "Any Rating" },
  { value: "9", label: "9+ Masterpiece" },
  { value: "8", label: "8+ Acclaimed" },
  { value: "7", label: "7+ Great" },
  { value: "6", label: "6+ Good" },
  { value: "5", label: "5+ Average" },
];

export function FilterBar({
  basePath,
  genres,
  currentFilters,
  genreError,
  yearLabel = "Year",
  disableLanguageFilter = false,
  className,
}: FilterBarProps) {
  const router = useRouter();
  const [isMobileOpen, setIsMobileOpen] = React.useState(false);

  // Local draft state for explicit "Apply Filters" interaction model
  const [draftGenre, setDraftGenre] = React.useState(currentFilters.genre || "");
  const [draftYearFrom, setDraftYearFrom] = React.useState(
    currentFilters.yearFrom ? String(currentFilters.yearFrom) : ""
  );
  const [draftYearTo, setDraftYearTo] = React.useState(
    currentFilters.yearTo ? String(currentFilters.yearTo) : ""
  );
  const [draftRating, setDraftRating] = React.useState(
    currentFilters.minRating ? String(currentFilters.minRating) : ""
  );
  const [draftLanguage, setDraftLanguage] = React.useState(currentFilters.language || "");
  const [draftSort, setDraftSort] = React.useState<DiscoverSortOption>(
    currentFilters.sortBy || "popularity.desc"
  );

  // Synchronize draft state if URL updates from external navigation
  const [prevFilters, setPrevFilters] = React.useState(currentFilters);
  if (prevFilters !== currentFilters) {
    setPrevFilters(currentFilters);
    setDraftGenre(currentFilters.genre || "");
    setDraftYearFrom(currentFilters.yearFrom ? String(currentFilters.yearFrom) : "");
    setDraftYearTo(currentFilters.yearTo ? String(currentFilters.yearTo) : "");
    setDraftRating(currentFilters.minRating ? String(currentFilters.minRating) : "");
    setDraftLanguage(currentFilters.language || "");
    setDraftSort(currentFilters.sortBy || "popularity.desc");
  }

  // Count active non-default filters
  const activeFilterCount = [
    Boolean(currentFilters.genre),
    Boolean(currentFilters.yearFrom || currentFilters.yearTo),
    Boolean(currentFilters.minRating && currentFilters.minRating > 0),
    Boolean(currentFilters.language),
    Boolean(currentFilters.sortBy && currentFilters.sortBy !== "popularity.desc"),
  ].filter(Boolean).length;

  function handleApply(e?: React.FormEvent) {
    if (e) e.preventDefault();

    const queryStr = serializeDiscoverSearchParams(
      {
        genre: draftGenre || undefined,
        yearFrom: draftYearFrom ? parseInt(draftYearFrom, 10) : undefined,
        yearTo: draftYearTo ? parseInt(draftYearTo, 10) : undefined,
        minRating: draftRating ? parseFloat(draftRating) : undefined,
        language: draftLanguage || undefined,
        sortBy: draftSort,
      },
      { page: 1 } // Reset to page 1 on filter application
    );

    router.push(`${basePath}${queryStr}`);
    setIsMobileOpen(false);
  }

  function handleClearAll() {
    setDraftGenre("");
    setDraftYearFrom("");
    setDraftYearTo("");
    setDraftRating("");
    setDraftLanguage("");
    setDraftSort("popularity.desc");
    router.push(basePath);
    setIsMobileOpen(false);
  }

  function handleRemoveSingleFilter(filterKey: keyof ValidatedDiscoverFilters | "yearRange") {
    const nextFilters: Partial<ValidatedDiscoverFilters> = { ...currentFilters };

    if (filterKey === "genre") delete nextFilters.genre;
    if (filterKey === "yearRange") {
      delete nextFilters.yearFrom;
      delete nextFilters.yearTo;
    }
    if (filterKey === "minRating") delete nextFilters.minRating;
    if (filterKey === "language") delete nextFilters.language;
    if (filterKey === "sortBy") nextFilters.sortBy = "popularity.desc";

    const queryStr = serializeDiscoverSearchParams(nextFilters, { page: 1 });
    router.push(`${basePath}${queryStr}`);
  }

  // Find readable genre name for active badge
  const selectedGenreObj = genres.find((g) => String(g.id) === currentFilters.genre);
  const genreBadgeLabel = selectedGenreObj ? selectedGenreObj.name : `Genre ${currentFilters.genre}`;

  // Find readable language name for active badge
  const selectedLangObj = SUPPORTED_LANGUAGES.find((l) => l.code === currentFilters.language);
  const langBadgeLabel = selectedLangObj ? selectedLangObj.label : currentFilters.language?.toUpperCase();

  return (
    <div className={cn("space-y-4", className)}>
      {/* Mobile Toggle Button */}
      <div className="flex md:hidden items-center justify-between gap-3">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          aria-expanded={isMobileOpen}
          aria-controls="discovery-filter-panel"
          className="w-full justify-center"
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <span className="ml-2 rounded bg-[var(--color-surface-elevated)] px-1.5 py-0.2 text-[11px] font-semibold text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
              {activeFilterCount}
            </span>
          )}
        </Button>

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            aria-label="Clear all applied filters"
            className="text-xs shrink-0"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>

      {/* Filter Form Panel (Always visible on desktop, toggleable on mobile) */}
      <form
        id="discovery-filter-panel"
        onSubmit={handleApply}
        className={cn(
          "rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:p-5 transition-all duration-200",
          isMobileOpen ? "block" : "hidden md:block"
        )}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4 items-end">
          {/* 1. Genre Select */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-genre"
              className="text-xs font-medium text-[var(--color-text-secondary)] block"
            >
              Genre
            </label>
            <select
              id="filter-genre"
              value={draftGenre}
              onChange={(e) => setDraftGenre(e.target.value)}
              disabled={Boolean(genreError) || genres.length === 0}
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-xs text-[var(--color-text-primary)] focus-ring transition-colors disabled:opacity-50"
            >
              <option value="">All Genres</option>
              {genres.map((g) => (
                <option key={g.id} value={String(g.id)}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Year Range (From - To) */}
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
              {yearLabel}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                id="filter-year-from"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                placeholder="From"
                value={draftYearFrom}
                onChange={(e) => setDraftYearFrom(e.target.value)}
                className="w-full h-10 px-2.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-ring transition-colors"
                aria-label={`${yearLabel} minimum`}
              />
              <input
                id="filter-year-to"
                type="number"
                min="1900"
                max={new Date().getFullYear() + 5}
                placeholder="To"
                value={draftYearTo}
                onChange={(e) => setDraftYearTo(e.target.value)}
                className="w-full h-10 px-2.5 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-xs text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus-ring transition-colors"
                aria-label={`${yearLabel} maximum`}
              />
            </div>
          </div>

          {/* 3. Rating Threshold */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-rating"
              className="text-xs font-medium text-[var(--color-text-secondary)] block"
            >
              Minimum Rating
            </label>
            <select
              id="filter-rating"
              value={draftRating}
              onChange={(e) => setDraftRating(e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-xs text-[var(--color-text-primary)] focus-ring transition-colors"
            >
              {RATING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Language or Anime Audio */}
          {!disableLanguageFilter ? (
            <div className="space-y-1.5">
              <label
                htmlFor="filter-language"
                className="text-xs font-medium text-[var(--color-text-secondary)] block"
              >
                Language
              </label>
              <select
                id="filter-language"
                value={draftLanguage}
                onChange={(e) => setDraftLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-xs text-[var(--color-text-primary)] focus-ring transition-colors"
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[var(--color-text-secondary)] block">
                Original Language
              </span>
              <div className="h-10 px-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)]/60 flex items-center text-xs text-[var(--color-text-secondary)]">
                Japanese (Curated JA)
              </div>
            </div>
          )}

          {/* 5. Sort Order */}
          <div className="space-y-1.5">
            <label
              htmlFor="filter-sort"
              className="text-xs font-medium text-[var(--color-text-secondary)] block"
            >
              Sort By
            </label>
            <select
              id="filter-sort"
              value={draftSort}
              onChange={(e) => setDraftSort(e.target.value as DiscoverSortOption)}
              className="w-full h-10 px-3 rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] text-xs text-[var(--color-text-primary)] focus-ring transition-colors"
            >
              {DISCOVER_SORT_OPTIONS.map((sortKey) => (
                <option key={sortKey} value={sortKey}>
                  {SORT_LABELS[sortKey]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls */}
        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-[var(--color-text-secondary)]">
            {genreError ? (
              <span className="text-amber-400/90 text-xs">{genreError}</span>
            ) : (
              <span>Adjust filters and click Apply to update results.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
              >
                Clear All
              </Button>
            )}
            <Button type="submit" variant="primary" size="sm">
              Apply Filters
            </Button>
          </div>
        </div>
      </form>

      {/* Active Filter Badges */}
      {activeFilterCount > 0 && (
        <div
          role="region"
          aria-label="Active filters"
          className="flex flex-wrap items-center gap-2 pt-1"
        >
          <span className="text-xs text-[var(--color-text-secondary)] font-medium mr-1">
            Active:
          </span>

          {currentFilters.genre && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              <span>Genre: {genreBadgeLabel}</span>
              <button
                type="button"
                onClick={() => handleRemoveSingleFilter("genre")}
                aria-label={`Remove genre filter: ${genreBadgeLabel}`}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-ring rounded-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {(currentFilters.yearFrom || currentFilters.yearTo) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              <span>
                {yearLabel}:{" "}
                {currentFilters.yearFrom && currentFilters.yearTo
                  ? `${currentFilters.yearFrom}–${currentFilters.yearTo}`
                  : currentFilters.yearFrom
                    ? `From ${currentFilters.yearFrom}`
                    : `Up to ${currentFilters.yearTo}`}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveSingleFilter("yearRange")}
                aria-label={`Remove ${yearLabel} filter`}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-ring rounded-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.minRating && currentFilters.minRating > 0 && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              <span>Rating: {currentFilters.minRating}+</span>
              <button
                type="button"
                onClick={() => handleRemoveSingleFilter("minRating")}
                aria-label="Remove rating filter"
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-ring rounded-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.language && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              <span>Language: {langBadgeLabel}</span>
              <button
                type="button"
                onClick={() => handleRemoveSingleFilter("language")}
                aria-label="Remove language filter"
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-ring rounded-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          {currentFilters.sortBy && currentFilters.sortBy !== "popularity.desc" && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
              <span>Sort: {SORT_LABELS[currentFilters.sortBy]}</span>
              <button
                type="button"
                onClick={() => handleRemoveSingleFilter("sortBy")}
                aria-label="Reset sort order to most popular"
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-ring rounded-xs"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] underline underline-offset-4 ml-1 focus-ring rounded-xs"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
