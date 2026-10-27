import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { FeaturedHero } from "@/components/home/featured-hero";
import { ContinueWatching } from "@/components/home/continue-watching";
import { MediaSection } from "@/components/home/media-section";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import { ConfigNotice } from "@/components/home/config-notice";
import { MediaCardSkeleton } from "@/components/media/media-card-skeleton";
import {
  getTrendingAll,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getAnimeDiscovery,
  TMDBConfigError,
} from "@/lib/tmdb";

function HomeSkeleton() {
  return (
    <div className="space-y-12 sm:space-y-16 animate-pulse-subtle">
      <div className="w-full h-96 rounded-lg bg-[var(--color-surface)] border border-[var(--color-border-subtle)]" />
      <div className="space-y-4">
        <div className="h-6 w-48 rounded bg-[var(--color-surface)]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <MediaCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

async function HomeContent() {
  // Fetch homepage discovery sections in parallel with resilient error isolation
  const [trendingRes, moviesRes, tvRes, topRatedRes, animeRes] = await Promise.allSettled([
    getTrendingAll("day", 1),
    getPopularMovies(1),
    getPopularTV(1),
    getTopRatedMovies(1),
    getAnimeDiscovery(1),
  ]);

  const isConfigError =
    trendingRes.status === "rejected" &&
    (trendingRes.reason instanceof TMDBConfigError ||
      trendingRes.reason?.name === "TMDBConfigError");

  const trendingItems = trendingRes.status === "fulfilled" ? trendingRes.value.results : null;
  const trendingError = trendingRes.status === "rejected" ? trendingRes.reason?.message : null;

  const movieItems = moviesRes.status === "fulfilled" ? moviesRes.value.results : null;
  const movieError = moviesRes.status === "rejected" ? moviesRes.reason?.message : null;

  const tvItems = tvRes.status === "fulfilled" ? tvRes.value.results : null;
  const tvError = tvRes.status === "rejected" ? tvRes.reason?.message : null;

  const topRatedItems = topRatedRes.status === "fulfilled" ? topRatedRes.value.results : null;
  const topRatedError = topRatedRes.status === "rejected" ? topRatedRes.reason?.message : null;

  const animeItems = animeRes.status === "fulfilled" ? animeRes.value.results : null;
  const animeError = animeRes.status === "rejected" ? animeRes.reason?.message : null;

  const heroMedia = trendingItems && trendingItems.length > 0 ? trendingItems[0] : null;
  const trendingSectionItems = trendingItems ? trendingItems.slice(1, 11) : null;

  return (
    <div className="space-y-12 sm:space-y-16 lg:space-y-20">
      {/* Configuration Banner if TMDB Credentials are not set */}
      {isConfigError && <ConfigNotice />}

      {/* Featured Hero Section */}
      <FeaturedHero media={heroMedia} />

      {/* Continue Watching Section (Client-side localStorage) */}
      <ContinueWatching />

      {/* Section A: Trending Now */}
      <MediaSection
        id="trending"
        title="Trending Now"
        description="The most popular movies and television series across the catalog today."
        items={trendingSectionItems}
        error={trendingError}
        limit={10}
      />

      {/* Section B: Popular Movies */}
      <MediaSection
        id="movies"
        title="Popular Movies"
        description="Top-ranked movies currently captivating audiences worldwide."
        items={movieItems}
        error={movieError}
        limit={10}
      />

      {/* Section C: Popular TV Shows */}
      <MediaSection
        id="tv"
        title="Popular TV Shows"
        description="Highly watched drama, comedy, sci-fi, and serialized television."
        items={tvItems}
        error={tvError}
        limit={10}
      />

      {/* Section D: Top Rated Entertainment */}
      <MediaSection
        id="top-rated"
        title="Top Rated Entertainment"
        description="Critically acclaimed cinematic masterworks and all-time highest rated titles."
        items={topRatedItems}
        error={topRatedError}
        limit={10}
      />

      {/* Section E: Discover Anime */}
      <MediaSection
        id="anime"
        title="Discover Anime"
        description="Curated Japanese animated series and popular anime titles from TMDB."
        items={animeItems}
        error={animeError}
        limit={10}
        mediaTypeOverride="anime"
      />

      {/* Section F: Official TMDB Attribution */}
      <TMDBAttribution />
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell>
      <main className="py-6 sm:py-8 lg:py-10">
        <MainContainer>
          <Suspense fallback={<HomeSkeleton />}>
            <HomeContent />
          </Suspense>
        </MainContainer>
      </main>
    </AppShell>
  );
}
