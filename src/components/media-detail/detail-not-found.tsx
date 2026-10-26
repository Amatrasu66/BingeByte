import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { Button } from "@/components/ui/button";

export interface DetailNotFoundProps {
  mediaType?: "movie" | "tv" | "anime" | "title";
  customMessage?: string;
}

export function DetailNotFound({
  mediaType = "title",
  customMessage,
}: DetailNotFoundProps) {
  const typeLabel =
    mediaType === "movie"
      ? "Movie"
      : mediaType === "tv"
      ? "TV Series"
      : mediaType === "anime"
      ? "Anime"
      : "Title";

  return (
    <AppShell>
      <MainContainer className="py-24 text-center">
        <div className="mx-auto max-w-md rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)]">
            <svg
              className="h-6 w-6 text-[var(--color-text-secondary)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" />
              <path d="M7 3v18M17 3v18M3 7h4M3 12h4M3 17h4M17 7h4M17 12h4M17 17h4" />
            </svg>
          </div>

          <h1 className="mt-6 text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {typeLabel} Not Found
          </h1>

          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {customMessage ||
              `The requested ${typeLabel.toLowerCase()} could not be located in our catalog. It may have been removed or the ID is invalid.`}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href={mediaType === "movie" ? "/movies" : mediaType === "anime" ? "/anime" : "/tv"}>
              <Button variant="primary" size="md">
                Browse {typeLabel === "Title" ? "Discover" : typeLabel}
              </Button>
            </Link>
            <Link href="/">
              <Button variant="secondary" size="md">
                Home
              </Button>
            </Link>
          </div>
        </div>
      </MainContainer>
    </AppShell>
  );
}
