import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  createPlaybackSession,
  PlaybackResolutionCoordinator,
  PlaybackSession,
} from "./lifecycle";

// Minimal DOM mock for Node.js test environment
class MockHTMLElement {
  public tagName: string;
  public children: MockHTMLElement[] = [];
  public parentNode: MockHTMLElement | null = null;
  public dataset: Record<string, string> = {};
  public src = "";
  public title = "";
  public allow = "";
  public allowFullscreen = false;
  public loading = "";
  public referrerPolicy = "";
  public className = "";
  public eventListeners: Record<string, ((...args: unknown[]) => void)[]> = {};

  constructor(tagName: string) {
    this.tagName = tagName.toUpperCase();
  }

  public appendChild(child: MockHTMLElement): MockHTMLElement {
    child.parentNode = this;
    this.children.push(child);
    return child;
  }

  public removeChild(child: MockHTMLElement): MockHTMLElement {
    const idx = this.children.indexOf(child);
    if (idx >= 0) {
      this.children.splice(idx, 1);
      child.parentNode = null;
    }
    return child;
  }

  public remove(): void {
    if (this.parentNode) {
      this.parentNode.removeChild(this);
    }
  }

  public addEventListener(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(handler);
  }

  public removeEventListener(event: string, handler: (...args: unknown[]) => void): void {
    if (this.eventListeners[event]) {
      this.eventListeners[event] = this.eventListeners[event].filter((h) => h !== handler);
    }
  }

  public dispatchEvent(event: string): void {
    const handlers = this.eventListeners[event] || [];
    for (const handler of handlers) {
      handler();
    }
  }
}

