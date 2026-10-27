import * as React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { ConfigNotice } from "@/components/home/config-notice";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import {
  MediaDetailHero,
  SeasonSelector,
  CastSection,
  MediaMetadataGrid,
  RecommendationsSection,
} from "@/components/media-detail";
import {
  getDetailedTV,
  getTVDetails,
  getTVSeasonDetails,
  getBackdropUrl,
  getPosterUrl,
  TMDBNotFoundError,
  TMDBConfigError,
} from "@/lib/tmdb";

export interface AnimeDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: AnimeDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    return {
      title: "Anime Not Found | BingeByte",
      description: "The requested anime series could not be found.",
    };
  }

  try {
    const show = await getTVDetails(numericId);
    const poster = getPosterUrl(show.posterPath, "w500");
    const backdrop = getBackdropUrl(show.backdropPath, "w1280");

    return {
      title: `${show.title} (Anime) | BingeByte`,
      description: show.overview || `Discover ${show.title} episodes and details on BingeByte.`,
      openGraph: {
        title: `${show.title} | BingeByte`,
        description: show.overview || undefined,
        images: backdrop ? [backdrop] : poster ? [poster] : [],
      },
    };
  } catch {
    return {
      title: "Anime Series Details | BingeByte",
      description: "Explore cinematic anime series details and episodes on BingeByte.",
    };
  }
}

export default async function AnimeDetailPage({ params }: AnimeDetailPageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    notFound();
  }

  let data = null;
  let initialSeasonData = null;
  let isConfigError = false;
  let serviceError: string | null = null;

  try {
    data = await getDetailedTV(numericId);

    // Prefetch initial season details server-side for zero-delay episode display
    if (data.details.seasons && data.details.seasons.length > 0) {
      const defaultSeasonNum =
        data.details.seasons.find((s) => s.seasonNumber === 1)?.seasonNumber ??
        data.details.seasons[0].seasonNumber;

      try {
        initialSeasonData = await getTVSeasonDetails(numericId, defaultSeasonNum);
      } catch {
        // Fallback: client will fetch on-demand if server prefetch encounters an error
      }
    }
  } catch (error) {
    if (error instanceof TMDBNotFoundError) {
      notFound();
    }
    if (error instanceof TMDBConfigError) {
      isConfigError = true;
    } else {
      serviceError =
        "Unable to retrieve anime series details at this time. The entertainment catalog provider may be temporarily unavailable.";
    }
  }

  if (isConfigError) {
    return (
      <AppShell>
        <MainContainer className="py-12">
          <ConfigNotice />
        </MainContainer>
      </AppShell>
    );
  }

  if (serviceError || !data) {
    return (
      <AppShell>
        <MainContainer className="py-16 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]">
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Anime Details Temporarily Unavailable
          </h1>
          <p className="max-w-md mx-auto text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {serviceError || "We could not load this anime series at this time. Please try again shortly."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/anime"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus-ring transition-colors"
            >
              Return to Anime Catalog
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus-ring transition-colors"
            >
              Go to Home
            </Link>
          </div>
        </MainContainer>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <MediaDetailHero
        media={data.details}
        primaryTrailer={data.primaryTrailer}
        customCategory="anime"
      />

      <MainContainer className="py-12 space-y-12">
        {data.details.seasons && data.details.seasons.length > 0 && (
          <SeasonSelector
            tvId={numericId}
            seasons={data.details.seasons}
            initialSeasonData={initialSeasonData}
          />
        )}

        {data.credits.cast.length > 0 && (
          <CastSection cast={data.credits.cast} />
        )}

        <MediaMetadataGrid media={data.details} credits={data.credits} />

        {(data.recommendations.length > 0 || data.similar.length > 0) && (
          <RecommendationsSection
            recommendations={data.recommendations}
            similar={data.similar}
          />
        )}

        <TMDBAttribution />
      </MainContainer>
    </AppShell>
  );
}
