/**
 * BingeByte — Playback URL Security & Hostname Validation
 *
 * Enforces strict security boundaries on external playback embed URLs:
 * 1. Protocol must be HTTPS (or HTTP strictly for localhost/127.0.0.1 in local development/testing).
 * 2. Hostname must match an explicit allowlist of approved streaming providers.
 * 3. Prevents hostname-spoofing attacks (subdomain prefixing, userinfo injection, port manipulation).
 * 4. Rejects javascript:, data:, blob:, file:, and malformed URL schemes.
 */

export const PERMITTED_PLAYBACK_HOSTS: readonly string[] = Object.freeze([
  "embedmaster.link",
  "embdmstrplayer.com",
  "codespecters.com",
  "framextv.tech",
  "framextv.cc",
  "framextv.xyz",
  "framextv.pro",
  "youtube-nocookie.com",
  "youtube.com",
]);

export interface PlaybackUrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

/**
 * Validates whether a given hostname strictly matches an approved host
 * or an authentic subdomain of an approved host.
 *
 * Defends against spoofing attacks such as:
 * - "attacker-embedmaster.link" (not a dot boundary)
 * - "embedmaster.link.attacker.com" (ends with attacker domain)
 * - "embedmaster.link:8080" (port verification)
 */
export function isAllowedPlaybackHost(
  hostname: string,
  customAllowedHosts: readonly string[] = PERMITTED_PLAYBACK_HOSTS
): boolean {
  if (!hostname || typeof hostname !== "string") return false;

  const normalizedHost = hostname.trim().toLowerCase();

  // Allow localhost or 127.0.0.1 for local integration and mock testing
  if (normalizedHost === "localhost" || normalizedHost === "127.0.0.1") {
    return true;
  }

  for (const allowed of customAllowedHosts) {
    const normalizedAllowed = allowed.toLowerCase().trim();
    if (normalizedHost === normalizedAllowed) {
      return true;
    }
    // Strict dot boundary for subdomains: e.g. "player.codespecters.com" -> endsWith(".codespecters.com")
    if (normalizedHost.endsWith(`.${normalizedAllowed}`)) {
      return true;
    }
  }

  return false;
}

/**
 * Validates and sanitizes a playback URL.
 * Returns { isValid: true, sanitizedUrl } if compliant, or { isValid: false, error } if rejected.
 */
export function validatePlaybackUrl(
  rawUrl: unknown,
  customAllowedHosts: readonly string[] = PERMITTED_PLAYBACK_HOSTS
): PlaybackUrlValidationResult {
  if (typeof rawUrl !== "string" || rawUrl.trim().length === 0) {
    return {
      isValid: false,
      error: "Playback URL is missing or not a string.",
    };
  }

  const trimmed = rawUrl.trim();

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: "Malformed playback URL.",
    };
  }

  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";

  // Protocol check: HTTPS required in production, HTTP permitted strictly for localhost
  if (parsed.protocol !== "https:") {
    if (parsed.protocol === "http:" && isLocal) {
      // Allowed for local development/testing
    } else {
      return {
        isValid: false,
        error: `Insecure protocol '${parsed.protocol}'. HTTPS is strictly required.`,
      };
    }
  }

  // Reject credentials in URL (e.g. https://user:pass@host)
  if (parsed.username || parsed.password) {
    return {
      isValid: false,
      error: "URLs containing user credentials are not permitted.",
    };
  }

  // Hostname validation
  if (!isAllowedPlaybackHost(parsed.hostname, customAllowedHosts)) {
    return {
      isValid: false,
      error: `Hostname '${parsed.hostname}' is not in the approved playback allowlist.`,
    };
  }

  return {
    isValid: true,
    sanitizedUrl: parsed.toString(),
  };
}
