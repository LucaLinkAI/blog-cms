# Blog CMS

A full-stack blog platform built with Next.js 16 (App Router), Supabase, and BlockNote. Supports a public-facing blog with categories, tags, and author pages, plus a content dashboard for managing posts and media. Ships as a PWA with offline reading support via Serwist.

## Tech Stack

- **Framework**: Next.js 16 (App Router, Webpack build)
- **Database & Auth**: Supabase (Postgres + Row Level Security)
- **Editor**: BlockNote (rich-text block editor)
- **UI**: shadcn/ui, Tailwind CSS v4
- **PWA**: Serwist (service worker, offline caching, installable)
- **Deployment**: Vercel

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Set up environment variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_DATA_SOURCE` | `supabase` (production) or `mock` (local dev without DB) |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable key (`sb_publishable_...`) |
| `SUPABASE_SECRET_KEY` | Supabase secret key — server only, never expose to browser |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_SITE_NAME` | Site display name used in metadata and PWA manifest |
| `REVALIDATE_SECRET` | Secret for the `/api/revalidate` ISR endpoint |

### 3. Run the database migrations and seed data

```bash
pnpm db:setup
```

Or run steps individually:

```bash
pnpm db:migrate   # apply migrations
pnpm db:seed      # seed initial data
pnpm db:reset     # reset and re-seed
```

### 4. Start the development server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the public blog.
The dashboard is at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

> The service worker is **disabled in development** to avoid conflicts with hot reload. PWA features only activate in the production build.

## Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start dev server (Turbopack) |
| `pnpm build` | Production build (Webpack — required by Serwist) |
| `pnpm start` | Serve the production build locally |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Apply Supabase migrations |
| `pnpm db:seed` | Seed the database |
| `pnpm db:reset` | Reset and re-seed the database |
| `pnpm db:setup` | Migrate + seed in one step |
| `pnpm deploy` | Deploy preview to Vercel |
| `pnpm deploy:prod` | Deploy to production on Vercel |

## PWA

The app is installable and supports offline reading via [Serwist](https://github.com/serwist/serwist).

- **Manifest**: served at `/manifest.webmanifest` via `app/manifest.ts`
- **Service worker**: generated at `public/sw.js` during `pnpm build` (gitignored)
- **Caching strategy**: CacheFirst for static assets, StaleWhileRevalidate for pages, NetworkFirst for API routes
- **Icons**: replace `public/icons/icon-192x192.png` and `public/icons/icon-512x512.png` with your brand icons

> **Note**: The production build uses `next build --webpack` because Serwist requires Webpack. Development uses Turbopack via `next dev`.

## Deployment

The project is configured for Vercel. Environment variables and deployment are managed via the deploy script:

```bash
# Preview deployment (syncs .env.vercel → Vercel, then deploys)
pnpm deploy

# Production deployment
pnpm deploy:prod
```

Environment variables for Vercel are stored in `.env.vercel` (gitignored). See `scripts/deploy.sh` for details.

## Project Structure

```
app/
  (public)/          # Public blog pages (/, /blog, /category, /author, /tag)
  (dashboard)/       # CMS dashboard (/dashboard/*)
  api/               # API route handlers
  manifest.ts        # PWA web app manifest
  sw.ts              # Service worker (compiled to public/sw.js at build time)
components/
  blog/              # Public-facing blog components
  dashboard/         # Dashboard UI components
  editor/            # BlockNote editor and renderer
  ui/                # shadcn/ui primitives
lib/
  data/              # Data provider (Supabase + mock implementations)
  supabase/          # Supabase client helpers
  utils/             # SEO, slugify, reading time, etc.
public/
  icons/             # PWA icons (192×192, 512×512)
scripts/
  deploy.sh          # Vercel deploy script
  db-*.sh            # Database migration/seed scripts
```
