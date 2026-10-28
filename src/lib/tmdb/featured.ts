import type { NormalizedMedia } from "./types";

/**
 * Stable curated fallback items used if the TMDB API fails or returns no backdrop artwork.
 * Uses real TMDB paths of widely recognized cinematic titles to guarantee a flawless experience.
 */
export const FALLBACK_FEATURED_TITLES: NormalizedMedia[] = [
  {
    id: 603692,
    mediaType: "movie",
    title: "John Wick: Chapter 4",
    overview:
      "John Wick uncovers a path to defeating The High Table. But before he can earn his freedom, Wick must face off against a new enemy with powerful alliances across the globe.",
    backdropPath: "/7I6VUdPj6tQECNHdviJkUHD2389.jpg",
    posterPath: "/vZloFAK7NKnMGKEslUsZjhC9ph8.jpg",
    releaseDate: "2023-03-22",
    voteAverage: 7.8,
    voteCount: 6100,
    genreIds: [28, 53, 80],
    originalLanguage: "en",
    popularity: 520,
  },
  {
    id: 693134,
    mediaType: "movie",
    title: "Dune: Part Two",
    overview:
      "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge against the conspirators who destroyed his family.",
    backdropPath: "/xOMo8BRK7PfcJv9JCnx7s520QIq.jpg",
    posterPath: "/1pdfLvkbY9ohJlCjQH2CZjjYVvJ.jpg",
    releaseDate: "2024-02-27",
    voteAverage: 8.2,
    voteCount: 5400,
    genreIds: [878, 12],
    originalLanguage: "en",
    popularity: 450,
  },
  {
    id: 94997,
    mediaType: "tv",
    title: "House of the Dragon",
    overview:
      "The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most empires fall from such heights.",
    backdropPath: "/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg",
    posterPath: "/t9Xke5724fqmjusc2AnZK5I2LHg.jpg",
    releaseDate: "2022-08-21",
    voteAverage: 8.4,
    voteCount: 4200,
    genreIds: [10765, 18, 10759],
    originalLanguage: "en",
    popularity: 380,
  },
  {
    id: 157336,
    mediaType: "movie",
    title: "Interstellar",
    overview:
      "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel.",
    backdropPath: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
    posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
    releaseDate: "2014-11-05",
    voteAverage: 8.4,
    voteCount: 35000,
    genreIds: [12, 18, 878],
    originalLanguage: "en",
    popularity: 210,
  },
  {
    id: 94605,
    mediaType: "tv",
    title: "Arcane",
    overview:
      "Amid the stark discord of twin cities Piltover and Zaun, two sisters fight on rival sides of a war between magic technologies and incompatible convictions.",
    backdropPath: "/uDgy6hyPd82kOHh6I95FLtLnj6p.jpg",
    posterPath: "/fqldf2t8ztc9aiwn3k6mlX3tvRT.jpg",
    releaseDate: "2021-11-06",
    voteAverage: 8.7,
    voteCount: 4100,
    genreIds: [16, 10765, 10759, 18],
    originalLanguage: "en",
    popularity: 195,
  },
  {
    id: 872585,
    mediaType: "movie",
    title: "Oppenheimer",
    overview:
      "The story of J. Robert Oppenheimer's role in the development of the atomic bomb during World War II.",
    backdropPath: "/fm6KqXpk3M2HVveHwCrBSSBaO0V.jpg",
    posterPath: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
    releaseDate: "2023-07-19",
    voteAverage: 8.1,
    voteCount: 9200,
    genreIds: [18, 36],
    originalLanguage: "en",
    popularity: 280,
  },
  {
    id: 100088,
    mediaType: "tv",
    title: "The Last of Us",
    overview:
      "Twenty years after modern civilization has been destroyed, Joel is hired to smuggle Ellie out of an oppressive quarantine zone.",
    backdropPath: "/2OMG2ytUV1zcHIcrU1SmhKicNtz.jpg",
    posterPath: "/uKvVjHNqB5VmOrdxqMis2SYaw2V.jpg",
    releaseDate: "2023-01-15",
    voteAverage: 8.6,
    voteCount: 5100,
    genreIds: [18, 10765, 10759],
    originalLanguage: "en",
    popularity: 240,
  },
  {
    id: 335984,
    mediaType: "movie",
    title: "Blade Runner 2049",
    overview:
      "Thirty years after the events of the first film, a new blade runner, LAPD Officer K, unearths a long-buried secret that could plunge what's left of society into chaos.",
    backdropPath: "/ilRyASDvt7vCTR5xT2y9zauqYtS.jpg",
    posterPath: "/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg",
    releaseDate: "2017-10-04",
    voteAverage: 8.0,
    voteCount: 13500,
    genreIds: [878, 18, 9648],
    originalLanguage: "en",
    popularity: 175,
  },
  {
    id: 97951,
    mediaType: "tv",
    title: "Severance",
    overview:
      "Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.",
    backdropPath: "/bKxiL9421AOkNgCcWRUmS09Z8KN.jpg",
    posterPath: "/3P4z4yUeE0Yf65x6kXk2sT8bJbY.jpg",
    releaseDate: "2022-02-17",
    voteAverage: 8.4,
    voteCount: 1400,
    genreIds: [18, 9648, 878],
    originalLanguage: "en",
    popularity: 130,
  },
  {
    id: 603,
    mediaType: "movie",
    title: "The Matrix",
    overview:
      "A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.",
    backdropPath: "/l4QHerTSbflqOWv4Sk2QI5izQ5x.jpg",
    posterPath: "/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg",
    releaseDate: "1999-03-30",
    voteAverage: 8.2,
    voteCount: 25000,
    genreIds: [28, 878],
    originalLanguage: "en",
    popularity: 160,
  },
];

