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
  CastSection,
  MediaMetadataGrid,
  RecommendationsSection,
} from "@/components/media-detail";
import {
  getDetailedMovie,
  getMovieDetails,
  getBackdropUrl,
  getPosterUrl,
  TMDBNotFoundError,
  TMDBConfigError,
} from "@/lib/tmdb";

export interface MoviePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: MoviePageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    return {
      title: "Movie Not Found | BingeByte",
      description: "The requested movie could not be found.",
    };
  }

  try {
    const movie = await getMovieDetails(numericId);
    const poster = getPosterUrl(movie.posterPath, "w500");
    const backdrop = getBackdropUrl(movie.backdropPath, "w1280");

    return {
      title: `${movie.title} | BingeByte`,
      description: movie.overview || `Discover ${movie.title} on BingeByte.`,
      openGraph: {
        title: `${movie.title} | BingeByte`,
        description: movie.overview || undefined,
        images: backdrop ? [backdrop] : poster ? [poster] : [],
      },
    };
  } catch {
    return {
      title: "Movie Details | BingeByte",
      description: "Explore cinematic movie details and recommendations on BingeByte.",
    };
  }
}

export default async function MovieDetailPage({ params }: MoviePageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    notFound();
  }

  let data = null;
  let isConfigError = false;
  let serviceError: string | null = null;

  try {
    data = await getDetailedMovie(numericId);
  } catch (error) {
    if (error instanceof TMDBNotFoundError) {
      notFound();
    }
    if (error instanceof TMDBConfigError) {
      isConfigError = true;
    } else {
      serviceError =
        "Unable to retrieve movie details at this time. The entertainment catalog provider may be temporarily unavailable.";
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
            Movie Details Temporarily Unavailable
          </h1>
          <p className="max-w-md mx-auto text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {serviceError || "We could not load this movie at this time. Please try again shortly."}
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/movies"
              className="inline-flex items-center justify-center rounded-md border border-[var(--color-border-subtle)] bg-[var(--color-surface)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] focus-ring transition-colors"
            >
              Return to Movies Catalog
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
      />

      <MainContainer className="py-12 space-y-12">
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
