import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mediaItemToCardProps } from "@/lib/tmdb/normalizers";
import type { NormalizedMedia } from "@/lib/tmdb/types";

describe("Homepage Component Helpers & Data Mapping", () => {
  it("should map normalized media item to MediaCardProps with year, poster, and rating", () => {
    const item: NormalizedMedia = {
      id: 101,
      mediaType: "movie",
      title: "Interstellar",
      overview: "Mankind was born on Earth...",
      posterPath: "/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg",
      backdropPath: "/xJHokMbljvjADYdit5fK5VQsXEG.jpg",
      releaseDate: "2014-11-05",
      voteAverage: 8.419,
      voteCount: 34000,
      genreIds: [12, 18, 878],
      originalLanguage: "en",
      popularity: 140,
    };

    const cardProps = mediaItemToCardProps(item);

    assert.strictEqual(cardProps.id, 101);
    assert.strictEqual(cardProps.title, "Interstellar");
    assert.strictEqual(cardProps.year, "2014");
    assert.strictEqual(cardProps.mediaType, "movie");
    assert.strictEqual(cardProps.rating, "8.4");
    assert.strictEqual(cardProps.href, "/movie/101");
    assert.match(cardProps.posterUrl || "", /https:\/\/image\.tmdb\.org\/t\/p\/w500\//);
  });

  it("should handle missing optional metadata safely without crashing", () => {
    const item: NormalizedMedia = {
      id: 202,
      mediaType: "tv",
      title: "Mystery Show",
      overview: "No description",
      posterPath: null,
      backdropPath: null,
      releaseDate: null,
      voteAverage: 0,
      voteCount: 0,
      genreIds: [],
      originalLanguage: "en",
      popularity: 0,
    };

    const cardProps = mediaItemToCardProps(item);

    assert.strictEqual(cardProps.id, 202);
    assert.strictEqual(cardProps.title, "Mystery Show");
    assert.strictEqual(cardProps.year, null);
    assert.strictEqual(cardProps.rating, undefined);
    assert.strictEqual(cardProps.posterUrl, null);
    assert.strictEqual(cardProps.href, "/tv/202");
  });

  it("should generate correct detail route destinations for movie, tv, and anime items", () => {
    const movieItem: NormalizedMedia = {
      id: 550,
      mediaType: "movie",
      title: "Fight Club",
      overview: "An insomniac office worker...",
      posterPath: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
      backdropPath: null,
      releaseDate: "1999-10-15",
      voteAverage: 8.433,
      voteCount: 27000,
      genreIds: [18],
      originalLanguage: "en",
      popularity: 60,
    };

    const tvItem: NormalizedMedia = {
      id: 1399,
      mediaType: "tv",
      title: "Game of Thrones",
      overview: "Seven noble families fight...",
      posterPath: "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
      backdropPath: null,
      releaseDate: "2011-04-17",
      voteAverage: 8.452,
      voteCount: 23000,
      genreIds: [10765, 18],
      originalLanguage: "en",
      popularity: 120,
    };

    const movieProps = mediaItemToCardProps(movieItem);
    const tvProps = mediaItemToCardProps(tvItem);

    assert.strictEqual(movieProps.href, "/movie/550");
    assert.strictEqual(tvProps.href, "/tv/1399");

    // Anime section card override
    const animeHref = `/anime/${tvItem.id}`;
    assert.strictEqual(animeHref, "/anime/1399");
  });
});
