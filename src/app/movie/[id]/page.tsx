import * as React from "react";
import type { Metadata } from "next";
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

  try {
    data = await getDetailedMovie(numericId);
  } catch (error) {
    if (error instanceof TMDBNotFoundError) {
      notFound();
    }
    if (error instanceof TMDBConfigError) {
      isConfigError = true;
    } else {
      throw error;
    }
  }

  if (isConfigError || !data) {
    return (
      <AppShell>
        <MainContainer className="py-12">
          <ConfigNotice />
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
