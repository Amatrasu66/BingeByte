import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { getBackdropUrl } from "@/lib/tmdb/images";
import type { NormalizedMedia } from "@/lib/tmdb/types";
import { Button } from "@/components/ui/button";

export interface FeaturedHeroProps {
  media?: NormalizedMedia | null;
}

export function FeaturedHero({ media }: FeaturedHeroProps) {
  if (!media) {
    return (
      <section
        aria-label="Welcome to BingeByte"
        className="relative w-full overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] py-16 px-6 sm:py-24 sm:px-12 text-left"
      >
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-wider text-[var(--color-text-secondary)]">
            Entertainment Discovery
          </span>
          <h1 className="mt-3 text-3xl sm:text-5xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Cinematic Discovery Platform
          </h1>
          <p className="mt-4 text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed">
            Browse trending movies, top-rated television series, and curated anime collections powered by real-time TMDB metadata.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link href="#trending">
              <Button variant="primary" size="md">
                Explore Catalog
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="secondary" size="md">
                Search Titles
              </Button>
            </Link>
          </div>
        </div>
      </section>
    );
  }

  const backdropUrl = getBackdropUrl(media.backdropPath, "w1280");
  const releaseYear = media.releaseDate ? media.releaseDate.split("-")[0] : null;
  const rating = media.voteAverage > 0 ? media.voteAverage.toFixed(1) : null;
  const mediaLabel = media.mediaType === "tv" ? "TV Series" : "Featured Movie";

  return (
    <section
      aria-labelledby="hero-title"
      className="relative w-full min-h-[460px] sm:min-h-[540px] lg:min-h-[600px] overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] flex items-end"
    >
      {/* Background Artwork */}
      {backdropUrl ? (
        <Image
          src={backdropUrl}
          alt={media.title}
          fill
          priority
          sizes="(max-width: 1280px) 100vw, 1280px"
          className="object-cover object-top"
        />
      ) : (
        <div className="absolute inset-0 bg-[var(--color-surface)]" />
      )}

      {/* Restrained Dark Neutral Scrims for Text Legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/75 to-transparent"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)]/90 via-[var(--color-background)]/50 to-transparent"
        aria-hidden="true"
      />

      {/* Foreground Content */}
      <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-3xl">
        {/* Classification & Metadata Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <span className="rounded bg-[var(--color-surface)]/90 px-2 py-0.5 font-medium uppercase tracking-wider text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] backdrop-blur-xs">
            {mediaLabel}
          </span>
          {releaseYear && (
            <span className="text-[var(--color-text-secondary)] font-medium">
              {releaseYear}
            </span>
          )}
          {rating && (
            <>
              <span className="text-[var(--color-border-subtle)]" aria-hidden="true">
                ·
              </span>
              <span className="text-[var(--color-text-primary)] font-semibold">
                ★ {rating}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1
          id="hero-title"
          className="mt-3 text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.08]"
        >
          {media.title}
        </h1>

        {/* Overview */}
        {media.overview && (
          <p className="mt-4 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed line-clamp-3 max-w-2xl">
            {media.overview}
          </p>
        )}

        {/* Action Controls */}
        <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3.5">
          <Link href="#trending">
            <Button variant="primary" size="md">
              Explore Trending
            </Button>
          </Link>
          <Link href="#movies">
            <Button variant="secondary" size="md">
              Browse Movies
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
