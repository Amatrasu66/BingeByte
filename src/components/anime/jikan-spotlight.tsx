import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import type { NormalizedJikanAnime } from "@/lib/jikan/types";

export interface JikanSpotlightProps {
  items: NormalizedJikanAnime[] | null;
}

export function JikanSpotlight({ items }: JikanSpotlightProps) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="jikan-spotlight-heading" className="space-y-4 pt-2 pb-6">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--color-text-primary)]" aria-hidden="true" />
          <h2
            id="jikan-spotlight-heading"
            className="text-sm font-semibold tracking-wide text-[var(--color-text-primary)] uppercase"
          >
            Top Ranked on MyAnimeList
          </h2>
        </div>
        <span className="text-[11px] text-[var(--color-text-secondary)]">
          Supplementary MAL Community Data
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {items.slice(0, 5).map((anime) => (
          <div
            key={`jikan-${anime.malId}`}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2 transition-all hover:border-[var(--color-text-primary)]"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded bg-[var(--color-surface-deep)]">
              {anime.imageUrl ? (
                <Image
                  src={anime.imageUrl}
                  alt={anime.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  unoptimized
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-[var(--color-text-secondary)]">
                  No Image
                </div>
              )}

              {anime.score !== null && (
                <div className="absolute top-1.5 right-1.5 rounded bg-[var(--color-surface-deep)]/90 px-1.5 py-0.5 text-[10px] font-semibold text-[var(--color-text-primary)] backdrop-blur-xs border border-[var(--color-border-subtle)]">
                  ★ {anime.score.toFixed(1)}
                </div>
              )}
            </div>

            <div className="mt-2 flex flex-1 flex-col justify-between">
              <div>
                <h3 className="line-clamp-1 text-xs font-medium text-[var(--color-text-primary)] group-hover:text-white">
                  {anime.title}
                </h3>
                {anime.year && (
                  <p className="mt-0.5 text-[10px] text-[var(--color-text-secondary)]">
                    {anime.year} • {anime.type || "Anime"}
                  </p>
                )}
              </div>

              <Link
                href={`/search?q=${encodeURIComponent(anime.title)}`}
                className="mt-2 inline-flex items-center justify-center rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] py-1 text-[10px] font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-text-primary)] hover:text-[var(--color-background)] focus-ring"
              >
                Search in BingeByte
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
