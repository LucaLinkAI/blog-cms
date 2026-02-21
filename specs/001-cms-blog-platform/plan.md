# Implementation Plan: CMS Blog Platform

**Branch**: `001-cms-blog-platform` | **Date**: 2026-02-20 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-cms-blog-platform/spec.md`

---

## Summary

A full-stack, SEO-optimized CMS blog platform built with Next.js 15 App Router, a Notion-like BlockNote block editor, Supabase (PostgreSQL + Auth + Storage), and shadcn/ui. Delivered in two phases: Phase 1 uses a mock data provider to build the complete UI without a live database; Phase 2 swaps to the Supabase provider and adds authentication, RLS, and file uploads. All data access goes through a `DataProvider` interface keyed by `NEXT_PUBLIC_DATA_SOURCE`, so UI components require no changes between phases.

---

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js 20+
**Primary Dependencies**: Next.js 15 (App Router), BlockNote (`@blocknote/react` + `@blocknote/shadcn`), shadcn/ui, Tailwind CSS v4, Supabase (`@supabase/ssr`, `@supabase/supabase-js`), Zod, Zustand, TanStack Query v5
**Storage**: PostgreSQL via Supabase (Phase 2); in-memory TypeScript arrays (Phase 1 mock)
**Testing**: Vitest + Testing Library (unit/component); Playwright (E2E — Phase 3)
**Target Platform**: Web — Vercel (Edge Middleware + Node.js Runtime for route handlers)
**Project Type**: Web application (single Next.js 15 monorepo)
**Performance Goals**: LCP < 2.5s on public pages; search results < 1s; image upload acknowledgement < 5s
**Constraints**: WCAG 2.1 AA on all public pages; zero editor JS in public page bundles; service-role key never exposed client-side; Supabase RLS enforced at database level
**Scale/Scope**: Single-tenant; ~25 posts mock (Phase 1), ~100+ posts realistic (Phase 2); ~5 concurrent dashboard users

---

## Constitution Check

*The project constitution (`/.specify/memory/constitution.md`) is currently a placeholder template with no ratified principles. No constitution-level gates apply. This plan proceeds on standard engineering best practices.*

**Post-design re-check**: No violations. The design is a conventional Next.js 15 monorepo — no unnecessary complexity layers, no extra projects beyond the application itself, no patterns that conflict with YAGNI or simplicity principles.

---

## Project Structure

### Documentation (this feature)

```text
specs/001-cms-blog-platform/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/           ← Phase 1 output
│   ├── posts.md
│   ├── categories.md
│   ├── tags.md
│   ├── authors.md
│   ├── media.md
│   └── auth.md
└── tasks.md             ← Phase 2 output (/speckit.tasks — NOT created here)
```

### Source Code (repository root)

```text
app/
├── (public)/
│   ├── page.tsx                        # Homepage
│   ├── blog/
│   │   ├── page.tsx                    # Blog listing (paginated)
│   │   └── [slug]/
│   │       └── page.tsx                # Post detail
│   ├── category/
│   │   └── [slug]/page.tsx             # Category archive
│   ├── tag/
│   │   └── [slug]/page.tsx             # Tag archive
│   └── author/
│       └── [slug]/page.tsx             # Author profile
├── (dashboard)/
│   ├── layout.tsx                      # Auth guard layout
│   ├── dashboard/
│   │   ├── page.tsx                    # Overview
│   │   ├── posts/
│   │   │   ├── page.tsx                # Post management
│   │   │   ├── new/page.tsx            # Create post
│   │   │   └── [id]/edit/page.tsx      # Edit post
│   │   ├── media/page.tsx              # Media library
│   │   └── settings/page.tsx           # Settings (admin only)
├── (auth)/
│   ├── login/page.tsx
│   └── register/page.tsx               # Admin-managed; UI for invitation flow
├── api/
│   ├── posts/
│   │   ├── route.ts                    # GET list, POST create
│   │   └── [id]/route.ts               # GET, PATCH, DELETE
│   ├── categories/route.ts
│   ├── tags/route.ts
│   ├── authors/
│   │   ├── route.ts
│   │   └── [slug]/route.ts
│   ├── media/
│   │   ├── route.ts
│   │   └── upload/route.ts
│   ├── auth/
│   │   ├── login/route.ts
│   │   └── register/route.ts
│   └── revalidate/route.ts             # ISR on-demand revalidation
├── sitemap.ts                          # Auto-generated sitemap
├── robots.ts                           # robots.txt
└── layout.tsx                          # Root layout

components/
├── ui/                                 # shadcn/ui primitives
├── editor/
│   ├── BlockEditor.tsx                 # "use client" BlockNote editor
│   ├── BlockRenderer.tsx               # Server-side HTML renderer
│   └── blocks/                         # Custom block specs (Callout, Divider, Blockquote)
├── blog/
│   ├── PostCard.tsx
│   ├── PostGrid.tsx
│   ├── PostPagination.tsx
│   └── SearchBar.tsx
├── dashboard/
│   ├── PostTable.tsx
│   ├── PostForm.tsx
│   ├── MediaGrid.tsx
│   └── StatsCard.tsx
└── shared/
    ├── Navbar.tsx
    ├── Footer.tsx
    └── ThemeProvider.tsx

