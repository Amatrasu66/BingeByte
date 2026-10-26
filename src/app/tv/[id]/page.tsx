import * as React from "react";
import type { Metadata } from "next";
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

export interface TVDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: TVDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    return {
      title: "TV Series Not Found | BingeByte",
      description: "The requested television series could not be found.",
    };
  }

  try {
    const show = await getTVDetails(numericId);
    const poster = getPosterUrl(show.posterPath, "w500");
    const backdrop = getBackdropUrl(show.backdropPath, "w1280");

    return {
      title: `${show.title} | BingeByte`,
      description: show.overview || `Discover ${show.title} episodes and details on BingeByte.`,
      openGraph: {
        title: `${show.title} | BingeByte`,
        description: show.overview || undefined,
        images: backdrop ? [backdrop] : poster ? [poster] : [],
      },
    };
  } catch {
    return {
      title: "TV Series Details | BingeByte",
      description: "Explore cinematic television series details and episodes on BingeByte.",
    };
  }
}

export default async function TVDetailPage({ params }: TVDetailPageProps) {
  const { id } = await params;
  const numericId = parseInt(id, 10);

  if (isNaN(numericId) || numericId <= 0) {
    notFound();
  }

  let data = null;
  let initialSeasonData = null;
  let isConfigError = false;

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
