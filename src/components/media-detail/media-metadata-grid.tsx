import * as React from "react";
import { formatCurrency, formatRuntime } from "@/lib/tmdb/normalizers";
import type {
  NormalizedMovieDetails,
  NormalizedTVDetails,
  NormalizedCredits,
} from "@/lib/tmdb/types";
import { SectionHeading } from "@/components/section-heading";

export interface MediaMetadataGridProps {
  media: NormalizedMovieDetails | NormalizedTVDetails;
  credits?: NormalizedCredits | null;
}

export function MediaMetadataGrid({ media, credits }: MediaMetadataGridProps) {
  const isMovie = media.mediaType === "movie";
  const movie = isMovie ? (media as NormalizedMovieDetails) : null;
  const tv = !isMovie ? (media as NormalizedTVDetails) : null;

  // Extract key crew members
  const directors = credits?.crew.filter((c) => c.role === "Director") || [];
  const writers =
    credits?.crew.filter(
      (c) =>
        c.role === "Screenplay" ||
        c.role === "Writer" ||
        c.department === "Writing"
    ) || [];

  // Deduplicate names
  const uniqueDirectors = Array.from(new Set(directors.map((d) => d.name)));
  const uniqueWriters = Array.from(new Set(writers.map((w) => w.name))).slice(0, 3);

  // Filter useful metadata items (avoiding empty or zero values)
  const items: { label: string; value: React.ReactNode }[] = [];

  if (media.status && media.status !== "Unknown") {
    items.push({ label: "Status", value: media.status });
  }

  if (media.releaseDate) {
    items.push({
      label: isMovie ? "Release Date" : "First Air Date",
      value: new Date(media.releaseDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
    });
  }

  if (movie?.runtime) {
    items.push({
      label: "Runtime",
      value: formatRuntime(movie.runtime),
    });
  }

  if (tv?.numberOfSeasons) {
    items.push({
      label: "Seasons",
      value: `${tv.numberOfSeasons} ${tv.numberOfSeasons === 1 ? "Season" : "Seasons"}`,
    });
  }

  if (tv?.numberOfEpisodes) {
    items.push({
      label: "Episodes",
      value: `${tv.numberOfEpisodes} Total`,
    });
  }

  if (media.originalLanguage) {
    items.push({
      label: "Original Language",
      value: media.originalLanguage.toUpperCase(),
    });
  }

  if (movie && movie.budget > 0) {
    items.push({
      label: "Budget",
      value: formatCurrency(movie.budget),
    });
  }

  if (movie && movie.revenue > 0) {
    items.push({
      label: "Revenue",
      value: formatCurrency(movie.revenue),
    });
  }

  if (uniqueDirectors.length > 0) {
    items.push({
      label: uniqueDirectors.length === 1 ? "Director" : "Directors",
      value: uniqueDirectors.join(", "),
    });
  }

  if (uniqueWriters.length > 0) {
    items.push({
      label: uniqueWriters.length === 1 ? "Writer" : "Writers",
      value: uniqueWriters.join(", "),
    });
  }

  if (media.productionCompanies && media.productionCompanies.length > 0) {
    const companies = media.productionCompanies
      .map((c) => c.name)
      .slice(0, 4)
      .join(", ");
    if (companies) {
      items.push({
        label: "Production",
        value: companies,
      });
    }
  }

  if (items.length === 0) return null;

  return (
    <section aria-labelledby="production-details-heading" className="w-full">
      <SectionHeading
        title="Details & Information"
        description="Key production specifications and creative credits"
        className="mb-6"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className="flex flex-col rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-3 sm:p-4"
          >
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
              {item.label}
            </span>
            <span className="mt-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-primary)]">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
