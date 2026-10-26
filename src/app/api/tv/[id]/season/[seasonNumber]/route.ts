import { NextResponse } from "next/server";
import { getTVSeasonDetails, TMDBNotFoundError } from "@/lib/tmdb";

interface RouteParams {
  params: Promise<{
    id: string;
    seasonNumber: string;
  }>;
}

/**
 * Route handler for fetching TV season details on-demand.
 * Keeps TMDB credentials securely server-side while powering client-side season switching.
 */
export async function GET(
  _request: Request,
  context: RouteParams
): Promise<NextResponse> {
  try {
    const { id, seasonNumber } = await context.params;
    const tvId = parseInt(id, 10);
    const season = parseInt(seasonNumber, 10);

    if (isNaN(tvId) || isNaN(season) || tvId <= 0 || season < 0) {
      return NextResponse.json(
        { error: "Invalid TV show ID or season number." },
        { status: 400 }
      );
    }

    const data = await getTVSeasonDetails(tvId, season);
    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    if (error instanceof TMDBNotFoundError) {
      return NextResponse.json(
        { error: "Season details not found." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch season details." },
      { status: 500 }
    );
  }
}
