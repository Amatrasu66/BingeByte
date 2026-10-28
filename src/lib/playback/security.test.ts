import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  isAllowedPlaybackHost,
  validatePlaybackUrl,
} from "./security";

describe("Playback URL Security & Validation", () => {
  describe("isAllowedPlaybackHost", () => {
    it("should accept approved hosts from the allowlist", () => {
      assert.strictEqual(isAllowedPlaybackHost("embedmaster.link"), true);
      assert.strictEqual(isAllowedPlaybackHost("embdmstrplayer.com"), true);
      assert.strictEqual(isAllowedPlaybackHost("codespecters.com"), true);
      assert.strictEqual(isAllowedPlaybackHost("framextv.tech"), true);
      assert.strictEqual(isAllowedPlaybackHost("framextv.cc"), true);
      assert.strictEqual(isAllowedPlaybackHost("framextv.xyz"), true);
      assert.strictEqual(isAllowedPlaybackHost("youtube-nocookie.com"), true);
    });

    it("should accept valid subdomains of approved hosts", () => {
      assert.strictEqual(isAllowedPlaybackHost("api.codespecters.com"), true);
      assert.strictEqual(isAllowedPlaybackHost("v2.embdmstrplayer.com"), true);
      assert.strictEqual(isAllowedPlaybackHost("player.framextv.tech"), true);
    });

    it("should accept localhost and 127.0.0.1 for local testing", () => {
      assert.strictEqual(isAllowedPlaybackHost("localhost"), true);
      assert.strictEqual(isAllowedPlaybackHost("127.0.0.1"), true);
    });

    it("should strictly reject hostname-spoofing attacks", () => {
      // Subdomain prefixing on attacker domain
      assert.strictEqual(isAllowedPlaybackHost("embedmaster.link.attacker.com"), false);
      assert.strictEqual(isAllowedPlaybackHost("framextv.tech.malicious.net"), false);

      // Dash prefixing / typo-squatting
      assert.strictEqual(isAllowedPlaybackHost("fake-embedmaster.link"), false);
      assert.strictEqual(isAllowedPlaybackHost("embedmaster.link-attacker.com"), false);

      // Random unauthorized domains
      assert.strictEqual(isAllowedPlaybackHost("evil.com"), false);
      assert.strictEqual(isAllowedPlaybackHost("streaming-rip.xyz"), false);
    });

    it("should reject empty, null, or malformed inputs", () => {
      assert.strictEqual(isAllowedPlaybackHost(""), false);
      assert.strictEqual(isAllowedPlaybackHost(null as unknown as string), false);
      assert.strictEqual(isAllowedPlaybackHost(undefined as unknown as string), false);
    });
  });

  describe("validatePlaybackUrl", () => {
    it("should validate and sanitize compliant HTTPS URLs", () => {
      const res = validatePlaybackUrl("https://embedmaster.link/movie/550");
      assert.strictEqual(res.isValid, true);
      assert.strictEqual(res.sanitizedUrl, "https://embedmaster.link/movie/550");
      assert.strictEqual(res.error, undefined);
    });

    it("should reject non-HTTPS protocols in production", () => {
      const httpRes = validatePlaybackUrl("http://embedmaster.link/movie/550");
      assert.strictEqual(httpRes.isValid, false);
      assert.match(httpRes.error || "", /HTTPS is strictly required/i);

      const jsRes = validatePlaybackUrl("javascript:alert(1)");
      assert.strictEqual(jsRes.isValid, false);

      const dataRes = validatePlaybackUrl("data:text/html,<h1>Hacked</h1>");
      assert.strictEqual(dataRes.isValid, false);
    });

    it("should allow HTTP strictly for localhost/127.0.0.1 test fixtures", () => {
      const localRes = validatePlaybackUrl("http://localhost:3000/embed/550");
      assert.strictEqual(localRes.isValid, true);
      assert.strictEqual(localRes.sanitizedUrl, "http://localhost:3000/embed/550");
    });

    it("should reject URLs containing embedded credentials", () => {
      const credsRes = validatePlaybackUrl("https://admin:secret@codespecters.com/movie/550");
      assert.strictEqual(credsRes.isValid, false);
      assert.match(credsRes.error || "", /user credentials are not permitted/i);
    });

    it("should reject unauthorized hosts", () => {
      const res = validatePlaybackUrl("https://unapproved-streamer.com/embed/123");
      assert.strictEqual(res.isValid, false);
      assert.match(res.error || "", /not in the approved playback allowlist/i);
    });

    it("should reject malformed or non-string inputs", () => {
      assert.strictEqual(validatePlaybackUrl("").isValid, false);
      assert.strictEqual(validatePlaybackUrl("not a url").isValid, false);
      assert.strictEqual(validatePlaybackUrl(null).isValid, false);
      assert.strictEqual(validatePlaybackUrl(undefined).isValid, false);
    });
  });
});
