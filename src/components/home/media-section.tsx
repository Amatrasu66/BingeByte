import * as React from "react";
import { SectionHeading } from "@/components/section-heading";
import { MediaCard } from "@/components/media/media-card";
import { getPosterUrl } from "@/lib/tmdb/images";
import type { NormalizedMedia } from "@/lib/tmdb/types";

export interface MediaSectionProps {
  id: string;
  title: string;
  description?: string;
  items?: NormalizedMedia[] | null;
  error?: string | null;
  limit?: number;
  mediaTypeOverride?: "movie" | "tv" | "anime";
}

export function MediaSection({
  id,
  title,
  description,
  items,
  error,
  limit = 10,
  mediaTypeOverride,
}: MediaSectionProps) {
  const displayItems = items ? items.slice(0, limit) : [];

  return (
    <section id={id} aria-labelledby={`section-heading-${id}`} className="scroll-mt-24 space-y-6">
      <SectionHeading
        title={title}
        description={description}
      />

      {error ? (
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 text-center text-sm text-[var(--color-text-secondary)]">
          <p>Unable to load {title.toLowerCase()} at this time.</p>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            Service response: {error}
          </p>
        </div>
      ) : displayItems.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
          {displayItems.map((item) => {
            const releaseYear = item.releaseDate ? item.releaseDate.split("-")[0] : null;
            const posterUrl = getPosterUrl(item.posterPath, "w500");
            const rating = item.voteAverage > 0 ? item.voteAverage.toFixed(1) : undefined;
            const cardMediaType = mediaTypeOverride || item.mediaType;
            const cardHref =
              cardMediaType === "anime"
                ? `/anime/${item.id}`
                : `/${cardMediaType}/${item.id}`;

            return (
              <MediaCard
                key={`${item.mediaType}-${item.id}`}
                id={item.id}
                title={item.title}
                posterUrl={posterUrl}
                year={releaseYear}
                mediaType={cardMediaType}
                rating={rating}
                href={cardHref}
              />
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
          No titles currently available in this section.
        </div>
      )}
    </section>
  );
}
