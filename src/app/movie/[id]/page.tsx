import * as React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
import { WatchProvidersSection } from "@/components/watch";
import {
  getDetailedMovie,
  getMovieDetails,
  getMovieWatchProviders,
  getBackdropUrl,
  getPosterUrl,
  TMDBNotFoundError,
  TMDBConfigError,
} from "@/lib/tmdb";
import type { NormalizedWatchProviders } from "@/lib/tmdb/types";

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
    const releaseYear = movie.releaseDate
      ? ` (${movie.releaseDate.split("-")[0]})`
      : "";
    const title = `${movie.title}${releaseYear} — Movie Details | BingeByte`;
    const description =
      movie.overview ||
      `Explore synopsis, cast, crew, trailers, and recommendations for ${movie.title}.`;
    const backdropUrl = getBackdropUrl(movie.backdropPath, "w1280");
    const posterUrl = getPosterUrl(movie.posterPath, "w500");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.movie",
        images: backdropUrl ? [backdropUrl] : posterUrl ? [posterUrl] : [],
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
  let providers: NormalizedWatchProviders | null = null;
  let isConfigError = false;

  try {
    const [detailRes, providersRes] = await Promise.allSettled([
      getDetailedMovie(numericId),
      getMovieWatchProviders(numericId, "IN"),
    ]);

    if (detailRes.status === "rejected") {
      throw detailRes.reason;
    }

    data = detailRes.value;
    providers = providersRes.status === "fulfilled" ? providersRes.value : null;
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

        {providers && (
          <WatchProvidersSection
            providers={providers}
            mediaType="movie"
            mediaId={numericId}
          />
        )}

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
