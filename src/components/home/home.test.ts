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
});
