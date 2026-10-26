import * as React from "react";
import Link from "next/link";

export function TMDBAttribution() {
  return (
    <aside
      aria-label="Metadata Attribution"
      className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)]/60 p-6 text-xs text-[var(--color-text-secondary)] leading-relaxed"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <p className="max-w-2xl">
          This product uses the TMDB API but is not endorsed or certified by{" "}
          <Link
            href="https://www.themoviedb.org/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-text-primary)] hover:underline focus-ring rounded-xs"
          >
            TMDB
          </Link>
          . Entertainment metadata, poster artwork, and details are provided solely for discovery and catalog browsing.
        </p>
        <span className="shrink-0 font-medium tracking-wide text-[var(--color-text-muted)]">
          Powered by TMDB
        </span>
      </div>
    </aside>
  );
}
