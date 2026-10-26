import * as React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
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
import { WatchProvidersSection } from "@/components/watch";
import {
  getDetailedTV,
  getTVDetails,
  getTVSeasonDetails,
  getTVWatchProviders,
  getBackdropUrl,
  getPosterUrl,
  TMDBNotFoundError,
  TMDBConfigError,
} from "@/lib/tmdb";
import type { NormalizedWatchProviders } from "@/lib/tmdb/types";

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
    const firstYear = show.releaseDate
      ? ` (${show.releaseDate.split("-")[0]})`
      : "";
    const title = `${show.title}${firstYear} — Anime Series Details | BingeByte`;
    const description =
      show.overview ||
      `Explore episodes, seasons, characters, voice cast, and recommendations for ${show.title}.`;
    const backdropUrl = getBackdropUrl(show.backdropPath, "w1280");
    const posterUrl = getPosterUrl(show.posterPath, "w500");

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: "video.tv_show",
        images: backdropUrl ? [backdropUrl] : posterUrl ? [posterUrl] : [],
      },
    };
  } catch {
    return {
      title: "Anime Details | BingeByte",
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
  let providers: NormalizedWatchProviders | null = null;
  let isConfigError = false;

  try {
    const [detailRes, providersRes] = await Promise.allSettled([
      getDetailedTV(numericId),
      getTVWatchProviders(numericId, "IN"),
    ]);

    if (detailRes.status === "rejected") {
      throw detailRes.reason;
    }

    data = detailRes.value;
    providers = providersRes.status === "fulfilled" ? providersRes.value : null;

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

        {providers && (
          <WatchProvidersSection
            providers={providers}
            mediaType="tv"
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
