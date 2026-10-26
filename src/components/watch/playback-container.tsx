"use client";

import * as React from "react";
import { useState } from "react";
import type { PlaybackEmbedResult } from "@/lib/playback";
import type { NormalizedVideo } from "@/lib/tmdb/types";
import { EmbedPlayer } from "./embed-player";
import { TrailerPlayer } from "./trailer-player";

export interface PlaybackContainerProps {
  playbackResult: PlaybackEmbedResult;
  trailer: NormalizedVideo | null;
  title: string;
  mediaType: "movie" | "tv";
  mediaId: number;
  season?: number;
  episode?: number;
  initialMode?: "stream" | "trailer";
}

export function PlaybackContainer({
  playbackResult,
  trailer,
  title,
  mediaType,
  mediaId,
  season,
  episode,
  initialMode,
}: PlaybackContainerProps) {
  // If provider is ready, default to stream. Otherwise retain official trailer view by default.
  const defaultMode: "stream" | "trailer" =
    initialMode ?? (playbackResult.status === "ready" ? "stream" : "trailer");

  const [activeMode, setActiveMode] = useState<"stream" | "trailer">(defaultMode);

  const hasTrailer = Boolean(trailer);

  return (
    <div className="w-full space-y-4">
      {/* Player Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Stream Player Tab */}
          <button
            type="button"
            onClick={() => setActiveMode("stream")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-ring ${
              activeMode === "stream"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/50"
            }`}
            aria-selected={activeMode === "stream"}
            role="tab"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                playbackResult.status === "ready"
                  ? "bg-emerald-500 animate-pulse"
                  : playbackResult.status === "unverified"
                  ? "bg-amber-500"
                  : "bg-neutral-500"
              }`}
              aria-hidden="true"
            />
            <span>Stream Player</span>
            <span className="rounded px-1 text-[10px] bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
              {playbackResult.status === "ready"
                ? playbackResult.providerName
                : playbackResult.status === "unverified"
                ? "Gated"
                : "Disabled"}
            </span>
          </button>

          {/* Official Trailer Tab */}
          <button
            type="button"
            onClick={() => setActiveMode("trailer")}
            className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-all focus-ring ${
              activeMode === "trailer"
                ? "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] shadow-xs"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/50"
            }`}
            aria-selected={activeMode === "trailer"}
            role="tab"
          >
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            <span>Official Trailer</span>
            {hasTrailer && (
              <span className="hidden sm:inline-block rounded px-1 text-[10px] bg-red-500/10 text-red-400">
                YouTube
              </span>
            )}
          </button>
        </div>

        {/* Status indicator note */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
          <span>Mode:</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {activeMode === "stream" ? "Playback Stream" : "Official Trailer"}
          </span>
        </div>
      </div>

      {/* Render Active Player */}
      {activeMode === "stream" ? (
        <EmbedPlayer
          result={playbackResult}
          title={title}
          mediaType={mediaType}
          mediaId={mediaId}
          season={season}
          episode={episode}
          hasTrailer={hasTrailer}
          onSwitchToTrailer={() => setActiveMode("trailer")}
        />
      ) : (
        <TrailerPlayer trailer={trailer} title={title} />
      )}
    </div>
  );
}
