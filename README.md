# BingeByte

> A cinematic movie, television, anime, and entertainment discovery platform with initial streaming integration and Progressive Web App support.

---

## Overview

BingeByte is designed as a premium, art-directed entertainment discovery application. The user interface prioritizes high-fidelity cinematic imagery over excessive decoration, built upon a dedicated charcoal-purple surface foundation and refined Geist typography.

The application is structured for phased, incremental development:
- **Phase 1: Project Foundation** (Current)
- **Phase 2: Design System & Tokens**
- **Phase 3: TMDB Metadata Integration**
- **Phase 4: Homepage & Discovery**
- **Phase 5: Search & Filtering**
- **Phase 6: Detail Pages (Movies, TV, Anime)**
- **Phase 7: Playback Provider Integration**
- **Phase 8: Supabase Foundation (Optional Persistence)**
- **Phase 9: Progressive Web App (PWA)**
- **Phase 10: Quality Assurance & Optimization**
- **Phase 11: Deployment**

---

## Tech Stack (Phase 1)

- **Framework**: [Next.js](https://nextjs.org/) (App Router, React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) v4
- **Typography**: [Geist](https://vercel.com/font) via `next/font/google`
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

## Project Structure

```
├── .agents/              # Antigravity agent configuration and Taste Skill
├── design/
│   └── design.md         # Authoritative visual identity & design guide
├── public/               # Static assets
├── src/
│   ├── app/              # Next.js App Router (layout, page, globals.css)
│   ├── config/           # Site-wide configuration and metadata
│   └── lib/              # Core utilities and helper functions
├── .env.example          # Documented environment variable template
├── .gitignore            # Git exclusion rules (dependencies, build, secrets)
├── eslint.config.mjs     # ESLint configuration
├── next.config.ts        # Next.js configuration
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

### Environment Variables

Copy the sample environment file:

```bash
cp .env.example .env.local
```

Configure provider credentials as respective phases are reached.

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Verification Commands

```bash
# Type check
npm run type-check

# Linting
npm run lint

# Production build
npm run build
```
