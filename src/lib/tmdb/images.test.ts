import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getTMDBImageUrl,
  getPosterUrl,
  getBackdropUrl,
  getProfileUrl,
  getStillUrl,
} from "./images";
import { TMDB_CONFIG } from "./config";

describe("TMDB Image Builders", () => {
  it("should return null for null, undefined, or empty path", () => {
    assert.strictEqual(getTMDBImageUrl(null), null);
    assert.strictEqual(getTMDBImageUrl(undefined), null);
    assert.strictEqual(getTMDBImageUrl(""), null);
    assert.strictEqual(getPosterUrl(null), null);
    assert.strictEqual(getBackdropUrl(undefined), null);
    assert.strictEqual(getProfileUrl(null), null);
    assert.strictEqual(getStillUrl(null), null);
  });

  it("should construct valid poster URLs with custom and default sizes", () => {
    const path = "/path_to_poster.jpg";
    assert.strictEqual(
      getPosterUrl(path),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/w500/path_to_poster.jpg`
    );
    assert.strictEqual(
      getPosterUrl(path, "w185"),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/w185/path_to_poster.jpg`
    );
    assert.strictEqual(
      getPosterUrl(path, "original"),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/original/path_to_poster.jpg`
    );
  });

  it("should construct valid backdrop URLs with default size w1280", () => {
    const path = "backdrop.jpg"; // Path without leading slash
    assert.strictEqual(
      getBackdropUrl(path),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/w1280/backdrop.jpg`
    );
    assert.strictEqual(
      getBackdropUrl(path, "w780"),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/w780/backdrop.jpg`
    );
  });

  it("should construct valid profile URLs with default size w185", () => {
    const path = "/actor.jpg";
    assert.strictEqual(
      getProfileUrl(path),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/w185/actor.jpg`
    );
    assert.strictEqual(
      getProfileUrl(path, "h632"),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/h632/actor.jpg`
    );
  });

  it("should construct valid still URLs with default size w300", () => {
    const path = "/episode.jpg";
    assert.strictEqual(
      getStillUrl(path),
      `${TMDB_CONFIG.IMAGE_BASE_URL}/w300/episode.jpg`
    );
  });
});
