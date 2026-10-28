import { NextRequest, NextResponse } from "next/server";
import { parseWatchParams } from "@/lib/tmdb/watch-params";
import {
  resolvePlaybackWithProvider,
  getAvailableProviderDescriptors,
} from "@/lib/playback";
import type { PlaybackTarget } from "@/lib/playback/types";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const validation = parseWatchParams(searchParams);

  if (!validation.success) {
    return NextResponse.json(
      {
        status: "invalid_input",
        reason: validation.error,
        providerId: "unknown",
        providerName: "Unknown",
      },
      { status: 400 }
    );
  }

  const { type, id, season = 1, episode = 1, provider } = validation.data;

  const target: PlaybackTarget =
    type === "movie"
      ? { mediaType: "movie", tmdbId: id }
      : { mediaType: "tv", tmdbId: id, season, episode };

  const result = await resolvePlaybackWithProvider(target, provider);
  const availableProviders = getAvailableProviderDescriptors();

  return NextResponse.json(
    {
      result,
      availableProviders,
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
      },
    }
  );
}
