"use client";

import * as React from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/images";
import { formatRuntime } from "@/lib/tmdb/normalizers";
import type {
  NormalizedMovieDetails,
  NormalizedTVDetails,
  NormalizedVideo,
} from "@/lib/tmdb/types";
import { Button } from "@/components/ui/button";
import { TrailerModal } from "./trailer-modal";

export interface MediaDetailHeroProps {
  media: NormalizedMovieDetails | NormalizedTVDetails;
  primaryTrailer?: NormalizedVideo | null;
  customCategory?: "movie" | "tv" | "anime";
}

export function MediaDetailHero({
  media,
  primaryTrailer = null,
  customCategory,
}: MediaDetailHeroProps) {
  const [isTrailerOpen, setIsTrailerOpen] = useState(false);

  const backdropUrl = getBackdropUrl(media.backdropPath, "w1280");
  const posterUrl = getPosterUrl(media.posterPath, "w500");
  const releaseYear = media.releaseDate ? media.releaseDate.split("-")[0] : null;
  const rating = media.voteAverage > 0 ? media.voteAverage.toFixed(1) : null;
  const voteCountFormatted =
    media.voteCount > 0 ? new Intl.NumberFormat("en-US").format(media.voteCount) : null;

  // Determine classification and back link
  const isMovie = media.mediaType === "movie";
  const isAnime =
    customCategory === "anime" ||
    (media.mediaType === "tv" &&
      media.originalLanguage === "ja" &&
      media.genreIds.includes(16));

  const categoryLabel = isAnime
    ? "Anime"
    : isMovie
    ? "Movie"
    : "TV Series";

  const backLinkHref = isAnime ? "/anime" : isMovie ? "/movies" : "/tv";
  const backLinkLabel = isAnime
    ? "Back to Anime"
    : isMovie
    ? "Back to Movies"
    : "Back to TV";

  // Movie or TV specifics
  const movieDetails = isMovie ? (media as NormalizedMovieDetails) : null;
  const tvDetails = !isMovie ? (media as NormalizedTVDetails) : null;

  return (
    <>
      <section
        aria-label={`${media.title} backdrop and overview`}
        className="relative w-full overflow-hidden border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)]"
      >
        {/* Background Backdrop Artwork with Double Scrim */}
        <div className="absolute inset-0 h-[480px] sm:h-[560px] md:h-[640px] w-full overflow-hidden">
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt=""
              role="presentation"
              fill
              priority
              sizes="100vw"
              className="object-cover object-top opacity-40 sm:opacity-50"
            />
          ) : (
            <div className="h-full w-full bg-[var(--color-surface)] opacity-40" />
          )}

          {/* Gradients ensuring high legibility */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent"
            aria-hidden="true"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/60 to-transparent"
            aria-hidden="true"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 mx-auto max-w-7xl px-4 pt-6 pb-12 sm:px-6 sm:pt-8 sm:pb-16 lg:px-8">
          {/* Back Navigation Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link
              href={backLinkHref}
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
              <span>{backLinkLabel}</span>
            </Link>
          </nav>

          <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-10">
            {/* Poster Frame */}
            <div className="relative aspect-[2/3] w-36 sm:w-48 md:w-60 shrink-0 overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-xl">
              {posterUrl ? (
                <Image
                  src={posterUrl}
                  alt={media.title}
                  fill
                  priority
                  sizes="(max-width: 640px) 144px, (max-width: 768px) 192px, 240px"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                  <svg
                    className="h-10 w-10 text-[var(--color-border-subtle)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path d="M7 3v18M17 3v18M3 7h4M3 12h4M3 17h4M17 7h4M17 12h4M17 17h4" />
                  </svg>
                  <span className="mt-2 text-xs text-[var(--color-text-secondary)]">
                    No Poster Available
                  </span>
                </div>
              )}
            </div>

            {/* Title, Metadata & Overview */}
            <div className="flex-1">
              {/* Badges / Header Strip */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-[var(--color-surface)] px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border border-[var(--color-border-subtle)]">
                  {categoryLabel}
                </span>

                {media.status && (
                  <span className="rounded bg-[var(--color-surface)]/80 px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]">
                    {media.status}
                  </span>
                )}

                {releaseYear && (
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {releaseYear}
                  </span>
                )}

                {rating && (
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-[var(--color-border-subtle)]">·</span>
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      ★ {rating}
                    </span>
                    {voteCountFormatted && (
                      <span className="text-[var(--color-text-secondary)]">
                        ({voteCountFormatted})
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Title & Tagline */}
              <h1 className="mt-3 text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
                {media.title}
              </h1>

              {media.tagline && (
                <p className="mt-2 text-sm sm:text-base italic text-[var(--color-text-secondary)]">
                  &ldquo;{media.tagline}&rdquo;
                </p>
              )}

              {/* Quick specs strip: runtime or seasons */}
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                {movieDetails && movieDetails.runtime && (
                  <span>Runtime: {formatRuntime(movieDetails.runtime)}</span>
                )}
                {tvDetails && (
                  <span>
                    {tvDetails.numberOfSeasons}{" "}
                    {tvDetails.numberOfSeasons === 1 ? "Season" : "Seasons"}
                    {tvDetails.numberOfEpisodes > 0 &&
                      ` · ${tvDetails.numberOfEpisodes} Episodes`}
                  </span>
                )}
              </div>

              {/* Genres */}
              {media.genres && media.genres.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5" aria-label="Genres">
                  {media.genres.map((g) => (
                    <span
                      key={g.id}
                      className="rounded bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)]"
                    >
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Overview */}
              {media.overview && (
                <div className="mt-5 max-w-3xl">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)] mb-1.5">
                    Overview
                  </h2>
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-primary)]/90">
                    {media.overview}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {primaryTrailer && (
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => setIsTrailerOpen(true)}
                    className="gap-2"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                    <span>Watch Trailer</span>
                  </Button>
                )}

                {/* Honest Streaming Action (Preserves watch trajectory without false claims) */}
                <div className="relative group">
                  <Button
                    variant="secondary"
                    size="md"
                    disabled
                    aria-label="Streaming player arriving in Phase 7"
                    className="opacity-75 cursor-not-allowed gap-2"
                  >
                    <svg
                      className="h-4 w-4 text-[var(--color-text-secondary)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polygon points="10 8 16 12 10 16 10 8" />
                    </svg>
                    <span>Watch Stream (Phase 7)</span>
                  </Button>
                  <div className="hidden group-hover:block absolute bottom-full mb-2 left-0 w-64 p-2 bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)] text-[11px] text-[var(--color-text-secondary)] rounded shadow-lg pointer-events-none z-20">
                    Video streaming backend and dedicated playback player are scheduled for Phase 7.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trailer Modal Dialog */}
      <TrailerModal
        trailer={primaryTrailer}
        isOpen={isTrailerOpen}
        onClose={() => setIsTrailerOpen(false)}
      />
    </>
  );
}
