"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import type { PlaybackEmbedResult, PlaybackProviderDescriptor } from "@/lib/playback";
import type { NormalizedVideo } from "@/lib/tmdb/types";
import { saveWatchProgress } from "@/lib/storage/continue-watching";
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
  posterPath?: string | null;
  backdropPath?: string | null;
  episodeTitle?: string;
  availableProviders?: PlaybackProviderDescriptor[];
}

export function PlaybackContainer({
  playbackResult,
  trailer,
  title,
  mediaType,
  mediaId,
  season,
  episode,
  initialMode = "stream",
  posterPath = null,
  backdropPath = null,
  episodeTitle,
  availableProviders = [],
}: PlaybackContainerProps) {
  const [activeMode, setActiveMode] = useState<"stream" | "trailer">(initialMode);
  const [selectedProviderResult, setSelectedProviderResult] = useState<PlaybackEmbedResult | null>(null);
  const [prevPlaybackResult, setPrevPlaybackResult] = useState<PlaybackEmbedResult>(playbackResult);
  const [isResolvingProvider, setIsResolvingProvider] = useState<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Adjust state during render when incoming playbackResult prop changes (e.g. episode navigation)
  if (playbackResult !== prevPlaybackResult) {
    setPrevPlaybackResult(playbackResult);
    setSelectedProviderResult(null);
  }

  const currentResult = selectedProviderResult ?? playbackResult;

  const hasTrailer = Boolean(trailer);

  // Clean up any pending abort controllers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Provider switching handler with race condition prevention
  const handleSelectProvider = useCallback(
    async (newProviderId: string) => {
      if (isResolvingProvider || newProviderId === currentResult.providerId) {
        return;
      }

      // Cancel previous in-flight request to avoid stale overwrites
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      setIsResolvingProvider(true);

      try {
        const params = new URLSearchParams({
          type: mediaType,
          id: String(mediaId),
          provider: newProviderId,
        });
        if (mediaType === "tv") {
          if (typeof season === "number") params.set("season", String(season));
          if (typeof episode === "number") params.set("episode", String(episode));
        }

        const res = await fetch(`/api/playback/resolve?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        if (data && data.result) {
          setSelectedProviderResult(data.result);
          // Seamlessly update URL without a disruptive page reload
          if (typeof window !== "undefined") {
            const nextUrl = new URL(window.location.href);
            nextUrl.searchParams.set("provider", newProviderId);
            window.history.replaceState({}, "", nextUrl.toString());
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Intentionally aborted by another user action
        }
        setSelectedProviderResult({
          status: "api_error",
          providerId: newProviderId,
          providerName: newProviderId,
          reason:
            "Failed to resolve playback from the selected provider. Please try again or switch providers.",
          target: currentResult.target,
        });
      } finally {
        setIsResolvingProvider(false);
      }
    },
    [isResolvingProvider, currentResult, mediaType, mediaId, season, episode]
  );

  // Automatically record watch progress when stream is ready
  useEffect(() => {
    if (currentResult.status === "ready") {
      saveWatchProgress({
        mediaType,
        tmdbId: mediaId,
        title,
        posterPath,
        backdropPath,
        seasonNumber: season,
        episodeNumber: episode,
        episodeTitle,
      });
    }
  }, [
    currentResult.status,
    mediaType,
    mediaId,
    title,
    posterPath,
    backdropPath,
    season,
    episode,
    episodeTitle,
  ]);

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
                currentResult.status === "ready"
                  ? "bg-emerald-500 animate-pulse"
                  : "bg-neutral-500"
              }`}
              aria-hidden="true"
            />
            <span>Watch Stream</span>
            {currentResult.status === "ready" && (
              <span className="rounded px-1 text-[10px] bg-emerald-500/10 text-emerald-400">
                Online
              </span>
            )}
          </button>

          {/* Official Trailer Tab */}
          {hasTrailer && (
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
            </button>
          )}
        </div>

        {/* Status indicator note */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[var(--color-text-secondary)]">
          <span>Viewing:</span>
          <span className="font-medium text-[var(--color-text-primary)]">
            {activeMode === "stream" ? "Stream Player" : "Official Trailer"}
          </span>
        </div>
      </div>

      {/* Render Active Player */}
      {activeMode === "stream" ? (
        <EmbedPlayer
          result={currentResult}
          title={title}
          mediaType={mediaType}
          mediaId={mediaId}
          season={season}
          episode={episode}
          hasTrailer={hasTrailer}
          onSwitchToTrailer={() => setActiveMode("trailer")}
          availableProviders={availableProviders}
          onSelectProvider={handleSelectProvider}
          isResolvingProvider={isResolvingProvider}
        />
      ) : (
        <TrailerPlayer trailer={trailer} title={title} />
      )}
    </div>
  );
}
