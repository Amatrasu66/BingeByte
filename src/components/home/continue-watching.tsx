"use client";

import * as React from "react";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  getContinueWatching,
  removeContinueWatchingItem,
  clearContinueWatching,
  STORAGE_CHANGE_EVENT,
  type ContinueWatchingItem,
} from "@/lib/storage/continue-watching";
import { getBackdropUrl, getPosterUrl } from "@/lib/tmdb/images";

const emptyList: ContinueWatchingItem[] = [];

function subscribe(callback: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(STORAGE_CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(STORAGE_CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getClientSnapshot(): ContinueWatchingItem[] {
  return getContinueWatching();
}

function getServerSnapshot(): ContinueWatchingItem[] {
  return emptyList;
}

export function ContinueWatching() {
  const items = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);

  const handleRemove = (e: React.MouseEvent, item: ContinueWatchingItem) => {
    e.preventDefault();
    e.stopPropagation();
    removeContinueWatchingItem(item.mediaType, item.tmdbId);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    clearContinueWatching();
  };

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="continue-watching-heading" className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-[var(--color-text-primary)] animate-pulse" />
          <h2
            id="continue-watching-heading"
            className="text-lg sm:text-xl font-bold tracking-tight text-[var(--color-text-primary)]"
          >
            Continue Watching
          </h2>
          <span className="rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
            {items.length}
          </span>
        </div>

        <button
          type="button"
          onClick={handleClearAll}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer focus-ring rounded px-2 py-1"
          aria-label="Clear all continue watching history"
        >
          Clear History
        </button>
      </div>

      {/* Horizontal scrolling row */}
      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-thin scrollbar-thumb-neutral-800 focus-ring">
        {items.map((item) => {
          const watchHref =
            item.mediaType === "movie"
              ? `/watch?type=movie&id=${item.tmdbId}`
              : `/watch?type=tv&id=${item.tmdbId}&season=${item.seasonNumber ?? 1}&episode=${item.episodeNumber ?? 1}`;

          const imageUrl =
            getBackdropUrl(item.backdropPath, "w780") ||
            getPosterUrl(item.posterPath, "w500");

          const subtitle =
            item.mediaType === "tv"
              ? `S${item.seasonNumber ?? 1}:E${item.episodeNumber ?? 1}${
                  item.episodeTitle ? ` • ${item.episodeTitle}` : ""
                }`
              : "Movie";

          return (
            <div
              key={`${item.mediaType}-${item.tmdbId}`}
              className="group relative flex-none w-[240px] sm:w-[280px] rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] overflow-hidden transition-all duration-200 hover:border-neutral-500 hover:shadow-lg"
            >
              <Link
                href={watchHref}
                className="block outline-hidden focus-visible:ring-2 focus-visible:ring-[var(--color-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]"
                aria-label={`Resume watching ${item.title}`}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video w-full bg-[var(--color-surface-deep)] overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 240px, 280px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                      {item.title}
                    </div>
                  )}

                  {/* Dark gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Play overlay button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black shadow-lg">
                      <svg
                        className="h-5 w-5 fill-current ml-0.5"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </div>
                  </div>

                  {/* Media Type Badge */}
                  <div className="absolute top-2 left-2">
                    <span className="rounded bg-black/75 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-neutral-300 border border-white/10">
                      {item.mediaType === "movie" ? "Movie" : "TV Series"}
                    </span>
                  </div>

                  {/* Subtle Progress Bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                    <div className="h-full bg-white w-2/3" />
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-3">
                  <h3 className="truncate text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-white">
                    {item.title}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-[var(--color-text-secondary)]">
                    {subtitle}
                  </p>
                </div>
              </Link>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => handleRemove(e, item)}
                className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-neutral-400 hover:text-white hover:bg-black border border-white/20 transition-colors focus-ring"
                aria-label={`Remove ${item.title} from continue watching`}
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
