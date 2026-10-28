"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { getBackdropUrl } from "@/lib/tmdb/images";
import { getGenreNames } from "@/lib/tmdb/genres";
import { FALLBACK_FEATURED_TITLES } from "@/lib/tmdb/featured";
import type { NormalizedMedia } from "@/lib/tmdb/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FeaturedHeroProps {
  /** Array of normalized media items to feature in rotation */
  items?: NormalizedMedia[] | null;
  /** Single item fallback for backwards compatibility */
  media?: NormalizedMedia | null;
  /** Automatic rotation duration in milliseconds (default: 8000ms / 8s) */
  intervalMs?: number;
  className?: string;
}

const subscribeReducedMotion = (callback: () => void) => {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
};

const getReducedMotionSnapshot = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

const getReducedMotionServerSnapshot = () => false;

export function FeaturedHero({
  items,
  media,
  intervalMs = 8000,
  className,
}: FeaturedHeroProps) {
  // Resolve featured items list
  const mediaList = React.useMemo(() => {
    if (items && items.length > 0) return items;
    if (media) return [media];
    return FALLBACK_FEATURED_TITLES;
  }, [items, media]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const prefersReducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );
  const heroRef = React.useRef<HTMLElement>(null);

  const totalSlides = mediaList.length;

  const goToSlide = React.useCallback(
    (index: number) => {
      setActiveIndex((index + totalSlides) % totalSlides);
    },
    [totalSlides]
  );

  const nextSlide = React.useCallback(() => {
    goToSlide(activeIndex + 1);
  }, [activeIndex, goToSlide]);

  const prevSlide = React.useCallback(() => {
    goToSlide(activeIndex - 1);
  }, [activeIndex, goToSlide]);

  // Automatic rotation timer
  React.useEffect(() => {
    if (totalSlides <= 1 || isPaused || isHovered || isFocused || prefersReducedMotion) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % totalSlides);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [totalSlides, isPaused, isHovered, isFocused, prefersReducedMotion, intervalMs]);

  // Keyboard navigation within hero
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prevSlide();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      nextSlide();
    } else if (event.key === " " && event.target === heroRef.current) {
      event.preventDefault();
      setIsPaused((p) => !p);
    }
  };

  const nextIndex = (activeIndex + 1) % totalSlides;
  const nextMedia = mediaList[nextIndex];

  return (
    <section
      ref={heroRef}
      tabIndex={0}
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured Entertainment Spotlight"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      className={cn(
        "relative w-full h-[100vh] h-[100svh] min-h-[620px] max-h-[1100px] overflow-hidden bg-[var(--color-surface-deep)] flex items-end focus:outline-none select-none",
        className
      )}
    >
      {/* Background Backdrops with Coordinated Crossfade & Restrained Drift */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {mediaList.map((item, index) => {
          const isActive = index === activeIndex;
          const backdropUrl = getBackdropUrl(item.backdropPath, "original");

          return (
            <div
              key={`backdrop-${item.id}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-1000 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              {backdropUrl ? (
                <div
                  className={cn(
                    "relative w-full h-full transform transition-transform duration-8000 ease-out motion-reduce:transform-none",
                    isActive ? "scale-105" : "scale-100"
                  )}
                >
                  <Image
                    src={backdropUrl}
                    alt=""
                    role="presentation"
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-center lg:object-top"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-surface-elevated)] to-[var(--color-surface-deep)]" />
              )}
            </div>
          );
        })}

        {/* Next Slide Preloader (Invisible off-screen element to warm cache) */}
        {nextMedia?.backdropPath && (
          <div className="hidden" aria-hidden="true">
            <Image
              src={getBackdropUrl(nextMedia.backdropPath, "w1280") || ""}
              alt=""
              width={1}
              height={1}
              priority={false}
            />
          </div>
        )}

        {/* Cinematic Neutral Scrims and Overlays */}
        {/* Bottom vertical gradient blending smoothly into page canvas */}
        <div
          className="absolute inset-0 z-20 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/75 via-25% to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Left directional horizontal gradient for text legibility */}
        <div
          className="absolute inset-0 z-20 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/85 via-40% sm:via-50% to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Subtle top shade ensuring header visibility */}
        <div
          className="absolute inset-0 z-20 bg-gradient-to-b from-[var(--color-surface-deep)]/70 via-transparent to-transparent h-32 pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Foreground Hero Content Container */}
      <div className="relative z-30 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14 lg:pb-16 pt-24 sm:pt-28 flex flex-col justify-end">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          {/* Main Title, Metadata, Synopsis & Call-to-Actions (Left 8 Cols) */}
          <div className="lg:col-span-8 space-y-4 sm:space-y-5">
            {mediaList.map((item, index) => {
              const isActive = index === activeIndex;
              if (!isActive) return null;

              const releaseYear = item.releaseDate
                ? item.releaseDate.split("-")[0]
                : null;
              const rating =
                item.voteAverage > 0 ? item.voteAverage.toFixed(1) : null;
              const mediaTypeLabel =
                item.mediaType === "tv" ? "TV Series" : "Featured Movie";
              const genres = getGenreNames(item.genreIds, 3);

              const watchHref =
                item.mediaType === "movie"
                  ? `/watch?type=movie&id=${item.id}`
                  : `/watch?type=tv&id=${item.id}&season=1&episode=1`;
              const detailHref =
                item.mediaType === "movie"
                  ? `/movie/${item.id}`
                  : `/tv/${item.id}`;

              return (
                <div
                  key={`content-${item.id}`}
                  className="transition-all duration-500 ease-out animate-in fade-in slide-in-from-bottom-3"
                >
                  {/* Category Pill & Primary Metadata Line */}
                  <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-medium">
                    <span className="rounded bg-[var(--color-surface)]/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] backdrop-blur-xs">
                      {mediaTypeLabel}
                    </span>

                    {releaseYear && (
                      <span className="text-[var(--color-text-secondary)]">
                        {releaseYear}
                      </span>
                    )}

                    {genres.length > 0 && (
                      <>
                        <span
                          className="text-[var(--color-border-subtle)]"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <span className="text-[var(--color-text-secondary)]">
                          {genres.join(" • ")}
                        </span>
                      </>
                    )}

                    {rating && (
                      <>
                        <span
                          className="text-[var(--color-border-subtle)]"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <span className="text-[var(--color-text-primary)] font-semibold flex items-center gap-1">
                          <span className="text-[var(--color-white)]">★</span> {rating}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Primary Cinematic Heading */}
                  <h1 className="mt-3 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-[var(--color-text-primary)] leading-[1.05] line-clamp-2 max-w-3xl">
                    {item.title}
                  </h1>

                  {/* Overview Synopsis */}
                  {item.overview && (
                    <p className="mt-4 text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-2xl">
                      {item.overview}
                    </p>
                  )}

                  {/* Hero Actions */}
                  <div className="mt-6 sm:mt-8 flex flex-wrap items-center gap-3.5">
                    <Link href={watchHref} tabIndex={0}>
                      <Button
                        variant="primary"
                        size="lg"
                        className="flex items-center gap-2 font-semibold shadow-sm"
                      >
                        <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                        Watch Now
                      </Button>
                    </Link>

                    <Link href={detailHref} tabIndex={0}>
                      <Button
                        variant="secondary"
                        size="lg"
                        className="flex items-center gap-2 font-medium"
                      >
                        <Info className="h-4 w-4" aria-hidden="true" />
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* Thumbnail Preview Rail (Reference 1 inspired: "Trailers & More" / titles peek) */}
            <div className="pt-3 hidden sm:block">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
                  In Rotation:
                </span>
                <div className="flex items-center gap-2 overflow-x-auto">
                  {mediaList.slice(0, 4).map((item, idx) => {
                    const isSlideActive = idx === activeIndex;
                    const thumbUrl = getBackdropUrl(item.backdropPath, "w300");

                    return (
                      <button
                        key={`thumb-${item.id}`}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        aria-label={`Jump to slide ${idx + 1}: ${item.title}`}
                        className={cn(
                          "group relative h-11 w-20 rounded overflow-hidden border transition-all duration-200 cursor-pointer focus-ring flex-none",
                          isSlideActive
                            ? "border-[var(--color-white)] ring-1 ring-[var(--color-white)] opacity-100"
                            : "border-[var(--color-border-subtle)] opacity-50 hover:opacity-90 hover:border-[var(--color-border-hover)]"
                        )}
                      >
                        {thumbUrl ? (
                          <Image
                            src={thumbUrl}
                            alt=""
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-[var(--color-surface)]" />
                        )}
                        <div
                          className={cn(
                            "absolute inset-0 bg-black/25 flex items-center justify-center transition-opacity",
                            isSlideActive ? "opacity-0" : "opacity-40 group-hover:opacity-0"
                          )}
                        >
                          <Play className="h-3 w-3 text-white fill-white" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Navigation & Slide Indicators (Right 4 Cols) */}
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-3 justify-end">
            <div className="flex items-center gap-3">
              {/* Previous Slide Button */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous featured title"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-elevated)] backdrop-blur-xs transition-colors cursor-pointer focus-ring"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              {/* Pause / Resume Rotation Button */}
              <button
                type="button"
                onClick={() => setIsPaused((prev) => !prev)}
                aria-label={
                  isPaused
                    ? "Resume automatic slide rotation"
                    : "Pause automatic slide rotation"
                }
                title={isPaused ? "Resume rotation" : "Pause rotation"}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-md border transition-colors cursor-pointer focus-ring backdrop-blur-xs",
                  isPaused
                    ? "border-[var(--color-white)] bg-[var(--color-white)] text-[var(--color-surface-deep)]"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-elevated)]"
                )}
              >
                {isPaused ? (
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                ) : (
                  <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                )}
              </button>

              {/* Next Slide Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next featured title"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/80 text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-elevated)] backdrop-blur-xs transition-colors cursor-pointer focus-ring"
              >
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Slide Pagination Indicator Bars */}
            <div
              className="flex items-center gap-1.5"
              role="tablist"
              aria-label="Featured slides"
            >
              {mediaList.map((item, idx) => {
                const isCurrent = idx === activeIndex;

                return (
                  <button
                    key={`indicator-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isCurrent}
                    aria-label={`Slide ${idx + 1} of ${totalSlides}: ${item.title}`}
                    onClick={() => goToSlide(idx)}
                    className={cn(
                      "h-1 rounded-full transition-all duration-300 cursor-pointer focus-ring",
                      isCurrent
                        ? "w-8 bg-[var(--color-white)]"
                        : "w-2.5 bg-[var(--color-border-subtle)] hover:bg-[var(--color-text-muted)]"
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
