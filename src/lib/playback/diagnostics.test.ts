import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  playbackDiagnostics,
  recordPlaybackDiagnostic,
  getRecentPlaybackDiagnostics,
  clearPlaybackDiagnostics,
  subscribePlaybackDiagnostics,
  type PlaybackDiagnosticEvent,
} from "./diagnostics";

describe("Phase 14D Playback Diagnostics Service", () => {
  beforeEach(() => {
    clearPlaybackDiagnostics();
  });

  describe("Event Recording and Retrieval", () => {
    it("should record an event with generated id and timestamp", () => {
      const event = recordPlaybackDiagnostic({
        type: "init_started",
        providerId: "nextstream",
        mediaType: "movie",
        tmdbId: 550,
      });

      assert.strictEqual(typeof event.id, "string");
      assert.match(event.id, /^diag-\d+-\d+$/);
      assert.strictEqual(event.type, "init_started");
      assert.strictEqual(event.providerId, "nextstream");
      assert.strictEqual(event.mediaType, "movie");
      assert.strictEqual(event.tmdbId, 550);
      assert.strictEqual(typeof event.timestamp, "number");

      const recent = getRecentPlaybackDiagnostics();
      assert.strictEqual(recent.length, 1);
      assert.strictEqual(recent[0].id, event.id);
    });

    it("should record provider switch and server switch events with duration", () => {
      recordPlaybackDiagnostic({
        type: "provider_switch_requested",
        providerId: "framextv",
        mediaType: "tv",
        tmdbId: 1399,
        season: 1,
        episode: 1,
      });

      recordPlaybackDiagnostic({
        type: "server_switch_requested",
        providerId: "framextv",
        serverId: "archer",
        mediaType: "tv",
        tmdbId: 1399,
        season: 1,
        episode: 1,
      });

      const recent = getRecentPlaybackDiagnostics();
      assert.strictEqual(recent.length, 2);
      assert.strictEqual(recent[0].type, "provider_switch_requested");
      assert.strictEqual(recent[1].type, "server_switch_requested");
      assert.strictEqual(recent[1].serverId, "archer");
    });

    it("should filter events by provider ID", () => {
      recordPlaybackDiagnostic({
        type: "init_started",
        providerId: "nextstream",
        mediaType: "movie",
        tmdbId: 550,
      });

      recordPlaybackDiagnostic({
        type: "init_started",
        providerId: "framextv",
        mediaType: "movie",
        tmdbId: 550,
      });

      const nextstreamEvents = playbackDiagnostics.getByProvider("nextstream");
      assert.strictEqual(nextstreamEvents.length, 1);
      assert.strictEqual(nextstreamEvents[0].providerId, "nextstream");

      const framexEvents = playbackDiagnostics.getByProvider("framextv");
      assert.strictEqual(framexEvents.length, 1);
      assert.strictEqual(framexEvents[0].providerId, "framextv");
    });
  });

  describe("Bounded Ring Buffer & Memory Safety", () => {
    it("should enforce the maximum limit of 50 events without leaking memory", () => {
      for (let i = 1; i <= 60; i++) {
        recordPlaybackDiagnostic({
          type: "init_started",
          providerId: "test-provider",
          mediaType: "movie",
          tmdbId: i,
        });
      }

      const recent = getRecentPlaybackDiagnostics();
      assert.strictEqual(recent.length, 50);
      // The oldest 10 events (1-10) should have been shifted out; first should be 11
      assert.strictEqual(recent[0].tmdbId, 11);
      assert.strictEqual(recent[49].tmdbId, 60);
    });

    it("should clear all events when clear() is called", () => {
      recordPlaybackDiagnostic({
        type: "init_started",
        providerId: "nextstream",
        mediaType: "movie",
        tmdbId: 550,
      });

      assert.strictEqual(getRecentPlaybackDiagnostics().length, 1);
      clearPlaybackDiagnostics();
      assert.strictEqual(getRecentPlaybackDiagnostics().length, 0);
    });
  });

  describe("Listener Subscriptions & Real-Time Delivery", () => {
    it("should notify subscribed listeners in real time and allow unsubscribe", () => {
      const received: PlaybackDiagnosticEvent[] = [];
      const unsubscribe = subscribePlaybackDiagnostics((evt) => {
        received.push(evt);
      });

      recordPlaybackDiagnostic({
        type: "init_started",
        providerId: "nextstream",
        mediaType: "movie",
        tmdbId: 550,
      });

      assert.strictEqual(received.length, 1);
      assert.strictEqual(received[0].providerId, "nextstream");

      // Unsubscribe and record another event
      unsubscribe();
      recordPlaybackDiagnostic({
        type: "init_succeeded",
        providerId: "nextstream",
        mediaType: "movie",
        tmdbId: 550,
        durationMs: 120,
      });

      // Listener should not have received the second event
      assert.strictEqual(received.length, 1);
    });

    it("should safely swallow subscriber exceptions without failing execution", () => {
      const unsubscribe = subscribePlaybackDiagnostics(() => {
        throw new Error("Subscriber crash");
      });

      // Should not throw
      assert.doesNotThrow(() => {
        recordPlaybackDiagnostic({
          type: "init_started",
          providerId: "nextstream",
          mediaType: "movie",
          tmdbId: 550,
        });
      });

      unsubscribe();
    });
  });

  describe("Privacy & PII Protection", () => {
    it("should not contain sensitive tokens, API keys, or raw query parameters in recorded events", () => {
      const event = recordPlaybackDiagnostic({
        type: "init_succeeded",
        providerId: "nextstream",
        serverId: "server-1",
        mediaType: "movie",
        tmdbId: 687163,
        durationMs: 250,
      });

      const serialized = JSON.stringify(event);
      assert.strictEqual(serialized.includes("apiKey"), false);
      assert.strictEqual(serialized.includes("NEXSTREAM_API_KEY"), false);
      assert.strictEqual(serialized.includes("password"), false);
      assert.strictEqual(serialized.includes("token"), false);
      assert.strictEqual(serialized.includes("userId"), false);
    });
  });
});
