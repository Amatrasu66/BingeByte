import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function ConfigNotice() {
  return (
    <div
      role="alert"
      className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 text-left"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
            Setup Required
          </span>
          <h2 className="mt-1 text-lg sm:text-xl font-semibold text-[var(--color-text-primary)]">
            TMDB API Read Access Token Required
          </h2>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            Live entertainment browsing requires a TMDB API Read Access Token. Copy{" "}
            <code className="rounded bg-[var(--color-surface-deep)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-text-primary)]">
              .env.example
            </code>{" "}
            to{" "}
            <code className="rounded bg-[var(--color-surface-deep)] px-1.5 py-0.5 text-xs font-mono text-[var(--color-text-primary)]">
              .env.local
            </code>{" "}
            and configure your token to view live trending titles, artwork, and search results.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-3">
          <Link
            href="https://www.themoviedb.org/settings/api"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="secondary" size="md">
              Get TMDB Key
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
