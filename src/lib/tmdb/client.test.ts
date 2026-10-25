import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import {
  tmdbFetch,
  TMDBConfigError,
  TMDBAuthError,
  TMDBNotFoundError,
  TMDBRateLimitError,
  TMDBTimeoutError,
  TMDBError,
} from "./client";

describe("TMDB Client & HTTP Fetcher", () => {
  const originalEnv = process.env;
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TMDB_API_READ_ACCESS_TOKEN;
    delete process.env.TMDB_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    globalThis.fetch = originalFetch;
  });

  it("should throw TMDBConfigError when no token or API key is configured", async () => {
    await assert.rejects(
      async () => {
        await tmdbFetch("/movie/popular");
      },
      (err: unknown) => {
        assert(err instanceof TMDBConfigError);
        assert.match(err.message, /TMDB API authentication is missing/);
        return true;
      }
    );
  });

  it("should attach Authorization Bearer header when TMDB_API_READ_ACCESS_TOKEN is set", async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = "test_bearer_token_123";

    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ success: true, page: 1, results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    const data = await tmdbFetch<{ success: boolean }>("/movie/popular", {
      params: { page: 2 },
    });

    assert.strictEqual(data.success, true);
    assert.strictEqual(capturedHeaders["Authorization"], "Bearer test_bearer_token_123");
    assert.match(capturedUrl, /language=en-US/);
    assert.match(capturedUrl, /page=2/);
    // When Bearer token is used, api_key parameter should not be appended
    assert.doesNotMatch(capturedUrl, /api_key=/);
  });

  it("should append api_key query param when only TMDB_API_KEY is configured", async () => {
    process.env.TMDB_API_KEY = "test_api_key_456";

    let capturedUrl = "";
    let capturedHeaders: Record<string, string> = {};

    globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedHeaders = (init?.headers as Record<string, string>) || {};
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await tmdbFetch("/genre/movie/list");

    assert.strictEqual(capturedHeaders["Authorization"], undefined);
    assert.match(capturedUrl, /api_key=test_api_key_456/);
  });

  it("should throw TMDBAuthError on HTTP 401 response", async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = "invalid_token";

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ status_code: 7, status_message: "Invalid API key" }),
        { status: 401, statusText: "Unauthorized" }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await tmdbFetch("/movie/popular");
      },
      (err: unknown) => {
        assert(err instanceof TMDBAuthError);
        assert.strictEqual(err.status, 401);
        return true;
      }
    );
  });

  it("should throw TMDBNotFoundError on HTTP 404 response", async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = "valid_token";

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ status_code: 34, status_message: "The resource you requested could not be found." }),
        { status: 404, statusText: "Not Found" }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await tmdbFetch("/movie/999999999");
      },
      (err: unknown) => {
        assert(err instanceof TMDBNotFoundError);
        assert.strictEqual(err.status, 404);
        return true;
      }
    );
  });

  it("should throw TMDBRateLimitError on HTTP 429 response and parse Retry-After", async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = "valid_token";

    globalThis.fetch = (async () => {
      const headers = new Headers();
      headers.set("Retry-After", "12");
      return new Response(
        JSON.stringify({ status_code: 25, status_message: "Your request count has exceeded the limit." }),
        { status: 429, statusText: "Too Many Requests", headers }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await tmdbFetch("/trending/all/day");
      },
      (err: unknown) => {
        assert(err instanceof TMDBRateLimitError);
        assert.strictEqual(err.status, 429);
        assert.strictEqual(err.retryAfter, 12);
        return true;
      }
    );
  });

  it("should throw TMDBError on HTTP 500 response", async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = "valid_token";

    globalThis.fetch = (async () => {
      return new Response(
        JSON.stringify({ status_code: 11, status_message: "Internal error." }),
        { status: 500, statusText: "Internal Server Error" }
      );
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await tmdbFetch("/movie/popular");
      },
      (err: unknown) => {
        assert(err instanceof TMDBError);
        assert.strictEqual(err.status, 500);
        return true;
      }
    );
  });

  it("should throw TMDBTimeoutError when request times out", async () => {
    process.env.TMDB_API_READ_ACCESS_TOKEN = "valid_token";

    globalThis.fetch = ((_: RequestInfo | URL, init?: RequestInit) => {
      return new Promise((_, reject) => {
        const signal = init?.signal;
        if (signal) {
          signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted");
            err.name = "AbortError";
            reject(err);
          });
        }
      });
    }) as typeof fetch;

    await assert.rejects(
      async () => {
        await tmdbFetch("/movie/popular", { timeoutMs: 50 });
      },
      (err: unknown) => {
        assert(err instanceof TMDBTimeoutError);
        return true;
      }
    );
  });
});
