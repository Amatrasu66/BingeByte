# BingeByte

> A cinematic movie, television, anime, and entertainment discovery platform with initial streaming integration and Progressive Web App support.

---

## Overview

BingeByte is designed as a premium, art-directed entertainment discovery application. The user interface prioritizes high-fidelity cinematic imagery over excessive decoration, built upon a dedicated charcoal-purple surface foundation and refined Geist typography.

The application is structured for phased, incremental development:
- **Phase 1: Project Foundation** (Complete)
- **Phase 2: Design System & Tokens** (Complete)
- **Phase 3: TMDB Metadata Integration** (Complete)
- **Phase 4: Homepage & Discovery** (Complete)
- **Phase 5: Search & Advanced Filtering** (Complete)
- **Phase 6: Detail Pages (Movies, TV, Anime)** (Complete)
- **Phase 7: Playback Provider Integration** (Complete)
- **Phase 8: Playback Provider Adapter and Integration (NexStream)** (Complete)
- **Phase 9: Supabase Foundation (Optional Persistence)**
- **Phase 10: Progressive Web App (PWA)**
- **Phase 11: Quality Assurance & Optimization**
- **Phase 12: Deployment**

---

## Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Icons**: [Lucide React](https://lucide.dev/)
- **Typography**: [Geist](https://vercel.com/font) via `next/font/google`
- **Metadata Provider**: [The Movie Database (TMDB) API](https://developer.themoviedb.org/)
- **Testing**: Built-in `node:test` and `node:assert` via `tsx`
- **Linting**: [ESLint](https://eslint.org/)

---

## Visual Identity & Design Foundation

The authoritative source of truth for the visual system is [`design/design.md`](./design/design.md).

- **Wordmark**: `BingeByte` (text-only, refined typography, no standalone icon)
- **Primary Typeface**: Geist
- **Color Tokens**:
  - Main Background: `#151319`
  - Elevated Surface: `#1B1820`
  - Deep Surface: `#100F13`
  - Primary Text: `#F5F3F7`
  - Secondary Text: `#AAA5B2`
  - Subtle Borders: `#302B36`
  - White (High-Contrast): `#FFFFFF`

---

## TMDB Metadata Integration (Phase 3)

The application incorporates a server-only data layer for retrieving entertainment metadata from TMDB.

### Architecture (`src/lib/tmdb/`)

- [`client.ts`](./src/lib/tmdb/client.ts): Server-only HTTP client. Handles request timeouts (default 8s), typed errors (`TMDBAuthError`, `TMDBNotFoundError`, `TMDBRateLimitError`, `TMDBTimeoutError`), and secure Bearer token attachment.
- [`config.ts`](./src/lib/tmdb/config.ts): Base URLs, default language (`en-US`), image sizes, and Next.js revalidation intervals.
- [`types.ts`](./src/lib/tmdb/types.ts): Raw TMDB API response structures and normalized application interfaces (`NormalizedMedia`, `NormalizedMovieDetails`, `NormalizedTVDetails`, `PaginatedResult<T>`).
- [`images.ts`](./src/lib/tmdb/images.ts): URL builders for posters, backdrops, cast profiles, and episode stills with null safety.
- [`normalizers.ts`](./src/lib/tmdb/normalizers.ts): Transforms raw movie and TV structures into a unified media schema, mapping title/name, release dates, and ratings.
- [`movies.ts`](./src/lib/tmdb/movies.ts): Operations for trending, popular, top-rated, now playing, upcoming, movie details, credits, similar, recommendations, and genres.
- [`tv.ts`](./src/lib/tmdb/tv.ts): Operations for trending, popular, top-rated, TV details, season details, episode listings, credits, and genres.
- [`search.ts`](./src/lib/tmdb/search.ts): Input-validated movie, TV, and multi-search operations. Filters unsupported result types (e.g. people) from multi-search.
- [`trending.ts`](./src/lib/tmdb/trending.ts): Unified trending query across both movies and TV series.

### Caching and Revalidation Strategy

- **Static Metadata (Genres)**: Revalidated every 24 hours (`86,400s`).
- **Detail Pages (Movies & TV Series)**: Revalidated every 1 hour (`3,600s`).
- **Dynamic Content (Trending, Popular, Now Playing)**: Revalidated every 30 minutes (`1,800s`).
- **Search Queries**: Uncached (`revalidate: 0`).

### Authentication & Environment Setup

1. Create a free account at [The Movie Database (TMDB)](https://www.themoviedb.org/).
2. Request an API key in your TMDB account settings under **API**.
3. Copy the **API Read Access Token** (v4 auth).
4. Create `.env.local` from the template:
   ```bash
   cp .env.example .env.local
   ```
5. Set your token in `.env.local`:
   ```env
   TMDB_API_READ_ACCESS_TOKEN=your_v4_read_access_token_here
   ```
   *(Alternatively, `TMDB_API_KEY` may be configured as a fallback).*

> **Security Note:** TMDB credentials remain strictly server-side (`server-only`). They are never exposed in client bundles, public environment variables, or error responses.

### Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. BingeByte utilizes TMDB exclusively for catalog metadata and artwork; it does not host, stream, or claim distribution rights to any video content.

---

## Search & Advanced Filtering (Phase 5)

Phase 5 elevates BingeByte's search and discovery into an interactive, URL-driven entertainment discovery platform.

### Unified Search (`/search`)

- **Multi-Mode Discovery**: Search across all supported titles simultaneously (`all`), or filter specifically to `movie` or `tv`.
- **URL Synchronization**: Query (`q`), content type (`type`), and page (`page`) are stored in the URL for shareable, bookmarkable search results (e.g. `/search?q=dune&type=movie&page=2`).
- **Input Trimming & Empty Prevention**: Whitespace queries are trimmed before submission, preventing redundant API roundtrips.
- **Safe Error Display**: Upstream network traces, credentials, and internal URLs are sanitized into user-friendly messages via `getSafeErrorMessage`.

### Dedicated Discovery Pages

1. **Movies (`/movies`)**: Full motion-picture discovery powered by TMDB `/discover/movie`.
2. **TV Series (`/tv`)**: Serialized television discovery powered by TMDB `/discover/tv`.
3. **Anime (`/anime`)**: Curated Japanese animated series discovery utilizing TMDB Animation genre (`16`) and Japanese audio origin (`ja`).

> **Anime Classification Note:** TMDB does not feature a dedicated native anime schema. BingeByte curates this catalog by combining the official Animation genre (`16`) with Japanese audio language (`ja`), offering secondary genre and year filtering while transparently communicating this metadata-based approximation.

### Supported Filter Model & URL Conventions

| Parameter | Type / Format | Purpose | Example |
| :--- | :--- | :--- | :--- |
| `genre` | Positive Integer | Filters by official TMDB genre ID | `genre=28` (Action) |
| `yearFrom` | 4-Digit Year (1888–Future) | Earliest release / first-air year | `yearFrom=2015` |
| `yearTo` | 4-Digit Year (1888–Future) | Latest release / first-air year | `yearTo=2024` |
| `rating` | Float (0–10) | Minimum audience vote threshold | `rating=7.5` |
| `language` | 2-Letter ISO 639-1 | Filter by original production language | `language=ja` |
| `sort` | Allowlisted Enum | Discover ordering strategy | `sort=vote_average.desc` |
| `page` | Integer (1–500) | Catalog page number (bounded to TMDB cap) | `page=2` |

**Allowed Sort Options:**
- `popularity.desc` (Most Popular — Default)
- `popularity.asc` (Least Popular)
- `vote_average.desc` (Highest Rated)
- `vote_average.asc` (Lowest Rated)
- `release_date.desc` (Newest First)
- `release_date.asc` (Oldest First)

**Example Shareable Filter URL:**
```
/movies?genre=878&yearFrom=2010&yearTo=2024&rating=8&sort=vote_average.desc&page=1
```

---

## Project Structure

```
├── .agents/              # Antigravity agent configuration and Taste Skill
├── design/
│   └── design.md         # Authoritative visual identity & design guide
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (layout, page, globals.css)
│   ├── components/       # Reusable UI & layout components
│   │   ├── layout/       # AppHeader, AppFooter, AppShell, MainContainer
│   │   ├── media/        # MediaCard, MediaCardSkeleton
│   │   ├── navigation/   # PrimaryNavigation, MobileNavigation
│   │   └── ui/           # Button, IconButton, Separator, Skeleton
│   ├── config/           # Site-wide configuration and metadata
│   └── lib/              # Core utilities and TMDB integration
│       ├── tmdb/         # Client, config, types, normalizers, movies, tv, search
│       └── utils.ts      # Class merging helper (cn)
├── .env.example          # Documented environment variable template
├── .gitignore            # Git exclusion rules (dependencies, build, secrets)
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration (with image.tmdb.org allowed)
├── package.json          # Project scripts and dependencies
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

---

---

## Playback & Streaming Integration (Phase 9)

Phase 9 repairs the streaming integration and cleans up all unwanted external directory integrations. BingeByte connects directly to the configured **NextStream by CodeSpecter** API using a secure server-side resolution model, removing the obsolete artificial authorization verification screen and eliminating JustWatch and third-party streaming listings entirely.

### Watch Route (`/watch`) & URL Conventions

The dedicated `/watch` route accepts strictly validated search parameters:
- `type`: `movie` | `tv` (required, validated enum)
- `id`: Positive integer TMDB media identifier (required)
- `season`: Non-negative integer (e.g., `1`, `0` for specials) for TV shows (defaults to `1`)
- `episode`: Positive integer for TV episodes (defaults to `1`)

**URL Examples:**
- **Movie Playback**: `/watch?type=movie&id=550`
- **TV Series Episode Playback**: `/watch?type=tv&id=1399&season=1&episode=1`
- **TV Specials / Season 0**: `/watch?type=tv&id=1399&season=0&episode=1`

### NextStream Server-Side Architecture (`src/lib/playback/`)

- [`types.ts`](./src/lib/playback/types.ts): Typed provider abstraction.
  - `PlaybackProvider`: Standardized contract for asynchronous playback resolution (`resolvePlayback`, `getMovieEmbedUrl`, `getTVEmbedUrl`).
  - `PlaybackTarget`: Discriminated union for movie targets vs. television season/episode targets.
  - `PlaybackEmbedResult`: Discriminated result type (`ready`, `unavailable`, `unconfigured`, `auth_error`, `api_error`, `invalid_input`).
- [`nexstream.ts`](./src/lib/playback/nexstream.ts): Server-side NextStream provider implementation.
  - Server endpoints: `GET /api/movie/{tmdbId}?apikey={KEY}` and `GET /api/tv/{tmdbId}/{season}/{episode}?apikey={KEY}`.
  - Resolves verified clean playable sources (`embedmaster.link`) on the server.
  - Keeps `NEXSTREAM_API_KEY` 100% server-side; the secret never appears in client bundles, URLs, HTML, or frontend network calls.
  - Strictly validates positive integer IDs, non-negative season numbers, and positive episode numbers.
  - Sanitizes and validates the base URL against approved protocols with bounded 8-second request timeouts.
- [`index.ts`](./src/lib/playback/index.ts): Barrel export and `getDefaultPlaybackProvider()` factory.

### Removal of Artificial Gate & JustWatch

- **Artificial Authorization Gate Removed**: The obsolete "Provider Authorization Verification Required" screen that unconditionally blocked playback has been completely removed. Genuine provider responses now drive player state directly.
- **JustWatch & External Directories Removed**: All JustWatch links, logos, availability queries, and external streaming provider badges have been eradicated. BingeByte provides a self-contained cinematic playback and discovery experience.
- **Responsive 16:9 Player (`EmbedPlayer`)**: Loaded in an isolated iframe with secure sandbox attributes (`sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"`), loading spinner, and graceful retry overlay.
- **Dual-Mode Container (`PlaybackContainer`)**: Defaults to the active stream player ("Watch Stream") with instant switching to the official YouTube trailer preview ("Official Trailer") when available.

### TV Season and Episode Navigation

- Embedded on both the TV detail page and the `/watch` TV route.
- Allows browsing all seasons (including specials) and viewing episode stills, titles, runtimes, and overviews.
- In-memory client caching avoids duplicate network requests when switching between seasons.
- Deep-links directly into any season and episode playback route.

### Environment Configuration

```env
# NextStream / Playback Provider Configuration
NEXSTREAM_BASE_URL=https://api.codespecters.com
NEXSTREAM_API_KEY=your_nexstream_api_key
```

> **Security Note:** Provider API keys are never printed, logged, or exposed in error messages, client bundles, or frontend requests. All upstream provider calls execute exclusively on the server.

---

## Getting Started

### Prerequisites

- Node.js 20+ (recommended: Node 22+)
- npm 10+

### Installation

```bash
npm install
```

### Running Tests

Execute the comprehensive test suite:

```bash
npm test
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification Commands

```bash
# Unit & integration tests
npm test

# Type check
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```
