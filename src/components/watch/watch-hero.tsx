import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { getBackdropUrl } from "@/lib/tmdb/images";
import type { NormalizedMedia, NormalizedEpisode } from "@/lib/tmdb/types";

export interface WatchHeroProps {
  media: NormalizedMedia;
  episode?: NormalizedEpisode | null;
  seasonNumber?: number;
}

export function WatchHero({ media, episode, seasonNumber }: WatchHeroProps) {
  const backdropUrl = getBackdropUrl(media.backdropPath, "w1280");
  const isTV = media.mediaType === "tv";
  const detailsHref = `/${media.mediaType}/${media.id}`;
  const releaseYear = media.releaseDate ? media.releaseDate.split("-")[0] : null;

  return (
    <section
      aria-label="Playback overview"
      className="relative w-full overflow-hidden border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)]"
    >
      {/* Background Backdrop Artwork with Scrim */}
      <div className="absolute inset-0 h-[260px] sm:h-[320px] w-full overflow-hidden">
        {backdropUrl ? (
          <Image
            src={backdropUrl}
            alt=""
            role="presentation"
            fill
            priority
            sizes="100vw"
            className="object-cover object-top opacity-25"
          />
        ) : (
          <div className="h-full w-full bg-[var(--color-surface)] opacity-20" />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent"
          aria-hidden="true"
        />
      </div>

      {/* Content Container */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-6 sm:px-6 sm:pt-8 sm:pb-8 lg:px-8">
        {/* Back Link */}
        <nav aria-label="Breadcrumb" className="mb-4">
          <Link
            href={detailsHref}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded py-1 pr-2"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Back to Details</span>
          </Link>
        </nav>

        {/* Title and Metadata */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-[var(--color-surface)] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
              {isTV ? "TV Series" : "Movie"}
            </span>

            {releaseYear && (
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {releaseYear}
              </span>
            )}

            {media.voteAverage > 0 && (
              <span className="text-xs font-medium text-[var(--color-text-primary)]">
                · ★ {media.voteAverage.toFixed(1)}
              </span>
            )}

            {/* Streaming and trailer playback badge */}
            <span className="rounded bg-[var(--color-surface-deep)]/90 px-2 py-0.5 text-[10px] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
              Streaming Playback & Official Trailers
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[var(--color-text-primary)]">
            {media.title}
          </h1>

          {/* Episode context for TV */}
          {isTV && episode && (
            <div className="mt-1 flex flex-wrap items-baseline gap-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Season {seasonNumber ?? episode.seasonNumber}, Episode {episode.episodeNumber}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                — {episode.name}
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
