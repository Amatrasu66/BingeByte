"use client";

import * as React from "react";
import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { getStillUrl } from "@/lib/tmdb/images";
import { formatRuntime } from "@/lib/tmdb/normalizers";
import type {
  NormalizedSeason,
  NormalizedSeasonDetails,
  NormalizedEpisode,
} from "@/lib/tmdb/types";
import { SectionHeading } from "@/components/section-heading";

export interface TVEpisodeNavigationProps {
  tvId: number;
  seasons: NormalizedSeason[];
  currentSeasonNumber: number;
  currentEpisodeNumber: number;
  initialSeasonData?: NormalizedSeasonDetails | null;
}

export function TVEpisodeNavigation({
  tvId,
  seasons,
  currentSeasonNumber,
  currentEpisodeNumber,
  initialSeasonData = null,
}: TVEpisodeNavigationProps) {

  const sortedSeasons = useMemo(() => {
    if (!seasons || seasons.length === 0) return [];
    return [...seasons].sort((a, b) => a.seasonNumber - b.seasonNumber);
  }, [seasons]);

  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(
    currentSeasonNumber
  );

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
          throw new Error(`Failed to load season ${seasonNum}`);
        }
        const data: NormalizedSeasonDetails = await res.json();
        setCache((prev) => ({ ...prev, [seasonNum]: data }));
      } catch (err) {
        console.error("Failed to load season:", err);
        setError(`Unable to load season ${seasonNum} episodes.`);
      } finally {
        setIsLoading(false);
      }
    },
    [tvId, cache]
  );

  const handleSeasonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const seasonNum = parseInt(e.target.value, 10);
    fetchSeason(seasonNum);
  };

  const activeSeasonData = cache[selectedSeasonNumber];

  if (!seasons || seasons.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="episodes-heading" className="w-full space-y-6">
      <SectionHeading
        title="Episodes & Seasons"
        description="Select an episode to explore metadata and official preview"
        action={
          <div className="flex items-center gap-2">
            <label htmlFor="watch-season-select" className="sr-only">
              Select season
            </label>
            <select
              id="watch-season-select"
              value={selectedSeasonNumber}
              onChange={handleSeasonChange}
              disabled={isLoading}
              className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-3 py-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] focus-ring cursor-pointer hover:border-[var(--color-border-hover)]"
            >
              {sortedSeasons.map((s) => (
                <option key={s.id} value={s.seasonNumber}>
                  {s.name || `Season ${s.seasonNumber}`}{" "}
                  {s.episodeCount > 0 ? `(${s.episodeCount} eps)` : ""}
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Loading state skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 animate-pulse-subtle">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3"
            >
              <div className="aspect-video w-full rounded bg-[var(--color-surface-deep)]" />
              <div className="mt-3 h-4 w-3/4 rounded bg-[var(--color-surface-deep)]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-[var(--color-surface-deep)]" />
            </div>
          ))}
        </div>
      )}

      {/* Error state */}
      {!isLoading && error && (
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 text-center space-y-3">
          <p className="text-sm text-[var(--color-text-secondary)]">{error}</p>
          <button
            type="button"
            onClick={() => fetchSeason(selectedSeasonNumber)}
            className="rounded bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus-ring"
          >
            Retry Season {selectedSeasonNumber}
          </button>
        </div>
      )}

      {/* Episode Cards Grid */}
      {!isLoading && !error && activeSeasonData && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeSeasonData.episodes.map((ep: NormalizedEpisode) => {
            const isCurrent =
              selectedSeasonNumber === currentSeasonNumber &&
              ep.episodeNumber === currentEpisodeNumber;
            const stillUrl = getStillUrl(ep.stillPath, "w300");

            return (
              <Link
                key={ep.id}
                href={`/watch?type=tv&id=${tvId}&season=${selectedSeasonNumber}&episode=${ep.episodeNumber}`}
                className={`group flex flex-col rounded-lg border p-3 transition-all focus-ring ${
                  isCurrent
                    ? "border-[var(--color-text-primary)] bg-[var(--color-surface-elevated,var(--color-surface))] shadow-md ring-1 ring-[var(--color-text-primary)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
                }`}
              >
                {/* Episode Image */}
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
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                      No Still
                    </div>
                  )}

                  {/* Badge */}
                  <span className="absolute bottom-2 left-2 rounded bg-[var(--color-surface-deep)]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                    EP {ep.episodeNumber}
                  </span>

                  {isCurrent && (
                    <span className="absolute top-2 left-2 rounded bg-red-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white shadow">
                      Selected
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="mt-2.5 flex flex-col flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h4
                      title={ep.name}
                      className="truncate text-sm font-semibold text-[var(--color-text-primary)]"
                    >
                      {ep.name || `Episode ${ep.episodeNumber}`}
                    </h4>
                  </div>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                    {ep.airDate && <span>{ep.airDate.split("-")[0]}</span>}
                    {ep.runtime && (
                      <>
                        <span>·</span>
                        <span>{formatRuntime(ep.runtime)}</span>
                      </>
                    )}
                    {ep.voteAverage > 0 && (
                      <>
                        <span>·</span>
                        <span>★ {ep.voteAverage.toFixed(1)}</span>
                      </>
                    )}
                  </div>

                  {ep.overview && (
                    <p className="mt-2 line-clamp-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {ep.overview}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
