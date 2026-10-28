"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { MediaCard } from "@/components/media/media-card";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { NormalizedMedia } from "@/lib/tmdb/types";
import { cn } from "@/lib/utils";

export interface MediaCarouselRailProps {
  id: string;
  title: string;
  description?: string;
  items?: NormalizedMedia[] | null;
  error?: string | null;
  limit?: number;
  mediaTypeOverride?: "movie" | "tv" | "anime";
  className?: string;
}

export function MediaCarouselRail({
  id,
  title,
  description,
  items,
  error,
  limit = 20,
  mediaTypeOverride,
  className,
}: MediaCarouselRailProps) {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  const displayItems = React.useMemo(() => {
    return items ? items.slice(0, limit) : [];
  }, [items, limit]);

  // Check scroll boundary state
  const checkScrollability = React.useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Tolerance threshold of 4px
    const isAtStart = el.scrollLeft <= 4;
    const isAtEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;

    setCanScrollLeft(!isAtStart);
    setCanScrollRight(!isAtEnd);
  }, []);

  React.useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    checkScrollability();

    // Use passive listener per Vercel best practices
    el.addEventListener("scroll", checkScrollability, { passive: true });
    window.addEventListener("resize", checkScrollability, { passive: true });

    return () => {
      el.removeEventListener("scroll", checkScrollability);
      window.removeEventListener("resize", checkScrollability);
    };
  }, [displayItems, checkScrollability]);

  // Smooth scroll handler
  const scroll = (direction: "left" | "right") => {
    const el = scrollContainerRef.current;
    if (!el) return;

    // Scroll by approximately 75% of visible container width
    const scrollAmount = Math.max(el.clientWidth * 0.75, 280);
    const targetScroll =
      direction === "left"
        ? el.scrollLeft - scrollAmount
        : el.scrollLeft + scrollAmount;

    el.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <section
      id={id}
      aria-labelledby={`rail-heading-${id}`}
      className={cn("scroll-mt-24 space-y-4 group/rail", className)}
    >
      {/* Rail Header with Title, Description, and Navigation Arrows */}
      <div className="flex items-end justify-between gap-4 pb-2 border-b border-[var(--color-border-subtle)]">
        <div>
          <h2
            id={`rail-heading-${id}`}
            className="text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]"
          >
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {/* Desktop Carousel Navigation Controls */}
        {displayItems.length > 0 && (
          <div className="hidden sm:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label={`Scroll ${title} left`}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-all duration-150 focus-ring",
                canScrollLeft
                  ? "hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-elevated)] cursor-pointer"
                  : "opacity-30 cursor-not-allowed border-transparent bg-transparent"
              )}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label={`Scroll ${title} right`}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-text-primary)] transition-all duration-150 focus-ring",
                canScrollRight
                  ? "hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface-elevated)] cursor-pointer"
                  : "opacity-30 cursor-not-allowed border-transparent bg-transparent"
              )}
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Rail Content or States */}
      {error ? (
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
          <p>Unable to load {title.toLowerCase()} at this time.</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Service response: {error}
          </p>
        </div>
      ) : displayItems.length > 0 ? (
        <div className="relative -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
          <div
            ref={scrollContainerRef}
            tabIndex={0}
            role="region"
            aria-label={`${title} collection rail`}
            className="flex gap-3.5 sm:gap-4.5 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory scroll-smooth focus:outline-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {displayItems.map((item) => {
              const releaseYear = item.releaseDate
                ? item.releaseDate.split("-")[0]
                : null;
              const posterUrl = getPosterUrl(item.posterPath, "w500");
              const rating =
                item.voteAverage > 0 ? item.voteAverage.toFixed(1) : undefined;
              const cardMediaType = mediaTypeOverride || item.mediaType;
              const cardHref =
                cardMediaType === "anime"
                  ? `/anime/${item.id}`
                  : `/${cardMediaType}/${item.id}`;

              return (
                <div
                  key={`${item.mediaType}-${item.id}`}
                  className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] flex-none snap-start"
                >
                  <MediaCard
                    id={item.id}
                    title={item.title}
                    posterUrl={posterUrl}
                    year={releaseYear}
                    mediaType={cardMediaType}
                    rating={rating}
                    href={cardHref}
                    sizes="(max-width: 640px) 140px, (max-width: 1024px) 190px, 210px"
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
          No titles currently available in this section.
        </div>
      )}
    </section>
  );
}
