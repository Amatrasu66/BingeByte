import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  getContinueWatching,
  saveWatchProgress,
  removeContinueWatchingItem,
  clearContinueWatching,
  STORAGE_KEY,
  MAX_ITEMS,
} from "./continue-watching";

// Mock localStorage in Node environment
class MockLocalStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

describe("Continue Watching Storage Service", () => {
  const globalRef = globalThis as { window?: unknown };
  const originalWindow = globalRef.window;

  beforeEach(() => {
    globalRef.window = {
      localStorage: new MockLocalStorage(),
      dispatchEvent: () => true,
    };
  });

  afterEach(() => {
    globalRef.window = originalWindow;
  });

  it("should return empty array when storage is empty", () => {
    const items = getContinueWatching();
    assert.deepEqual(items, []);
  });

  it("should save and retrieve movie progress accurately", () => {
    const movie = {
      mediaType: "movie" as const,
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/fightclub.jpg",
      backdropPath: "/fightclub-backdrop.jpg",
    };

    saveWatchProgress(movie);
    const retrieved = getContinueWatching();

    assert.equal(retrieved.length, 1);
    assert.equal(retrieved[0].tmdbId, 550);
    assert.equal(retrieved[0].title, "Fight Club");
    assert.equal(retrieved[0].mediaType, "movie");
    assert.ok(typeof retrieved[0].lastWatchedAt === "number");
  });

  it("should update existing item instead of creating duplicate for same movie", () => {
    saveWatchProgress({
      mediaType: "movie",
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/poster.jpg",
      backdropPath: null,
      lastWatchedAt: 1000,
    });

    saveWatchProgress({
      mediaType: "movie",
      tmdbId: 550,
      title: "Fight Club",
      posterPath: "/poster.jpg",
      backdropPath: null,
      lastWatchedAt: 2000,
    });

    const items = getContinueWatching();
    assert.equal(items.length, 1);
    assert.equal(items[0].lastWatchedAt, 2000);
  });

  it("should update TV show with latest episode watched", () => {
    saveWatchProgress({
      mediaType: "tv",
      tmdbId: 1399,
      title: "Game of Thrones",
      posterPath: "/got.jpg",
      backdropPath: null,
      seasonNumber: 1,
      episodeNumber: 1,
      episodeTitle: "Winter Is Coming",
      lastWatchedAt: 1000,
    });

    saveWatchProgress({
      mediaType: "tv",
      tmdbId: 1399,
      title: "Game of Thrones",
      posterPath: "/got.jpg",
      backdropPath: null,
      seasonNumber: 1,
      episodeNumber: 2,
      episodeTitle: "The Kingsroad",
      lastWatchedAt: 2000,
    });

    const items = getContinueWatching();
    assert.equal(items.length, 1);
    assert.equal(items[0].seasonNumber, 1);
    assert.equal(items[0].episodeNumber, 2);
    assert.equal(items[0].episodeTitle, "The Kingsroad");
  });

  it("should sort items with most recently watched first", () => {
    saveWatchProgress({
      mediaType: "movie",
      tmdbId: 100,
      title: "Old Movie",
      posterPath: null,
      backdropPath: null,
      lastWatchedAt: 1000,
    });

    saveWatchProgress({
      mediaType: "movie",
      tmdbId: 200,
      title: "New Movie",
      posterPath: null,
      backdropPath: null,
      lastWatchedAt: 5000,
    });

    const items = getContinueWatching();
    assert.equal(items.length, 2);
    assert.equal(items[0].tmdbId, 200);
    assert.equal(items[1].tmdbId, 100);
  });

  it("should remove item correctly", () => {
    saveWatchProgress({
      mediaType: "movie",
      tmdbId: 550,
      title: "Fight Club",
      posterPath: null,
      backdropPath: null,
    });

    saveWatchProgress({
      mediaType: "tv",
      tmdbId: 1399,
      title: "Game of Thrones",
      posterPath: null,
      backdropPath: null,
    });

    assert.equal(getContinueWatching().length, 2);

    removeContinueWatchingItem("movie", 550);
    const remaining = getContinueWatching();

    assert.equal(remaining.length, 1);
    assert.equal(remaining[0].tmdbId, 1399);
  });

  it("should clear all items with clearContinueWatching", () => {
    saveWatchProgress({
      mediaType: "movie",
      tmdbId: 550,
      title: "Fight Club",
      posterPath: null,
      backdropPath: null,
    });

    clearContinueWatching();
    assert.equal(getContinueWatching().length, 0);
  });

  it("should gracefully handle corrupted storage JSON", () => {
    window.localStorage.setItem(STORAGE_KEY, "{ not valid json ]");
    const items = getContinueWatching();
    assert.deepEqual(items, []);
  });

  it("should cap items to MAX_ITEMS", () => {
    for (let i = 1; i <= MAX_ITEMS + 5; i++) {
      saveWatchProgress({
        mediaType: "movie",
        tmdbId: i,
        title: `Movie ${i}`,
        posterPath: null,
        backdropPath: null,
        lastWatchedAt: i * 10,
      });
    }

    const items = getContinueWatching();
    assert.equal(items.length, MAX_ITEMS);
    // Newest should be present
    assert.equal(items[0].tmdbId, MAX_ITEMS + 5);
  });
});