lib/
├── data/
│   ├── types.ts                        # DataProvider interface + all shared types
│   ├── index.ts                        # Provider switch (NEXT_PUBLIC_DATA_SOURCE)
│   ├── mock/
│   │   ├── data.ts                     # Static fixture arrays
│   │   └── provider.ts                 # MockDataProvider implementation
│   └── supabase/
│       └── provider.ts                 # SupabaseDataProvider implementation
├── supabase/
│   ├── server.ts                       # createServerClient (Server Components)
│   ├── client.ts                       # createBrowserClient (Client Components)
│   └── service.ts                      # supabaseAdmin (server-only, bypasses RLS)
├── cache-tags.ts                       # Centralized ISR cache tag strings
├── utils/
│   ├── slug.ts                         # slugify() + conflict detection
│   ├── reading-time.ts                 # calculateReadingTime()
│   └── seo.ts                          # generateMetadata() helpers
└── validations/
    ├── post.ts                         # Zod schemas for Post CRUD
    ├── category.ts
    ├── tag.ts
    └── media.ts

store/
├── editor.ts                           # Zustand: block editor draft state
└── ui.ts                               # Zustand: modal/sidebar/toolbar state

supabase/
├── migrations/
│   ├── 001_enums.sql
│   ├── 002_tables.sql
│   ├── 003_rls.sql
│   ├── 004_triggers.sql
│   └── 005_storage_buckets.sql
└── seed.ts                             # Mock → Supabase seeder

middleware.ts                           # Supabase session refresh + dashboard auth guard

public/
└── (static assets)
```

**Structure Decision**: Single Next.js 15 App Router application. Route groups `(public)`, `(dashboard)`, and `(auth)` separate layout concerns without affecting URL paths. All data access via `lib/data/index.ts` — no UI component imports a provider directly.

---

## Design Decisions

### D1: BlockNote over Tiptap

See `research.md §1`. BlockNote provides the full Notion-like UX out of the box. Three missing block types (Callout, Blockquote, Divider) added as custom React-component block specs. The `@blocknote/shadcn` adapter avoids shipping Mantine alongside the project's existing shadcn/ui dependency.

### D2: DataProvider Interface Pattern

A single `DataProvider` TypeScript interface in `lib/data/types.ts`. Two concrete implementations: `MockDataProvider` (Phase 1) and `SupabaseDataProvider` (Phase 2). Switched by `NEXT_PUBLIC_DATA_SOURCE` env var. No UI component ever imports from `lib/data/mock` or `lib/data/supabase` directly — only from `lib/data/index.ts`.

### D3: Role Storage — Profiles Table Lookup

See `research.md §2`. Role stored in `profiles.role` column, read by a `SECURITY DEFINER` helper function `get_my_role()`. Never stored in JWT claims. This ensures role changes are effective immediately (required by SC-007).

### D4: Status Transitions Enforced by Database Trigger

The `posts_status_transition_check` `BEFORE UPDATE` trigger enforces FR-013's transition matrix (including the hard block on `archived → published`). RLS enforces row ownership; the trigger enforces business logic. This prevents any application code path from bypassing the rules.

### D5: ISR with Fine-Grained Tag Invalidation

Public pages use `unstable_cache` with tags (`post:{slug}`, `posts`, `category:{slug}`, etc.). An `/api/revalidate` Route Handler accepts a `REVALIDATE_SECRET` header and calls `revalidateTag`/`revalidatePath` after post status changes. Sitemap is revalidated alongside every post publish/archive event.

### D6: Zero Editor JS on Public Pages

The `BlockEditor` component is loaded exclusively via `next/dynamic({ ssr: false })` on dashboard routes. Public blog pages call `blocksToHTML()` from `@blocknote/server-util` inside Server Components — no editor dependency reaches the client bundle.

---

## Phase Delivery Map

### Phase 1 — Frontend + Mock Data

**Goal**: Complete, navigable UI with realistic mock data. No backend required.

| Area | Key Deliverables |
|---|---|
| Foundation | Next.js 15 project, Tailwind v4, shadcn/ui, `lib/data` interface + mock provider |
| Public Blog | Homepage, blog listing + pagination, post detail, category/tag archive, author profile |
| Block Editor | BlockNote integration, all 12 block types (9 default + 3 custom), read-only public renderer |
| Dashboard | Post list + filters, post create/edit form, slug auto-gen, reading time, draft/publish/archive |
| SEO | `generateMetadata()` for all public pages, JSON-LD Article + Person, sitemap, robots.txt |
| Search | Keyword search against mock post titles/excerpts |
| Dark Mode | Class-based dark mode via shadcn/ui `ThemeProvider` |

### Phase 2 — Supabase Integration

**Goal**: Replace mock provider with live Supabase. Add auth, RLS, file uploads.

| Area | Key Deliverables |
|---|---|
| Database | Migrations (enums, tables, indexes), RLS policies, triggers, storage bucket config |
| Auth | Email+password login, middleware session refresh, dashboard auth guard |
| SupabaseProvider | All `DataProvider` methods implemented against Supabase client |
| Media | Supabase Storage upload from editor + cover image picker, media library |
| Seed Script | Populate Supabase with mock fixtures for staging/development |
| ISR Revalidation | `/api/revalidate` Route Handler wired to publish/archive actions |

### Phase 3 — Polish & Launch

| Area | Key Deliverables |
|---|---|
| Testing | Vitest unit tests for utils + Zod schemas; Playwright E2E for critical flows |
| Accessibility | Axe-core audit on all public pages; zero WCAG 2.1 AA critical violations |
| Performance | Lighthouse audit on public pages; LCP target < 2.5s confirmed |
| Security | OWASP review; confirm service-role key never in client bundle; CSP headers |
| Deploy | Vercel production deploy; env vars configured; custom domain |
