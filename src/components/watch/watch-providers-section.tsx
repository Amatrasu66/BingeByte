import * as React from "react";
import Image from "next/image";
import { getLogoUrl } from "@/lib/tmdb/images";
import { isSafeExternalUrl } from "@/lib/tmdb/normalizers";
import type { NormalizedWatchProviders, NormalizedWatchProviderItem } from "@/lib/tmdb/types";
import { SectionHeading } from "@/components/section-heading";

export interface WatchProvidersSectionProps {
  providers: NormalizedWatchProviders;
  mediaType: "movie" | "tv";
  mediaId: number;
}

function ProviderGroup({
  label,
  items,
}: {
  label: string;
  items: NormalizedWatchProviderItem[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">
        {label}
      </h3>
      <div className="flex flex-wrap gap-3">
        {items.map((provider) => {
          const logoUrl = getLogoUrl(provider.logoPath, "w92");

          return (
            <div
              key={`${label}-${provider.id}`}
              className="group flex items-center gap-2.5 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-2 pr-3.5 transition-colors hover:border-[var(--color-border-hover)]"
              title={provider.name}
            >
              <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-md bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)]">
                {logoUrl ? (
                  <Image
                    src={logoUrl}
                    alt={provider.name}
                    fill
                    sizes="32px"
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-[var(--color-text-secondary)]">
                    {provider.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)]">
                {provider.name}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function WatchProvidersSection({
  providers,
  mediaType,
  mediaId,
}: WatchProvidersSectionProps) {
  const safeLink = isSafeExternalUrl(providers.link) ? providers.link : null;
  const tmdbFallbackLink = `https://www.themoviedb.org/${mediaType}/${mediaId}/watch?locale=${providers.region}`;

  const destinationUrl = safeLink || tmdbFallbackLink;

  return (
    <section aria-labelledby="streaming-providers-heading" className="w-full space-y-6">
      <SectionHeading
        title="Where to Watch"
        description={`Legitimate streaming, rental, and purchase platforms available in India (${providers.region})`}
        action={
          <a
            href={destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors focus-ring rounded py-1 px-2 border border-[var(--color-border-subtle)] bg-[var(--color-surface)] hover:border-[var(--color-border-hover)]"
          >
            <span>Full JustWatch Availability</span>
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        }
      />

      {providers.hasProviders ? (
        <div className="space-y-6 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-4 sm:p-6">
          <ProviderGroup label="Stream (Subscription)" items={providers.stream} />
          <ProviderGroup label="Free / Ad-Supported" items={providers.free} />
          <ProviderGroup label="Rent" items={providers.rent} />
          <ProviderGroup label="Buy" items={providers.buy} />

          {/* JustWatch & TMDB Mandatory Attribution */}
          <div className="pt-4 border-t border-[var(--color-border-subtle)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] text-[var(--color-text-secondary)]">
            <span>
              Streaming data powered by{" "}
              <a
                href="https://www.justwatch.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-[var(--color-text-primary)]"
              >
                JustWatch
              </a>{" "}
              via The Movie Database (TMDB).
            </span>
            <span>Target Region: India ({providers.region})</span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface)] p-6 sm:p-8 text-center space-y-3">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-surface-deep)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <line x1="2" x2="22" y1="10" y2="10" />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            No Streaming Options Currently Listed in India ({providers.region})
          </h3>
          <p className="max-w-md mx-auto text-xs text-[var(--color-text-secondary)] leading-relaxed">
            JustWatch does not report any active subscription, rental, or purchase services for this title in India at this time. Availability changes regularly across regions.
          </p>
          <div className="pt-2">
            <a
              href={destinationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-primary)] hover:underline"
            >
              <span>Check global availability on JustWatch</span>
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
