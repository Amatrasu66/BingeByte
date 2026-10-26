"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStillUrl } from "@/lib/tmdb/images";
import { formatRuntime } from "@/lib/tmdb/normalizers";
import type {
  NormalizedSeason,
  NormalizedSeasonDetails,
} from "@/lib/tmdb/types";
import { SectionHeading } from "@/components/section-heading";

export interface SeasonSelectorProps {
  tvId: number;
  seasons: NormalizedSeason[];
  initialSeasonData?: NormalizedSeasonDetails | null;
}

export function SeasonSelector({
  tvId,
  seasons,
  initialSeasonData = null,
}: SeasonSelectorProps) {
  // Sort seasons with specials (season 0) or regular seasons
  const sortedSeasons = React.useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    return [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  }, [seasons]);

  // Default to Season 1 if present, otherwise the first available season
  const defaultSeason =
    sortedSeasons.find((s) => s.seasonNumber === 1)?.seasonNumber ??
    sortedSeasons[0]?.seasonNumber ??
    1;

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    initialSeasonData?.seasonNumber ?? defaultSeason
  );

  // In-memory cache to prevent redundant requests
  const [cache, setCache] = useState<Record<number, NormalizedSeasonDetails>>(() => {
    if (initialSeasonData) {
      return { [initialSeasonData.seasonNumber]: initialSeasonData };
    }
    return {};
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSeason = useCallback(
    async (seasonNum: number) => {
      if (cache[seasonNum]) {
        setSelectedSeasonNumber(seasonNum);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);
      setSelectedSeasonNumber(seasonNum);

      try {
        const res = await fetch(`/api/tv/${tvId}/season/${seasonNum}`);
        if (!res.ok) {
          throw new Error(`Failed to load season details (${res.status})`);
        }
        const data: NormalizedSeasonDetails = await res.json();
        setCache((prev) => ({ ...prev, [seasonNum]: data }));
      } catch (err) {
        console.error("Season fetch error:", err);
        setError("Unable to load episodes for this season. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [tvId, cache]
  );

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonNum = parseInt(e.target.value, 10);
    fetchSeason(seasonNum);
  };

  const activeSeasonData = cache[selectedSeasonNumber];
  const activeSeasonMeta = sortedSeasons.find(
    (s) => s.seasonNumber === selectedSeasonNumber
  );

  if (!seasons || seasons.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="seasons-heading" className="w-full">
      <SectionHeading
        title="Episodes & Seasons"
        description="Browse episodes by season"
        action={
          <div className="flex items-center gap-2">
            <label htmlFor="season-select" className="sr-only">
              Select season
            </label>
            <select
              id="season-select"
              value={selectedSeasonNumber}
              onChange={handleSelectChange}
              disabled={isLoading}
              aria-label="Select season"
              className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] focus-ring cursor-pointer hover:border-[var(--color-border-hover)]"
            >
              {sortedSeasons.map((season) => (
                <option key={season.id} value={season.seasonNumber}>
                  {season.name || `Season ${season.seasonNumber}`}{" "}
                  {season.episodeCount > 0 ? `(${season.episodeCount} eps)` : ""}
                </option>
              ))}
            </select>
          </div>
        }
        className="mb-6"
      />

      {/* Season Overview description if present */}
      {activeSeasonData?.overview && (
        <p className="mb-6 text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-3xl">
          {activeSeasonData.overview}
        </p>
      )}

      {/* Loading state skeleton */}
      {isLoading && (
        <div
          aria-label="Loading episodes"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 animate-pulse-subtle"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3"
            >
              <div className="aspect-video w-full rounded bg-[var(--color-surface-deep)]" />
              <div className="mt-3 h-4 w-3/4 rounded bg-[var(--color-surface-deep)]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-deep)]" />
              <div className="mt-3 h-10 w-full rounded bg-[var(--color-surface-deep)]" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={() => fetchSeason(selectedSeasonNumber)}
            className="mt-4 rounded-md bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus-ring cursor-pointer"
          >
            Retry Season {selectedSeasonNumber}
          </button>
        </div>
      )}

      {/* Episodes Grid */}
      {!isLoading && !error && activeSeasonData && (
        <>
          {activeSeasonData.episodes.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
              No episode details currently available for{" "}
              {activeSeasonMeta?.name || `Season ${selectedSeasonNumber}`}.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {activeSeasonData.episodes.map((ep) => {
                const stillUrl = getStillUrl(ep.stillPath, "w300");
                const releaseYear = ep.airDate
                  ? new Date(ep.airDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })
                  : null;

                return (
                  <article
                    key={ep.id}
                    className="group flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 transition-colors duration-200 hover:border-[var(--color-border-hover)]"
                  >
                    {/* 16:9 Episode Still */}
                    <div className="relative aspect-video w-full overflow-hidden rounded bg-[var(--color-surface-deep)]">
                      {stillUrl ? (
                        <Image
                          src={stillUrl}
                          alt={ep.name}
                          fill
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                          <svg
                            className="h-8 w-8 text-[var(--color-border-subtle)]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <circle cx="9" cy="9" r="2" />
                            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                          </svg>
                          <span className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                            Still Unavailable
                          </span>
                        </div>
                      )}

                      {/* Episode Number badge */}
                      <span className="absolute bottom-2 left-2 rounded bg-[var(--color-surface-deep)]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] backdrop-blur-xs">
                        EP {ep.episodeNumber}
                      </span>

                      {/* Rating chip if available */}
                      {ep.voteAverage > 0 && (
                        <span className="absolute top-2 right-2 rounded bg-[var(--color-surface-deep)]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] backdrop-blur-xs">
                          ★ {ep.voteAverage.toFixed(1)}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="mt-3 flex flex-col flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <h4
                          title={ep.name}
                          className="truncate text-sm font-semibold text-[var(--color-text-primary)]"
                        >
                          {ep.name || `Episode ${ep.episodeNumber}`}
                        </h4>
                      </div>

                      <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                        {releaseYear && <span>{releaseYear}</span>}
                        {ep.runtime && (
                          <>
                            <span>·</span>
                            <span>{formatRuntime(ep.runtime)}</span>
                          </>
                        )}
                      </div>

                      {ep.overview ? (
                        <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                          {ep.overview}
                        </p>
                      ) : (
                        <p className="mt-2 text-xs italic text-[var(--color-text-secondary)]/70">
                          No episode overview recorded.
                        </p>
                      )}

                      <div className="mt-3 pt-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
                        <Link
                          href={`/watch?type=tv&id=${tvId}&season=${selectedSeasonNumber}&episode=${ep.episodeNumber}`}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-primary)] hover:underline focus-ring rounded"
                        >
                          <span>Watch Episode</span>
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </section>
  );
}
