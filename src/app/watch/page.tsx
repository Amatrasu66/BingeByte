import * as React from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { ConfigNotice } from "@/components/home/config-notice";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import {
  WatchHero,
  PlaybackContainer,
  WatchProvidersSection,
  TVEpisodeNavigation,
  WatchErrorState,
  WatchSkeleton,
} from "@/components/watch";
import { getDefaultPlaybackProvider } from "@/lib/playback";
import {
  parseWatchParams,
  getMovieDetails,
  getTVDetails,
  getMovieVideos,
  getTVVideos,
  getMovieWatchProviders,
  getTVWatchProviders,
  getTVSeasonDetails,
  selectPrimaryTrailer,
  normalizeWatchProviders,
  TMDBNotFoundError,
  TMDBConfigError,
} from "@/lib/tmdb";
import type {
  NormalizedVideo,
  NormalizedWatchProviders,
  NormalizedSeasonDetails,
  NormalizedEpisode,
} from "@/lib/tmdb/types";

export interface WatchPageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
    season?: string;
    episode?: string;
    region?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: WatchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const validation = parseWatchParams(params);

  if (!validation.success) {
    return {
      title: "Watch & Streaming Discovery | BingeByte",
      description: "Discover official trailers, legitimate streaming providers, and episode guides.",
    };
  }

  const { type, id } = validation.data;

  try {
    if (type === "movie") {
      const movie = await getMovieDetails(id);
      return {
        title: `Watch ${movie.title} — Official Trailers & Providers | BingeByte`,
        description: `Explore official trailers and legitimate streaming, rental, and purchase platforms for ${movie.title}.`,
      };
    } else {
      const show = await getTVDetails(id);
      return {
        title: `Watch ${show.title} — Official Trailers & Providers | BingeByte`,
        description: `Explore official trailers, episode lists, and legitimate streaming platforms for ${show.title}.`,
      };
    }
  } catch {
    return {
      title: "Watch & Streaming Discovery | BingeByte",
      description: "Discover official trailers and legitimate streaming providers on BingeByte.",
    };
  }
}

async function WatchContent({ searchParams }: WatchPageProps) {
  const params = await searchParams;
  const validation = parseWatchParams(params);

  if (!validation.success) {
    return (
      <WatchErrorState
        title="Invalid Playback Parameters"
        message={validation.error}
      />
    );
  }

  const { type, id, season = 1, episode = 1 } = validation.data;
  const region = (params.region?.trim() || "IN").toUpperCase();

  if (type === "movie") {
    // Execute movie queries in parallel with independent failure tolerance
    const [movieRes, videosRes, providersRes] = await Promise.allSettled([
      getMovieDetails(id),
      getMovieVideos(id),
      getMovieWatchProviders(id, region),
    ]);

    if (movieRes.status === "rejected") {
      const error = movieRes.reason;
      if (error instanceof TMDBNotFoundError) {
        return (
          <WatchErrorState
            title="Movie Not Found"
            message="The requested movie could not be located in the TMDB catalog."
          />
        );
      }
      if (error instanceof TMDBConfigError) {
        return (
          <AppShell>
            <MainContainer className="py-12">
              <ConfigNotice />
            </MainContainer>
          </AppShell>
        );
      }
      return (
        <WatchErrorState
          title="Unable to Load Movie"
          message="We encountered an issue retrieving metadata from the entertainment catalog. Please try again shortly."
        />
      );
    }

    const movie = movieRes.value;
    const videos: NormalizedVideo[] =
      videosRes.status === "fulfilled" ? videosRes.value : [];
    const primaryTrailer = selectPrimaryTrailer(videos);
    const providers: NormalizedWatchProviders =
      providersRes.status === "fulfilled"
        ? providersRes.value
        : normalizeWatchProviders(id, null, region);

    const playbackProvider = getDefaultPlaybackProvider();
    const playbackResult = playbackProvider.resolvePlayback({
      mediaType: "movie",
      tmdbId: id,
    });

    return (
      <AppShell>
        <WatchHero media={movie} />

        <MainContainer className="py-8 space-y-10">
          <PlaybackContainer
            playbackResult={playbackResult}
            trailer={primaryTrailer}
            title={movie.title}
            mediaType="movie"
            mediaId={id}
          />

          <WatchProvidersSection
            providers={providers}
            mediaType="movie"
            mediaId={id}
          />

          <TMDBAttribution />
        </MainContainer>
      </AppShell>
    );
  }

  // TV Series watch content
  const [tvRes, videosRes, providersRes, seasonRes] = await Promise.allSettled([
    getTVDetails(id),
    getTVVideos(id),
    getTVWatchProviders(id, region),
    getTVSeasonDetails(id, season),
  ]);

  if (tvRes.status === "rejected") {
    const error = tvRes.reason;
    if (error instanceof TMDBNotFoundError) {
      return (
        <WatchErrorState
          title="TV Series Not Found"
          message="The requested television series could not be located in the TMDB catalog."
        />
      );
    }
    if (error instanceof TMDBConfigError) {
      return (
        <AppShell>
          <MainContainer className="py-12">
            <ConfigNotice />
          </MainContainer>
        </AppShell>
      );
    }
    return (
      <WatchErrorState
        title="Unable to Load Series"
        message="We encountered an issue retrieving series metadata. Please try again shortly."
      />
    );
  }

  const show = tvRes.value;
  const videos: NormalizedVideo[] =
    videosRes.status === "fulfilled" ? videosRes.value : [];
  const primaryTrailer = selectPrimaryTrailer(videos);
  const providers: NormalizedWatchProviders =
    providersRes.status === "fulfilled"
      ? providersRes.value
      : normalizeWatchProviders(id, null, region);

  const initialSeasonData: NormalizedSeasonDetails | null =
    seasonRes.status === "fulfilled" ? seasonRes.value : null;

  const currentEpisode: NormalizedEpisode | null =
    initialSeasonData?.episodes.find((e) => e.episodeNumber === episode) ?? null;

  const playbackProvider = getDefaultPlaybackProvider();
  const playbackResult = playbackProvider.resolvePlayback({
    mediaType: "tv",
    tmdbId: id,
    season,
    episode,
  });

  const displayTitle = currentEpisode
    ? `${show.title} — S${season}:E${episode} "${currentEpisode.name}"`
    : show.title;

  return (
    <AppShell>
      <WatchHero
        media={show}
        episode={currentEpisode}
        seasonNumber={season}
      />

      <MainContainer className="py-8 space-y-10">
        <PlaybackContainer
          playbackResult={playbackResult}
          trailer={primaryTrailer}
          title={displayTitle}
          mediaType="tv"
          mediaId={id}
          season={season}
          episode={episode}
        />

        {show.seasons && show.seasons.length > 0 && (
          <TVEpisodeNavigation
            tvId={id}
            seasons={show.seasons}
            currentSeasonNumber={season}
            currentEpisodeNumber={episode}
            initialSeasonData={initialSeasonData}
          />
        )}

        <WatchProvidersSection
          providers={providers}
          mediaType="tv"
          mediaId={id}
        />

        <TMDBAttribution />
      </MainContainer>
    </AppShell>
  );
}

export default function WatchPage({ searchParams }: WatchPageProps) {
  return (
    <Suspense fallback={<WatchSkeleton />}>
      <WatchContent searchParams={searchParams} />
    </Suspense>
  );
}
