import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";


export interface MediaCardProps {
  id: string | number;
  title: string;
  posterUrl?: string | null;
  year?: number | string | null;
  mediaType?: "movie" | "tv" | "anime";
  rating?: string | number;
  quality?: string;
  href?: string;
  onClick?: () => void;
  className?: string;
}

export { mediaItemToCardProps } from "@/lib/tmdb/normalizers";

const mediaTypeLabels: Record<NonNullable<MediaCardProps["mediaType"]>, string> = {
  movie: "Movie",
  tv: "Series",
  anime: "Anime",
};

export function MediaCard({
  title,
  posterUrl,
  year,
  mediaType,
  rating,
  quality,
  href,
  onClick,
  className,
}: MediaCardProps) {
  const cardContent = (
    <article className="group relative flex flex-col text-left focus-ring rounded-md">
      {/* 2:3 Poster Frame */}
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] transition-colors duration-200 group-hover:border-[var(--color-border-hover)]">
        {posterUrl ? (
          <Image
            src={posterUrl}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-cover transition-transform duration-200 motion-reduce:transform-none group-hover:scale-[1.03]"
          />
        ) : (
          /* Filmic fallback container with subtle graphic treatment */
          <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
            <svg
              className="h-10 w-10 text-[var(--color-border-subtle)] group-hover:text-[var(--color-border-hover)] transition-colors duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 3v18" />
              <path d="M17 3v18" />
              <path d="M3 7h4" />
              <path d="M3 12h4" />
              <path d="M3 17h4" />
              <path d="M17 7h4" />
              <path d="M17 12h4" />
              <path d="M17 17h4" />
            </svg>
            <span className="mt-3 line-clamp-2 text-xs font-medium text-[var(--color-text-secondary)]">
              {title}
            </span>
          </div>
        )}

        {/* Quality or Rating Badge (Overlaid on top corner) */}
        {(quality || rating) && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5">
            {quality && (
              <span className="rounded bg-[var(--color-surface-deep)]/85 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] backdrop-blur-xs">
                {quality}
              </span>
            )}
            {rating && (
              <span className="rounded bg-[var(--color-surface-deep)]/85 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] backdrop-blur-xs">
                ★ {rating}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Title & Metadata below poster */}
      <div className="mt-2.5 flex flex-col">
        <h3
          title={title}
          className="truncate text-sm font-medium tracking-tight text-[var(--color-text-primary)] transition-colors duration-150 group-hover:text-[var(--color-white)]"
        >
          {title}
        </h3>
        <div className="mt-1 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
          {year && <span>{year}</span>}
          {year && mediaType && (
            <span className="text-[var(--color-border-subtle)]" aria-hidden="true">
              ·
            </span>
          )}
          {mediaType && <span>{mediaTypeLabels[mediaType]}</span>}
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn("block focus-ring rounded-md", className)}
        aria-label={`${title}${year ? ` (${year})` : ""}`}
      >
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={cn("block w-full text-left focus-ring rounded-md cursor-pointer", className)}
        aria-label={`${title}${year ? ` (${year})` : ""}`}
      >
        {cardContent}
      </button>
    );
  }

  return <div className={cn("block", className)}>{cardContent}</div>;
}
