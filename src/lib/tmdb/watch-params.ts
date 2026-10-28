/**
 * Watch Route Parameter Validation
 * Validates query parameters for the /watch route according to strict TMDB domain rules.
 */

export interface ValidatedWatchParams {
  type: "movie" | "tv";
  id: number;
  season?: number;
  episode?: number;
  provider?: string;
}

export type WatchParamsValidationResult =
  | { success: true; data: ValidatedWatchParams }
  | { success: false; error: string };

/**
 * Parses and strictly validates query parameters for the /watch route.
 * Rejects missing, non-numeric, negative, or malformed values.
 */
export function parseWatchParams(
  params: Record<string, string | string[] | undefined> | URLSearchParams
): WatchParamsValidationResult {
  const getParam = (key: string): string | undefined => {
    if (params instanceof URLSearchParams) {
      return params.get(key) ?? undefined;
    }
    const val = params[key];
    return Array.isArray(val) ? val[0] : val;
  };

  const rawType = getParam("type")?.trim().toLowerCase();
  const rawId = getParam("id")?.trim();
  const rawSeason = getParam("season")?.trim();
  const rawEpisode = getParam("episode")?.trim();
  const rawProvider = getParam("provider")?.trim().toLowerCase();

  // Validate type: must be "movie" or "tv"
  if (!rawType) {
    return {
      success: false,
      error: "Missing media type parameter. Specify 'type=movie' or 'type=tv'.",
    };
  }
  if (rawType !== "movie" && rawType !== "tv") {
    return {
      success: false,
      error: `Invalid media type '${rawType}'. Permitted types are 'movie' and 'tv'.`,
    };
  }

  // Validate ID: strictly positive non-zero integer
  if (!rawId) {
    return {
      success: false,
      error: "Missing media ID parameter.",
    };
  }
  if (!/^\d+$/.test(rawId)) {
    return {
      success: false,
      error: "Invalid media ID format. Media ID must be a positive integer.",
    };
  }

  const id = parseInt(rawId, 10);
  if (isNaN(id) || id <= 0) {
    return {
      success: false,
      error: "Media ID must be a positive integer greater than zero.",
    };
  }

  // TV season and episode validation
  let season: number | undefined;
  let episode: number | undefined;

  if (rawType === "tv") {
    if (rawSeason !== undefined && rawSeason !== "") {
      if (!/^\d+$/.test(rawSeason)) {
        return {
          success: false,
          error: "Invalid season number. Season must be a non-negative integer.",
        };
      }
      season = parseInt(rawSeason, 10);
      if (isNaN(season) || season < 0) {
        return {
          success: false,
          error: "Season number must be a non-negative integer (0 for specials, 1+ for seasons).",
        };
      }
    } else {
      season = 1; // Default to Season 1
    }

    if (rawEpisode !== undefined && rawEpisode !== "") {
      if (!/^\d+$/.test(rawEpisode)) {
        return {
          success: false,
          error: "Invalid episode number. Episode must be a positive integer.",
        };
      }
      episode = parseInt(rawEpisode, 10);
      if (isNaN(episode) || episode < 1) {
        return {
          success: false,
          error: "Episode number must be an integer greater than or equal to 1.",
        };
      }
    } else {
      episode = 1; // Default to Episode 1
    }
  }

  return {
    success: true,
    data: {
      type: rawType,
      id,
      season,
      episode,
      ...(rawProvider ? { provider: rawProvider } : {}),
    },
  };
}