describe("Phase 14B Playback Lifecycle & Navigation Repair", () => {
  let mockContainer: MockHTMLElement;

  beforeEach(() => {
    mockContainer = new MockHTMLElement("div");
    // Ensure document.createElement uses our mock in Node environment
    (globalThis as unknown as { document: { createElement: (tag: string) => MockHTMLElement } }).document = {
      createElement: (tag: string) => new MockHTMLElement(tag),
    };
  });

  describe("Playback Session Creation & Mounting", () => {
    it("should mount iframe with correct security attributes and stream URL", () => {
      let loaded = false;
      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/687163",
        title: "Test Movie",
        onLoad: () => {
          loaded = true;
        },
      });

      assert.strictEqual(session.isActive, true);
      assert.strictEqual(session.streamUrl, "https://embedmaster.link/movie/687163");
      assert.strictEqual(mockContainer.children.length, 1);

      const iframe = mockContainer.children[0];
      assert.strictEqual(iframe.tagName, "IFRAME");
      assert.strictEqual(iframe.src, "https://embedmaster.link/movie/687163");
      assert.strictEqual(iframe.title, "Test Movie - Video Player");
      assert.match(iframe.allow, /autoplay.*fullscreen/);
      assert.strictEqual(iframe.allowFullscreen, true);
      assert.strictEqual(iframe.referrerPolicy, "origin");

      // Verify onLoad callback dispatch
      iframe.dispatchEvent("load");
      assert.strictEqual(loaded, true);

      session.dispose();
    });
  });

  describe("Prompt Playback Disposal on Navigation Away", () => {
    it("should set iframe src to about:blank and remove DOM node when navigating away to Home (/)", () => {
      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/687163",
        title: "Test Movie",
      });

      const iframe = mockContainer.children[0];
      assert.strictEqual(mockContainer.children.length, 1);
      assert.strictEqual(session.isActive, true);

      // Simulate user navigating to Home (/)
      const currentRoute: string = "/";
      if (currentRoute !== "/watch") {
        session.dispose();
      }

      assert.strictEqual(session.isActive, false);
      // Verify audio/media termination via about:blank
      assert.strictEqual(iframe.src, "about:blank");
      // Verify complete DOM node detachment
      assert.strictEqual(mockContainer.children.length, 0);
      assert.strictEqual(iframe.parentNode, null);
    });

    it("should stop playback when navigating away to Search (/search)", () => {
      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/687163",
        title: "Test Movie",
      });

      const iframe = mockContainer.children[0];

      // Simulate user navigating to /search
      const currentRoute: string = "/search";
      if (currentRoute !== "/watch") {
        session.dispose();
      }

      assert.strictEqual(session.isActive, false);
      assert.strictEqual(iframe.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);
    });

    it("should stop playback when navigating away to Movies (/movies) or TV (/tv)", () => {
      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/tv/1399/1/1",
        title: "Game of Thrones",
      });

      const iframe = mockContainer.children[0];

      // Navigate to /movies
      session.dispose();

      assert.strictEqual(session.isActive, false);
      assert.strictEqual(iframe.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);
    });

    it("should be idempotent and tolerate double disposal safely", () => {
      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/687163",
        title: "Test Movie",
      });

      session.dispose();
      assert.doesNotThrow(() => {
        session.dispose();
      });
      assert.strictEqual(session.isActive, false);
    });
  });

  describe("Direct Watch-to-Watch Route & Episode Switching", () => {
    it("should dispose previous playback session when switching from Movie A to Movie B", () => {
      // 1. Initial movie session
      const sessionA = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/550",
        title: "Fight Club",
      });
      const iframeA = mockContainer.children[0];
      assert.strictEqual(iframeA.src, "https://embedmaster.link/movie/550");

      // 2. User switches to Movie B
      sessionA.dispose();
      assert.strictEqual(iframeA.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);

      // 3. Mount Movie B session
      const sessionB = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/687163",
        title: "Oppenheimer",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      const iframeB = mockContainer.children[0];
      assert.strictEqual(iframeB.src, "https://embedmaster.link/movie/687163");
      assert.notStrictEqual(iframeA, iframeB);

      sessionB.dispose();
    });

    it("should dispose previous session when navigating between TV episodes (S1E1 -> S1E2)", () => {
      const ep1Session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/tv/1399/1/1",
        title: "Game of Thrones S1:E1",
      });
      const iframe1 = mockContainer.children[0];

      // User selects Episode 2
      ep1Session.dispose();
      assert.strictEqual(iframe1.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);

      const ep2Session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/tv/1399/1/2",
        title: "Game of Thrones S1:E2",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      const iframe2 = mockContainer.children[0];
      assert.strictEqual(iframe2.src, "https://embedmaster.link/tv/1399/1/2");

      ep2Session.dispose();
    });

    it("should dispose old provider session when switching providers without breaking newly selected provider", () => {
      // 1. Provider 1 (NexStream)
      const nexstreamSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/550",
        title: "Fight Club",
      });
      const iframe1 = mockContainer.children[0];

      // 2. Switch to Provider 2 (FrameXTV)
      nexstreamSession.dispose();
      assert.strictEqual(iframe1.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);

      const framextvSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.xyz/embed/550",
        title: "Fight Club",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      const iframe2 = mockContainer.children[0];
      assert.strictEqual(iframe2.src, "https://framextv.xyz/embed/550");
      assert.strictEqual(framextvSession.isActive, true);

      framextvSession.dispose();
    });

    it("should dispose previous iframe when switching FrameXTV extraction servers (Barbarian -> Archer)", () => {
      // 1. FrameXTV Server 1 (Barbarian)
      const barbarianSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.cc/embed/550?server=barbarian",
        title: "Fight Club",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      const barbarianIframe = mockContainer.children[0];
      assert.strictEqual(barbarianIframe.src, "https://framextv.cc/embed/550?server=barbarian");

      // 2. User selects Server 2 (Archer): dispose Barbarian
      barbarianSession.dispose();
      assert.strictEqual(barbarianIframe.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);

      // 3. Mount Server 2 (Archer)
      const archerSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.cc/embed/550?server=archer",
        title: "Fight Club",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      const archerIframe = mockContainer.children[0];
      assert.strictEqual(archerIframe.src, "https://framextv.cc/embed/550?server=archer");

      archerSession.dispose();
      assert.strictEqual(archerIframe.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);
    });

    it("should cleanly dispose on failed provider load without leaving lingering player or audio", () => {
      let errorTriggered = false;
      const failedSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.xyz/embed/invalid",
        title: "Broken Stream",
        onError: () => {
          errorTriggered = true;
        },
      });

      const iframe = mockContainer.children[0];
      iframe.dispatchEvent("error");
      assert.strictEqual(errorTriggered, true);

      // On error, session is disposed
      failedSession.dispose();
      assert.strictEqual(iframe.src, "about:blank");
      assert.strictEqual(mockContainer.children.length, 0);
      assert.strictEqual(failedSession.isActive, false);
    });
  });

  describe("Returning to Watch Page & StrictMode Simulation", () => {
    it("should start a fresh session with correct URL rather than reviving stale state when returning to /watch", () => {
      // 1. First visit
      const session1 = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/550",
        title: "Fight Club",
      });
      session1.dispose();

      // 2. Return to watch page
      const session2 = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/550",
        title: "Fight Club",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      assert.strictEqual(mockContainer.children[0].src, "https://embedmaster.link/movie/550");
      assert.strictEqual(session2.isActive, true);

      session2.dispose();
    });

    it("should cleanly survive StrictMode unmount-remount cycle without blanking out", () => {
      let activeSession: PlaybackSession | null = null;

      // Mount 1
      activeSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/550",
        title: "Fight Club",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      assert.strictEqual(mockContainer.children[0].src, "https://embedmaster.link/movie/550");

      // StrictMode Cleanup 1
      activeSession.dispose();
      assert.strictEqual(mockContainer.children.length, 0);

      // StrictMode Re-mount 2
      activeSession = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://embedmaster.link/movie/550",
        title: "Fight Club",
      });
      assert.strictEqual(mockContainer.children.length, 1);
      assert.strictEqual(mockContainer.children[0].src, "https://embedmaster.link/movie/550");
      assert.notStrictEqual(mockContainer.children[0].src, "about:blank");

      activeSession.dispose();
    });
  });

  describe("Asynchronous Resolution Request Coordination", () => {
    it("should abort in-flight requests and prevent stale responses from restoring player", async () => {
      const coordinator = new PlaybackResolutionCoordinator();

      // Request 1 dispatched
      const req1 = coordinator.startRequest();
      assert.strictEqual(req1.signal.aborted, false);
      assert.strictEqual(coordinator.isLatest(req1.requestId), true);

      // User navigates away before Request 1 resolves
      coordinator.abort();

      assert.strictEqual(req1.signal.aborted, true);
      assert.strictEqual(coordinator.isLatest(req1.requestId), false);

      // Delayed resolution response arrives after navigation
      let stateApplied = false;
      if (coordinator.isLatest(req1.requestId)) {
        stateApplied = true;
      }
      assert.strictEqual(stateApplied, false);
    });

    it("should invalidate older request when user switches providers rapidly", () => {
      const coordinator = new PlaybackResolutionCoordinator();

      const reqA = coordinator.startRequest();
      assert.strictEqual(coordinator.isLatest(reqA.requestId), true);

      // Rapidly switch to Provider B
      const reqB = coordinator.startRequest();

      assert.strictEqual(reqA.signal.aborted, true);
      assert.strictEqual(coordinator.isLatest(reqA.requestId), false);
      assert.strictEqual(coordinator.isLatest(reqB.requestId), true);

      // Out-of-order arrival: Provider A resolves after Provider B was clicked
      let providerAApplied = false;
      if (coordinator.isLatest(reqA.requestId)) {
        providerAApplied = true;
      }
      assert.strictEqual(providerAApplied, false);

      // Provider B resolves
      let providerBApplied = false;
      if (coordinator.isLatest(reqB.requestId)) {
        providerBApplied = true;
      }
      assert.strictEqual(providerBApplied, true);

      coordinator.abort();
    });

    it("should report hasActiveRequest accurately throughout resolution lifecycle", () => {
      const coordinator = new PlaybackResolutionCoordinator();
      assert.strictEqual(coordinator.hasActiveRequest(), false);

      coordinator.startRequest();
      assert.strictEqual(coordinator.hasActiveRequest(), true);

      coordinator.abort();
      assert.strictEqual(coordinator.hasActiveRequest(), false);
    });
  });

  describe("Phase 14D Playback Reliability & Bounded Initialization", () => {
    it("should trigger onTimeout when iframe loading exceeds bounded timeout window", async () => {
      let timedOut = false;
      let errored = false;

      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.cc/embed/550",
        title: "Timeout Test",
        timeoutMs: 40,
        providerId: "framextv",
        mediaType: "movie",
        tmdbId: 550,
        onTimeout: () => {
          timedOut = true;
        },
        onError: () => {
          errored = true;
        },
      });

      assert.strictEqual(timedOut, false);
      // Wait for timer to fire
      await new Promise((resolve) => setTimeout(resolve, 60));

      assert.strictEqual(timedOut, true);
      assert.strictEqual(errored, false);

      session.dispose();
    });

    it("should cancel timeout timer if iframe load event fires before timeout window", async () => {
      let timedOut = false;
      let loaded = false;

      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.cc/embed/550",
        title: "Load Precedence Test",
        timeoutMs: 80,
        providerId: "framextv",
        mediaType: "movie",
        tmdbId: 550,
        onLoad: () => {
          loaded = true;
        },
        onTimeout: () => {
          timedOut = true;
        },
      });

      const iframe = mockContainer.children[0];
      // Dispatch load event quickly
      iframe.dispatchEvent("load");
      assert.strictEqual(loaded, true);

      // Wait beyond the original timeoutMs
      await new Promise((resolve) => setTimeout(resolve, 100));

      assert.strictEqual(timedOut, false);

      session.dispose();
    });

    it("should cancel timeout timer immediately when session is disposed", async () => {
      let timedOut = false;

      const session = createPlaybackSession({
        container: mockContainer as unknown as HTMLElement,
        streamUrl: "https://framextv.cc/embed/550",
        title: "Disposal Precedence Test",
        timeoutMs: 50,
        providerId: "framextv",
        mediaType: "movie",
        tmdbId: 550,
        onTimeout: () => {
          timedOut = true;
        },
      });

      // Dispose before timer fires
      session.dispose();

      // Wait beyond timeoutMs
      await new Promise((resolve) => setTimeout(resolve, 80));

      assert.strictEqual(timedOut, false);
      assert.strictEqual(session.isActive, false);
    });
  });
});
