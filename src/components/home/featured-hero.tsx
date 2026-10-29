"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, ChevronLeft, ChevronRight, Pause } from "lucide-react";
import { getBackdropUrl } from "@/lib/tmdb/images";
import { getGenreNames } from "@/lib/tmdb/genres";
import { FALLBACK_FEATURED_TITLES } from "@/lib/tmdb/featured";
import type { NormalizedMedia } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

function subscribeReducedMotion(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getReducedMotionSnapshot() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

export interface FeaturedHeroProps {
  /** Array of up to 10 normalized media items to feature in rotation */
  items?: NormalizedMedia[] | null;
  /** Single item fallback for backwards compatibility */
  media?: NormalizedMedia | null;
  /** Automatic rotation duration in milliseconds (default: 3000ms / 3 seconds) */
  intervalMs?: number;
  className?: string;
}

export function FeaturedHero({
  items,
  media,
  intervalMs = 3000,
  className,
}: FeaturedHeroProps) {
  // Resolve featured items list (up to 10 items)
  const mediaList = React.useMemo(() => {
    if (items && items.length > 0) return items.slice(0, 10);
    if (media) return [media];
    return FALLBACK_FEATURED_TITLES.slice(0, 10);
  }, [items, media]);

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const heroRef = React.useRef<HTMLElement>(null);

  // Subscribe to user preference for reduced motion using React standard useSyncExternalStore
  const prefersReducedMotion = React.useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot
  );

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

  // Automatic rotation timer - 3 seconds interval
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

  // 3 Preview thumbnail items for "Trailers & More" (inspired by Reference 1 / John Wick 4)
  const previewItems = React.useMemo(() => {
    const previews: { item: NormalizedMedia; index: number }[] = [];
    for (let i = 1; i <= 3; i++) {
      const idx = (activeIndex + i) % totalSlides;
      previews.push({ item: mediaList[idx], index: idx });
    }
    return previews;
  }, [activeIndex, totalSlides, mediaList]);

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
        "relative w-full h-[100vh] h-[100svh] min-h-[620px] max-h-[1050px] overflow-hidden bg-[var(--color-background)] flex items-end focus:outline-none select-none",
        className
      )}
    >
      {/* Background Backdrops with Fast & Smooth Crossfade */}
      <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        {mediaList.map((item, index) => {
          const isActive = index === activeIndex;
          const backdropUrl = getBackdropUrl(item.backdropPath, "original");

          return (
            <div
              key={`backdrop-${item.id}`}
              className={cn(
                "absolute inset-0 transition-opacity duration-700 ease-in-out",
                isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
              )}
            >
              {backdropUrl ? (
                <div
                  className={cn(
                    "relative w-full h-full transform transition-transform duration-3000 ease-linear motion-reduce:transform-none",
                    isActive ? "scale-[1.02]" : "scale-100"
                  )}
                >
                  <Image
                    src={backdropUrl}
                    alt=""
                    role="presentation"
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover object-[70%_center] lg:object-[65%_center]"
                  />
                </div>
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-background)]" />
              )}
            </div>
          );
        })}

        {/* Next Slide Preloader */}
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

        {/* Subtle left-side only black hue at ~20% behind text; 0% hue everywhere else */}
        <div
          className="absolute inset-0 z-20 bg-gradient-to-r from-black/20 via-black/10 via-30% to-transparent pointer-events-none"
          aria-hidden="true"
        />
      </div>

      {/* Foreground Hero Content Container */}
      <div className="relative z-30 w-full mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12 lg:pb-14 pt-20 flex flex-col justify-end">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
          {/* Main Title, Metadata, Synopsis & Call-to-Actions (Left 8 Cols) */}
          <div className="lg:col-span-8 space-y-3.5">
            {mediaList.map((item, index) => {
              const isActive = index === activeIndex;
              if (!isActive) return null;

              const releaseYear = item.releaseDate
                ? item.releaseDate.split("-")[0]
                : null;
              const rating =
                item.voteAverage > 0 ? item.voteAverage.toFixed(1) : null;
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
                  className="transition-all duration-400 ease-out animate-in fade-in slide-in-from-bottom-2"
                >
                  {/* Category Pill & Primary Metadata Line */}
                  <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                    <span className="rounded bg-black/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white border border-white/20 backdrop-blur-xs shadow-sm">
                      PREMIUM
                    </span>

                    {releaseYear && (
                      <span className="text-neutral-200 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {releaseYear}
                      </span>
                    )}

                    {genres.length > 0 && (
                      <>
                        <span
                          className="text-neutral-400"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <span className="text-neutral-200 font-normal drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          {genres.join(" • ")}
                        </span>
                      </>
                    )}

                    {rating && (
                      <>
                        <span
                          className="text-neutral-400"
                          aria-hidden="true"
                        >
                          •
                        </span>
                        <span className="text-white font-semibold flex items-center gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                          <span>★</span> {rating}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Refined, compact heading that never obscures the poster subject */}
                  <h1 className="mt-2 text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight line-clamp-2 max-w-lg drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">
                    {item.title}
                  </h1>

                  {/* Overview Synopsis - compact and legible */}
                  {item.overview && (
                    <p className="mt-2 text-xs sm:text-[13px] text-neutral-200 leading-relaxed line-clamp-2 max-w-md drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                      {item.overview}
                    </p>
                  )}

                  {/* Hero Actions (Inspired by Reference 1: Watch Now + Details) */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <Link href={watchHref} tabIndex={0}>
                      <button
                        type="button"
                        className="inline-flex h-8 sm:h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-semibold text-black hover:bg-neutral-200 transition-colors cursor-pointer focus-ring shadow-lg"
                      >
                        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                        Watch Now
                      </button>
                    </Link>

                    <Link href={detailHref} tabIndex={0}>
                      <button
                        type="button"
                        className="inline-flex h-8 sm:h-9 items-center justify-center gap-2 rounded-full border border-white/20 bg-black/50 backdrop-blur-xs px-3.5 text-xs font-medium text-white hover:bg-black/80 hover:border-white/40 transition-colors cursor-pointer focus-ring shadow-md"
                      >
                        <Info className="h-3 w-3 text-neutral-300" aria-hidden="true" />
                        View Details
                      </button>
                    </Link>
                  </div>
                </div>
              );
            })}

            {/* "Trailers & More" Preview Cards (Reference 1 inspired) */}
            <div className="pt-1.5 hidden sm:block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] block mb-1.5">
                Trailers & More
              </span>
              <div className="flex items-center gap-2.5">
                {previewItems.map(({ item, index }) => {
                  const thumbUrl = getBackdropUrl(item.backdropPath, "w300");

                  return (
                    <button
                      key={`preview-${item.id}`}
                      type="button"
                      onClick={() => goToSlide(index)}
                      aria-label={`Switch to ${item.title}`}
                      className="group relative h-12 w-20 sm:h-14 sm:w-24 rounded overflow-hidden border border-white/20 hover:border-white/60 bg-black/40 transition-all duration-200 cursor-pointer focus-ring flex-none shadow-md"
                    >
                      {thumbUrl ? (
                        <Image
                          src={thumbUrl}
                          alt=""
                          fill
                          sizes="96px"
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full bg-[var(--color-surface)]" />
                      )}
                      <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent flex items-center justify-center transition-colors">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/25 backdrop-blur-xs text-white group-hover:scale-110 transition-transform">
                          <Play className="h-2 w-2 fill-white ml-0.5" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Carousel Navigation & Slide Indicators (Right 4 Cols) */}
          <div className="lg:col-span-4 flex flex-col items-start lg:items-end gap-2.5 justify-end">
            <div className="flex items-center gap-2">
              {/* Previous Slide Button */}
              <button
                type="button"
                onClick={prevSlide}
                aria-label="Previous featured title"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/40 text-white hover:bg-black/70 hover:border-white/40 transition-colors cursor-pointer focus-ring shadow-md"
              >
                <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
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
                title={isPaused ? "Resume rotation (3s)" : "Pause rotation"}
                className={cn(
                  "inline-flex h-8 w-8 items-center justify-center rounded-md border transition-colors cursor-pointer focus-ring shadow-md",
                  isPaused
                    ? "border-white bg-white text-black"
                    : "border-white/20 bg-black/40 text-white hover:bg-black/70 hover:border-white/40"
                )}
              >
                {isPaused ? (
                  <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                ) : (
                  <Pause className="h-3 w-3 fill-current" aria-hidden="true" />
                )}
              </button>

              {/* Next Slide Button */}
              <button
                type="button"
                onClick={nextSlide}
                aria-label="Next featured title"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-white/20 bg-black/40 text-white hover:bg-black/70 hover:border-white/40 transition-colors cursor-pointer focus-ring shadow-md"
              >
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {/* Slide Indicators: Displays all 10 slides */}
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
                        ? "w-6 bg-white"
                        : "w-2 bg-white/30 hover:bg-white/60"
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
