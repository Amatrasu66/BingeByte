"use client";

import * as React from "react";
import { isValidYouTubeKey } from "@/lib/tmdb/normalizers";
import type { NormalizedVideo } from "@/lib/tmdb/types";

export interface TrailerPlayerProps {
  trailer: NormalizedVideo | null;
  title: string;
}

export function TrailerPlayer({ trailer, title }: TrailerPlayerProps) {
  const isKeyValid = trailer && isValidYouTubeKey(trailer.key);

  return (
    <section aria-labelledby="trailer-player-heading" className="w-full">
      <div className="flex items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          <h2
            id="trailer-player-heading"
            className="text-base sm:text-lg font-semibold text-[var(--color-text-primary)]"
          >
            {trailer?.name || "Official Trailer Preview"}
          </h2>
        </div>

        {isKeyValid && (
          <a
            href={`https://www.youtube.com/watch?v=${trailer.key}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded py-1 px-1.5"
            aria-label={`Open ${trailer.name || "trailer"} on YouTube in a new tab`}
          >
            <span>Watch on YouTube</span>
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
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        )}
      </div>

      {/* Video Container or Empty State */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-deep)] shadow-xl">
        {isKeyValid ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=0&rel=0`}
            title={`${title} - ${trailer.name || "Official Trailer"}`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center p-6 sm:p-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
                <line x1="2" y1="2" x2="22" y2="22" strokeWidth={2} />
              </svg>
            </div>
            <h3 className="mt-4 text-base font-semibold text-[var(--color-text-primary)]">
              No Official Trailer Available
            </h3>
            <p className="mt-1.5 max-w-md text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              TMDB does not currently list an official playable trailer for this title. Explore licensed streaming, rental, and purchase platforms below.
            </p>
          </div>
        )}
      </div>

      {/* Clear Transparency & Educational Notice */}
      <div className="mt-3 flex items-start gap-2 rounded-md bg-[var(--color-surface)]/60 border border-[var(--color-border-subtle)] px-3 py-2 text-[11px] text-[var(--color-text-secondary)]">
        <svg
          className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="16" x2="12" y2="12" />
          <line x1="12" y1="8" x2="12.01" y2="8" />
        </svg>
        <span>
          <strong>Streaming Notice:</strong> BingeByte is a cinematic discovery catalog and does not host or pirate video files. Playback above is provided via official YouTube embeds. To watch full-length films or episodes, consult the verified streaming services below.
        </span>
      </div>
    </section>
  );
}
