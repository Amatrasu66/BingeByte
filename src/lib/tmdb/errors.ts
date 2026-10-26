import {
  TMDBAuthError,
  TMDBConfigError,
  TMDBNotFoundError,
  TMDBRateLimitError,
  TMDBTimeoutError,
} from "./client";

/**
 * Returns a sanitized, user-friendly error message for display in the UI.
 * Prevents leakage of internal endpoints, authentication tokens, stack traces,
 * or raw upstream responses.
 */
export function getSafeErrorMessage(error: unknown): string {
  if (
    error instanceof TMDBConfigError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "TMDBConfigError")
  ) {
    return "The entertainment catalog configuration is currently unavailable. Please verify API credentials in your environment.";
  }

  if (
    error instanceof TMDBAuthError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "TMDBAuthError")
  ) {
    return "Authentication with the catalog provider could not be established. Please verify your credentials.";
  }

  if (
    error instanceof TMDBRateLimitError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "TMDBRateLimitError")
  ) {
    return "The entertainment service is experiencing elevated traffic. Please wait a moment and try again.";
  }

  if (
    error instanceof TMDBTimeoutError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "TMDBTimeoutError")
  ) {
    return "The request to the catalog service timed out. Please check your network connection and try again.";
  }

  if (
    error instanceof TMDBNotFoundError ||
    (typeof error === "object" && error !== null && "name" in error && error.name === "TMDBNotFoundError")
  ) {
    return "The requested entertainment title or list could not be located in the catalog.";
  }

  return "Unable to retrieve entertainment catalog results at this time. Please try again shortly.";
}
