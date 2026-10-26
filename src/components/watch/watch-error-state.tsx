import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { Button } from "@/components/ui/button";

export interface WatchErrorStateProps {
  title?: string;
  message?: string;
}

export function WatchErrorState({
  title = "Playback Unavailable",
  message = "The requested playback resource could not be found or the parameters provided were invalid.",
}: WatchErrorStateProps) {
  return (
    <AppShell>
      <MainContainer className="py-24 text-center">
        <div className="mx-auto max-w-md rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-8 sm:p-12">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
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

          <h1 className="mt-6 text-xl sm:text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            {title}
          </h1>

          <p className="mt-3 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {message}
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/movies">
              <Button variant="primary" size="md">
                Browse Movies
              </Button>
            </Link>
            <Link href="/tv">
              <Button variant="secondary" size="md">
                Browse TV
              </Button>
            </Link>
            <Link href="/">
              <Button variant="ghost" size="md">
                Home
              </Button>
            </Link>
          </div>
        </div>
      </MainContainer>
    </AppShell>
  );
}