/**
 * Deterministically selects up to 10 featured titles for the hero carousel.
 * Combines trending items, popular movies, and popular TV series that have high-res backdrops.
 */
export function selectFeaturedMedia(
  trendingItems?: NormalizedMedia[] | null,
  popularMovies?: NormalizedMedia[] | null,
  popularTV?: NormalizedMedia[] | null,
  limit: number = 10
): NormalizedMedia[] {
  const seenIds = new Set<number>();
  const candidates: NormalizedMedia[] = [];

  const isValidHeroCandidate = (item: NormalizedMedia): boolean => {
    return Boolean(
      item &&
      item.id &&
      item.title &&
      item.backdropPath &&
      item.overview &&
      item.overview.trim().length > 15
    );
  };

  // 1. Gather high-quality trending items
  if (trendingItems && Array.isArray(trendingItems)) {
    for (const item of trendingItems) {
      if (isValidHeroCandidate(item) && !seenIds.has(item.id)) {
        candidates.push(item);
        seenIds.add(item.id);
        if (candidates.length >= limit) break;
      }
    }
  }

  // 2. Interleave popular TV shows and movies to reach requested limit (up to 10)
  if (candidates.length < limit && popularTV && Array.isArray(popularTV)) {
    for (const item of popularTV) {
      if (isValidHeroCandidate(item) && !seenIds.has(item.id)) {
        candidates.push({ ...item, mediaType: "tv" });
        seenIds.add(item.id);
        if (candidates.length >= limit) break;
      }
    }
  }

  if (candidates.length < limit && popularMovies && Array.isArray(popularMovies)) {
    for (const item of popularMovies) {
      if (isValidHeroCandidate(item) && !seenIds.has(item.id)) {
        candidates.push({ ...item, mediaType: "movie" });
        seenIds.add(item.id);
        if (candidates.length >= limit) break;
      }
    }
  }

  // 3. If live items are insufficient, pad with fallback curated titles
  if (candidates.length === 0) {
    return FALLBACK_FEATURED_TITLES.slice(0, limit);
  }

  if (candidates.length < limit) {
    for (const fallback of FALLBACK_FEATURED_TITLES) {
      if (!seenIds.has(fallback.id)) {
        candidates.push(fallback);
        seenIds.add(fallback.id);
        if (candidates.length >= limit) break;
      }
    }
  }

  return candidates.slice(0, limit);
}
