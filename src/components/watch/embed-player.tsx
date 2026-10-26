"use client";

import * as React from "react";
import { useState, useCallback } from "react";
import Link from "next/link";
import type { PlaybackEmbedResult } from "@/lib/playback";

export interface EmbedPlayerProps {
  result: PlaybackEmbedResult;
  title: string;
  mediaType: "movie" | "tv";
  mediaId: number;
  season?: number;
  episode?: number;
  hasTrailer?: boolean;
  onSwitchToTrailer?: () => void;
}

export function EmbedPlayer({
  result,
  title,
  mediaType,
  mediaId,
  season,
  episode,
  hasTrailer = false,
  onSwitchToTrailer,
}: EmbedPlayerProps) {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount((prev) => prev + 1);
  }, []);

  const detailsUrl = mediaType === "movie" ? `/movie/${mediaId}` : `/tv/${mediaId}`;

  // 1. Ready State: Stream is retrieved from provider and ready to play
  if (result.status === "ready") {
    return (
      <section aria-labelledby="stream-player-heading" className="w-full">
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
            <h2
              id="stream-player-heading"
              className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]"
            >
              {title}
              {mediaType === "tv" && typeof season === "number" && typeof episode === "number" && (
                <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">
                  (S{season}:E{episode})
                </span>
              )}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {hasTrailer && onSwitchToTrailer && (
              <button
                type="button"
                onClick={onSwitchToTrailer}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded py-1 px-2"
                aria-label="Switch to official YouTube trailer preview"
              >
                <svg
                  className="h-3.5 w-3.5 text-red-500"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Trailer Preview</span>
              </button>
            )}

            <Link
              href={detailsUrl}
              className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded py-1 px-1.5"
            >
              Back to Details
            </Link>
          </div>
        </div>

        {/* 16:9 Responsive Player Container */}
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] shadow-xl">
          {/* Loading Overlay */}
          {isLoading && !hasError && (
            <div
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[var(--color-surface-deep)]/90 backdrop-blur-xs"
              aria-live="polite"
            >
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border-subtle)] border-t-[var(--color-text-primary)]" />
              <p className="mt-3 text-xs text-[var(--color-text-secondary)]">
                Loading stream player...
              </p>
            </div>
          )}

          {/* Error Overlay */}
          {hasError ? (
            <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20 text-red-400">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-semibold text-[var(--color-text-primary)]">
                Unable to Load Stream Player
              </h3>
              <p className="mt-1 max-w-sm text-xs text-[var(--color-text-secondary)]">
                The stream embed could not be loaded or timed out. Please try reloading the player.
              </p>

              <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={handleRetry}
                  className="rounded bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80 border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  Retry Player
                </button>

                {hasTrailer && onSwitchToTrailer && (
                  <button
                    type="button"
                    onClick={onSwitchToTrailer}
                    className="rounded bg-red-600/80 hover:bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors focus-ring"
                  >
                    Watch Trailer Instead
                  </button>
                )}

                <Link
                  href={detailsUrl}
                  className="rounded border border-[var(--color-border-subtle)] px-3 py-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
                >
                  Return to Details
                </Link>
              </div>
            </div>
          ) : (
            <iframe
              key={`player-${result.target.tmdbId}-${retryCount}`}
              src={result.url}
              title={`${title} - Video Player`}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
              loading="lazy"
              referrerPolicy="origin"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
              className="absolute inset-0 h-full w-full border-0"
            />
          )}
        </div>
      </section>
    );
  }

  // 2. Error & Unavailable States (Unavailable, Auth Error, API Error, Unconfigured, Invalid Input)
  const isAuthError = result.status === "auth_error";
  const isApiError = result.status === "api_error";
  const isUnconfigured = result.status === "unconfigured";

  const errorTitle = isAuthError
    ? "Streaming Authentication Error"
    : isApiError
    ? "Streaming Service Unavailable"
    : isUnconfigured
    ? "Streaming Provider Not Configured"
    : result.status === "invalid_input"
    ? "Invalid Playback Parameters"
    : "Stream Unavailable";

  return (
    <section aria-labelledby="stream-player-error-heading" className="w-full">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              isAuthError ? "bg-amber-500" : isApiError ? "bg-red-500" : "bg-neutral-500"
            }`}
            aria-hidden="true"
          />
          <h2
            id="stream-player-error-heading"
            className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]"
          >
            {title}
          </h2>
          <span className="rounded px-1.5 py-0.5 text-[10px] font-medium bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
            {isAuthError ? "Auth Error" : isApiError ? "Service Error" : "Unavailable"}
          </span>
        </div>

        <Link
          href={detailsUrl}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded py-1 px-1.5"
        >
          Back to Details
        </Link>
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] shadow-xl flex flex-col items-center justify-center p-6 sm:p-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
          {isAuthError ? (
            <svg
              className="h-7 w-7 text-amber-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeWidth={2} />
              <path d="M7 11V7a5 5 0 0110 0v4" strokeWidth={2} />
            </svg>
          ) : (
            <svg
              className="h-7 w-7 text-[var(--color-text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth={2} />
            </svg>
          )}
        </div>

        <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
          {errorTitle}
        </h3>

        <p className="mt-2 max-w-md text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
          {result.reason || "The requested playback stream is currently unavailable."}
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {hasTrailer && onSwitchToTrailer && (
            <button
              type="button"
              onClick={onSwitchToTrailer}
              className="inline-flex items-center gap-2 rounded-md bg-red-600 hover:bg-red-700 px-4 py-2 text-xs font-semibold text-white transition-colors focus-ring"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              <span>Watch Official Trailer</span>
            </button>
          )}

          <Link
            href={detailsUrl}
            className="inline-flex items-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:bg-[var(--color-surface)]/80 px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] transition-colors focus-ring"
          >
            Return to Title Details
          </Link>
        </div>
      </div>
    </section>
  );
}
