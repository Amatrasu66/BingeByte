import { Suspense } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MainContainer } from "@/components/layout/main-container";
import { FeaturedHero } from "@/components/home/featured-hero";
import { ContinueWatching } from "@/components/home/continue-watching";
import { MediaSection } from "@/components/home/media-section";
import { TMDBAttribution } from "@/components/home/tmdb-attribution";
import { ConfigNotice } from "@/components/home/config-notice";
import {
  getTrendingAll,
  getPopularMovies,
  getPopularTV,
  getTopRatedMovies,
  getAnimeDiscovery,
  selectFeaturedMedia,
  TMDBConfigError,
} from "@/lib/tmdb";

function HomeSkeleton() {
  return (
    <div className="w-full animate-pulse-subtle">
      {/* Full-viewport Hero Skeleton */}
      <div className="relative w-full h-[100vh] h-[100svh] min-h-[620px] bg-[var(--color-surface-deep)] flex items-end">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-4">
          <div className="h-5 w-32 rounded bg-[var(--color-surface)]" />
          <div className="h-12 sm:h-16 w-3/4 max-w-xl rounded bg-[var(--color-surface)]" />
          <div className="h-4 w-1/2 max-w-md rounded bg-[var(--color-surface)]" />
          <div className="flex gap-3 pt-4">
            <div className="h-11 w-32 rounded bg-[var(--color-surface)]" />
            <div className="h-11 w-32 rounded bg-[var(--color-surface)]" />
          </div>
        </div>
      </div>

      {/* Collection Rails Skeletons */}
      <MainContainer className="py-12 sm:py-16 space-y-12">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="space-y-4">
            <div className="h-6 w-48 rounded bg-[var(--color-surface)]" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px] aspect-[2/3] rounded-md bg-[var(--color-surface)] flex-none"
                />
              ))}
            </div>
          </div>
        ))}
      </MainContainer>
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

  // Curate up to 10 dynamic rotating featured titles combining top trending and popular titles
  const featuredItems = selectFeaturedMedia(trendingItems, movieItems, tvItems, 10);

  return (
    <div className="w-full">
      {/* Configuration Banner if TMDB Credentials are not set */}
      {isConfigError && (
        <div className="pt-20 px-4 max-w-7xl mx-auto">
          <ConfigNotice />
        </div>
      )}

      {/* Section 2: Full-Viewport Cinematic Hero Carousel with 3-second rotation */}
      <FeaturedHero items={featuredItems} intervalMs={3000} />

      {/* Main Content Browsing Rails */}
      <main className="pb-16 sm:pb-24">
        <MainContainer className="py-8 sm:py-12 space-y-12 sm:space-y-16 lg:space-y-20">
          {/* Continue Watching Section (Client-side localStorage) */}
          <ContinueWatching />

          {/* Section 3: Trending Now Horizontal Rail */}
          <MediaSection
            id="trending"
            title="Trending Now"
            description="The most popular movies and television series across the catalog today."
            items={trendingItems}
            error={trendingError}
            limit={20}
          />

          {/* Section 4: Popular Movies Horizontal Rail */}
          <MediaSection
            id="movies"
            title="Popular Movies"
            description="Top-ranked movies currently captivating audiences worldwide."
            items={movieItems}
            error={movieError}
            limit={20}
          />

          {/* Section 5: Popular TV Shows Horizontal Rail */}
          <MediaSection
            id="tv"
            title="Popular TV Shows"
            description="Highly watched drama, comedy, sci-fi, and serialized television."
            items={tvItems}
            error={tvError}
            limit={20}
          />

          {/* Section 6: Additional Collections - Top Rated Entertainment */}
          <MediaSection
            id="top-rated"
            title="Top Rated Entertainment"
            description="Critically acclaimed cinematic masterworks and all-time highest rated titles."
            items={topRatedItems}
            error={topRatedError}
            limit={20}
          />

          {/* Section 6: Additional Collections - Discover Anime */}
          <MediaSection
            id="anime"
            title="Discover Anime"
            description="Curated Japanese animated series and popular anime titles from TMDB."
            items={animeItems}
            error={animeError}
            limit={20}
            mediaTypeOverride="anime"
          />

          {/* Section 7: Official TMDB Attribution */}
          <TMDBAttribution />
        </MainContainer>
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <AppShell isCinematicHeader={true}>
      <Suspense fallback={<HomeSkeleton />}>
        <HomeContent />
      </Suspense>
    </AppShell>
  );
}
