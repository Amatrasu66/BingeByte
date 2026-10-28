"use client";

import * as React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  PlaybackEmbedResult,
  PlaybackProviderDescriptor,
  PlaybackResolutionCoordinator,
  recordPlaybackDiagnostic,
} from "@/lib/playback";
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
  const pathname = usePathname();
  const [activeMode, setActiveMode] = useState<"stream" | "trailer">(initialMode);
  const [selectedProviderResult, setSelectedProviderResult] = useState<PlaybackEmbedResult | null>(null);
  const [prevPlaybackResult, setPrevPlaybackResult] = useState<PlaybackEmbedResult>(playbackResult);
  const [isResolvingProvider, setIsResolvingProvider] = useState<boolean>(false);
  const coordinatorRef = useRef<PlaybackResolutionCoordinator>(new PlaybackResolutionCoordinator());

  // Adjust state during render when incoming playbackResult prop changes (e.g. episode navigation)
  if (playbackResult !== prevPlaybackResult) {
    setPrevPlaybackResult(playbackResult);
    setSelectedProviderResult(null);
    setIsResolvingProvider(false);
  }

  const currentResult = selectedProviderResult ?? playbackResult;
  const hasTrailer = Boolean(trailer);

  // Invalidate any pending resolution requests when leaving the watch route, changing results, or unmounting
  useEffect(() => {
    const coordinator = coordinatorRef.current;
    if (pathname !== "/watch") {
      coordinator.abort();
    }
    return () => {
      coordinator.abort();
    };
  }, [pathname, playbackResult]);

  // Provider switching handler with race condition prevention
  const handleSelectProvider = useCallback(
    async (newProviderId: string) => {
      if (isResolvingProvider || newProviderId === currentResult.providerId) {
        return;
      }

      // Record provider switch diagnostic
      recordPlaybackDiagnostic({
        type: "provider_switch_requested",
        providerId: newProviderId,
        mediaType,
        tmdbId: mediaId,
        season,
        episode,
        timestamp: Date.now(),
      });

      // Start new request through coordinator, cancelling previous in-flight attempts
      const { signal, requestId } = coordinatorRef.current.startRequest();
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
          signal,
        });

        if (!res.ok) {
          throw new Error(`Server returned HTTP ${res.status}`);
        }

        const data = await res.json();
        // Discard response if a newer request was dispatched or if navigated away
        if (!coordinatorRef.current.isLatest(requestId)) {
          return;
        }

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
          return; // Intentionally aborted by another user action or navigation
        }
        if (!coordinatorRef.current.isLatest(requestId)) {
          return;
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
        if (coordinatorRef.current.isLatest(requestId) || !coordinatorRef.current.hasActiveRequest()) {
          setIsResolvingProvider(false);
        }
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
