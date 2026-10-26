"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import type { NormalizedVideo } from "@/lib/tmdb/types";

export interface TrailerModalProps {
  trailer: NormalizedVideo | null;
  isOpen: boolean;
  onClose: () => void;
}

export function TrailerModal({ trailer, isOpen, onClose }: TrailerModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Save previous overflow style and disable scroll
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Auto-focus close button
    closeButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !trailer) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trailer-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 animate-fade-in"
    >
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 bg-black/85 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-4xl overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
            <h3
              id="trailer-modal-title"
              className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-md"
            >
              {trailer.name || "Official Trailer"}
            </h3>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close trailer dialog"
            className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-deep)] hover:text-[var(--color-text-primary)] transition-colors focus-ring"
          >
            <svg
              className="h-5 w-5"
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

        {/* Video Player */}
        <div className="relative aspect-video w-full bg-[var(--color-surface-deep)]">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1&rel=0`}
            title={trailer.name || "Video Trailer"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 h-full w-full border-0"
          />
        </div>
      </div>
    </div>
  );
}
