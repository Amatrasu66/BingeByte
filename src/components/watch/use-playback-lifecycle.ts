"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPlaybackSession, PlaybackSession } from "@/lib/playback/lifecycle";

export interface UsePlaybackLifecycleOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  streamUrl?: string | null;
  title: string;
  allow?: string;
  referrerPolicy?: ReferrerPolicy;
  className?: string;
  onLoad?: () => void;
  onError?: () => void;
  enabled?: boolean;
}

/**
 * React hook that coordinates the physical lifecycle of an iframe video player.
 * Guarantees that:
 * 1. Audio and video playback stop promptly when navigating away from /watch.
 * 2. Inactive React 19 Activity boundaries cannot retain executing background audio.
 * 3. Event listeners (pagehide, beforeunload) and DOM nodes are cleanly disposed.
 * 4. Returning to the watch page or changing streams creates a fresh, working session.
 */
export function usePlaybackLifecycle({
  containerRef,
  streamUrl,
  title,
  allow,
  referrerPolicy,
  className,
  onLoad,
  onError,
  enabled = true,
}: UsePlaybackLifecycleOptions) {
  const pathname = usePathname();
  const sessionRef = useRef<PlaybackSession | null>(null);

  // Determine whether the user is actively on the watch route
  const isWatchRoute = pathname === "/watch";
  const shouldPlay = enabled && isWatchRoute && Boolean(streamUrl);

  useEffect(() => {
    // If not on the watch route or playback is disabled, ensure any prior session is disposed
    if (!shouldPlay || !streamUrl || !containerRef.current) {
      if (sessionRef.current) {
        sessionRef.current.dispose();
        sessionRef.current = null;
      }
      return;
    }

    // Dispose any lingering prior session before mounting a new one
    if (sessionRef.current) {
      sessionRef.current.dispose();
      sessionRef.current = null;
    }

    const container = containerRef.current;

    // Create fresh playback session
    const session = createPlaybackSession({
      container,
      streamUrl,
      title,
      allow,
      referrerPolicy,
      className,
      onLoad,
      onError,
    });
    sessionRef.current = session;

    // Window-level safety handlers to guarantee media termination on pagehide or tab close
    const handleUnload = () => {
      if (sessionRef.current) {
        sessionRef.current.dispose();
        sessionRef.current = null;
      }
    };

    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);

      // Dispose session on unmount or when React 19 hides the Activity container
      if (sessionRef.current) {
        sessionRef.current.dispose();
        sessionRef.current = null;
      }
    };
  }, [
    shouldPlay,
    streamUrl,
    title,
    allow,
    referrerPolicy,
    className,
    containerRef,
    onLoad,
    onError,
  ]);
}
