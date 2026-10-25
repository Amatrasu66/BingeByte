# BingeByte

> A cinematic movie, television, anime, and entertainment discovery platform with initial streaming integration and Progressive Web App support.

---

## Overview

BingeByte is designed as a premium, art-directed entertainment discovery application. The user interface prioritizes high-fidelity cinematic imagery over excessive decoration, built upon a dedicated charcoal-purple surface foundation and refined Geist typography.

The application is structured for phased, incremental development:
- **Phase 1: Project Foundation** (Complete)
- **Phase 2: Design System & Tokens** (Complete)
- **Phase 3: TMDB Metadata Integration** (Current)
- **Phase 4: Homepage & Discovery**
- **Phase 5: Search & Filtering**
- **Phase 6: Detail Pages (Movies, TV, Anime)**
- **Phase 7: Playback Provider Integration**
- **Phase 8: Supabase Foundation (Optional Persistence)**
- **Phase 9: Progressive Web App (PWA)**
- **Phase 10: Quality Assurance & Optimization**
- **Phase 11: Deployment**

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
