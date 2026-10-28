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
  TVEpisodeNavigation,
  WatchErrorState,
  WatchSkeleton,
} from "@/components/watch";
import {
  resolvePlaybackWithProvider,
  getAvailableProviderDescriptors,
} from "@/lib/playback";
import {
  parseWatchParams,
  getMovieDetails,
  getTVDetails,
  getMovieVideos,
  getTVVideos,
  getTVSeasonDetails,
  selectPrimaryTrailer,
  TMDBNotFoundError,
  TMDBConfigError,
} from "@/lib/tmdb";
import type {
  NormalizedVideo,
  NormalizedSeasonDetails,
  NormalizedEpisode,
} from "@/lib/tmdb/types";

export interface WatchPageProps {
  searchParams: Promise<{
    type?: string;
    id?: string;
    season?: string;
    episode?: string;
  }>;
}

export async function generateMetadata({
  searchParams,
}: WatchPageProps): Promise<Metadata> {
  const params = await searchParams;
  const validation = parseWatchParams(params);

  if (!validation.success) {
    return {
      title: "Watch | BingeByte",
      description: "Stream movies and TV series directly on BingeByte.",
    };
  }

  const { type, id } = validation.data;

  try {
    if (type === "movie") {
      const movie = await getMovieDetails(id);
      return {
        title: `Watch ${movie.title} | BingeByte`,
        description: `Stream ${movie.title} directly on BingeByte.`,
      };
    } else {
      const show = await getTVDetails(id);
      return {
        title: `Watch ${show.title} | BingeByte`,
        description: `Stream ${show.title} episodes directly on BingeByte.`,
      };
    }
  } catch {
    return {
      title: "Watch | BingeByte",
      description: "Stream entertainment directly on BingeByte.",
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

  const { type, id, season = 1, episode = 1, provider } = validation.data;
  const availableProviders = getAvailableProviderDescriptors();

  if (type === "movie") {
    // Execute movie metadata and playback stream queries in parallel
    const [movieRes, videosRes, playbackResult] = await Promise.all([
      getMovieDetails(id).then(
        (val) => ({ status: "fulfilled" as const, value: val }),
        (err) => ({ status: "rejected" as const, reason: err })
      ),
      getMovieVideos(id).then(
        (val) => ({ status: "fulfilled" as const, value: val }),
        (err) => ({ status: "rejected" as const, reason: err })
      ),
      resolvePlaybackWithProvider(
        {
          mediaType: "movie",
          tmdbId: id,
        },
        provider
      ),
    ]);

    if (movieRes.status === "rejected") {
      const error = movieRes.reason;
      if (error instanceof TMDBNotFoundError) {
        return (
          <WatchErrorState
            title="Movie Not Found"
            message="The requested movie could not be located in the entertainment catalog."
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
          message="We encountered an issue retrieving metadata. Please try again shortly."
        />
      );
    }

    const movie = movieRes.value;
    const videos: NormalizedVideo[] =
      videosRes.status === "fulfilled" ? videosRes.value : [];
    const primaryTrailer = selectPrimaryTrailer(videos);

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
            posterPath={movie.posterPath}
            backdropPath={movie.backdropPath}
            availableProviders={availableProviders}
          />

          <TMDBAttribution />
        </MainContainer>
      </AppShell>
    );
  }

  // TV Series watch content
  const [tvRes, videosRes, seasonRes, playbackResult] = await Promise.all([
    getTVDetails(id).then(
      (val) => ({ status: "fulfilled" as const, value: val }),
      (err) => ({ status: "rejected" as const, reason: err })
    ),
    getTVVideos(id).then(
      (val) => ({ status: "fulfilled" as const, value: val }),
      (err) => ({ status: "rejected" as const, reason: err })
    ),
    getTVSeasonDetails(id, season).then(
      (val) => ({ status: "fulfilled" as const, value: val }),
      (err) => ({ status: "rejected" as const, reason: err })
    ),
    resolvePlaybackWithProvider(
      {
        mediaType: "tv",
        tmdbId: id,
        season,
        episode,
      },
      provider
    ),
  ]);

  if (tvRes.status === "rejected") {
    const error = tvRes.reason;
    if (error instanceof TMDBNotFoundError) {
      return (
        <WatchErrorState
          title="TV Series Not Found"
          message="The requested television series could not be located in the catalog."
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

  const initialSeasonData: NormalizedSeasonDetails | null =
    seasonRes.status === "fulfilled" ? seasonRes.value : null;

  const currentEpisode: NormalizedEpisode | null =
    initialSeasonData?.episodes.find((e) => e.episodeNumber === episode) ?? null;

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
          posterPath={show.posterPath}
          backdropPath={show.backdropPath}
          episodeTitle={currentEpisode?.name}
          availableProviders={availableProviders}
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
