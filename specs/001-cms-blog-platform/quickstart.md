# Quickstart: CMS Blog Platform

**Branch:** `001-cms-blog-platform`
**Stack:** Next.js 15 · BlockNote · shadcn/ui · Tailwind CSS 4 · Supabase · Zod · Zustand · TanStack Query v5

---

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20+ |
| pnpm (or npm/yarn) | latest |
| Git | any |
| Supabase CLI | latest (Phase 2 only) |

---

## Phase 1 — Mock Data (No Backend Required)

### 1. Clone and install

```bash
git clone <repo-url>
cd cms-blog
git checkout 001-cms-blog-platform
pnpm install
```

### 2. Configure environment

Copy the example env file:

```bash
cp .env.example .env.local
```

Set these values in `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE="mock"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Blog CMS"

# Leave Supabase vars empty for Phase 1
NEXT_PUBLIC_SUPABASE_URL=""
NEXT_PUBLIC_SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""
```

### 3. Start the dev server

```bash
pnpm dev
```

App runs at **http://localhost:3000**.

### 4. Explore the mock data

The mock provider seeds the following on startup (no database required):

| Entity | Count | Notes |
|--------|-------|-------|
| Authors | 5 | 1 admin, 1 editor, 3 authors |
| Categories | 8 | Technology, Design, Engineering, Product, Business, Culture, Tutorial, News |
| Tags | 20+ | React, Next.js, TypeScript, CSS, AI, etc. |
| Posts | 25+ | 18 published, 5 draft, 2 archived |
| Media | 15+ | Placeholder images via Picsum |

Mock data lives in `lib/data/mock/fixtures/`.

### 5. Mock login credentials

Since Phase 1 uses mock auth, log in with any of these hardcoded accounts:

| Email | Role |
|-------|------|
| `admin@example.com` | Admin |
| `editor@example.com` | Editor |
| `author1@example.com` | Author |

Password: any non-empty string (mock auth always succeeds).

### 6. Key routes

| Route | Description |
|-------|-------------|
| `/` | Homepage |
| `/blog` | Post listing with pagination and filters |
| `/blog/[slug]` | Individual post page |
| `/category/[slug]` | Category archive |
| `/tag/[slug]` | Tag archive |
| `/author/[slug]` | Author profile |
| `/dashboard` | Admin overview |
| `/dashboard/posts` | Post management table |
| `/dashboard/posts/new` | Create post (block editor) |
| `/dashboard/posts/[id]/edit` | Edit post (block editor) |
| `/dashboard/media` | Media library |
| `/login` | Login page |

---

## Phase 2 — Supabase Integration

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Note your **Project URL** and **anon key** from Project Settings → API.

### 2. Install the Supabase CLI

```bash
pnpm add -g supabase
supabase login
```

### 3. Link your project

```bash
supabase link --project-ref <your-project-ref>
```

### 4. Run migrations

```bash
supabase db push
```

This applies all migrations in `supabase/migrations/` in order, creating:
- `profiles`, `posts`, `categories`, `tags`, `post_tags`, `media` tables
- `user_role` enum type
- Row Level Security policies
- `get_my_role()` helper function
- `posts_status_transition_check` trigger
- Storage buckets: `post-covers`, `post-content`, `avatars`

### 5. Configure environment for Supabase

Update `.env.local`:

```env
NEXT_PUBLIC_DATA_SOURCE="supabase"
NEXT_PUBLIC_SUPABASE_URL="https://<your-project-ref>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
NEXT_PUBLIC_SITE_NAME="Blog CMS"
REVALIDATE_SECRET="<generate-a-random-secret>"
```

> **Security:** Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser. It must only be used in server-side code (Route Handlers, Server Actions). It is not prefixed with `NEXT_PUBLIC_`.

### 6. Seed the database

```bash
pnpm tsx scripts/seed.ts
```

This migrates the mock fixtures into your Supabase database, including creating the initial admin user account.

### 7. Create the admin user in Supabase Auth

```bash
supabase auth admin create-user \
  --email admin@example.com \
  --password <your-password>
```

Or use the Supabase dashboard: Authentication → Users → Add User. The `profiles` table is populated automatically via a trigger on `auth.users` insert.

### 8. Start the dev server

```bash
pnpm dev
```

---

## Data Source Switching

Switch between mock and Supabase at any time by changing a single env var — no code changes required:

```env
NEXT_PUBLIC_DATA_SOURCE="mock"      # Phase 1: all data in memory, no DB
NEXT_PUBLIC_DATA_SOURCE="supabase"  # Phase 2+: live Supabase backend
```

The provider switch lives in `lib/data/index.ts`.

---

## Project Structure Reference

```
app/
├── (public)/           # Blog, category, tag, author pages (SSR/ISR)
├── (dashboard)/        # Protected admin pages (dynamic)
├── (auth)/             # Login, register
├── api/                # Route handlers
└── layout.tsx          # Root layout with providers

components/
├── ui/                 # shadcn/ui base components
├── editor/             # BlockNote editor wrapper + custom blocks
├── blog/               # PostCard, BlockRenderer, PostGrid
├── dashboard/          # DataTable, StatsCard, PostForm
└── shared/             # SiteHeader, SiteFooter, NavMenu

lib/
├── data/
│   ├── mock/           # Mock fixtures + MockDataProvider
│   ├── supabase/       # SupabaseDataProvider
│   ├── types.ts        # Shared TypeScript interfaces
│   └── index.ts        # Provider switch (getDataProvider())
├── store/              # Zustand stores (editor state, UI state)
├── supabase/           # Supabase client factory
├── utils/              # slug(), readingTime(), cn()
└── validations/        # Zod schemas (shared across client + server)

supabase/
├── migrations/         # SQL migration files (applied via supabase db push)
└── seed.sql            # Optional: static seed data
```

---

## Common Commands

```bash
# Development
pnpm dev                    # Start dev server (Turbopack)
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # ESLint
pnpm type-check             # TypeScript type check (tsc --noEmit)

# Supabase (Phase 2)
supabase start              # Start local Supabase stack (Docker)
supabase db push            # Apply migrations to linked project
supabase db reset           # Reset local DB and re-run migrations
supabase gen types typescript --linked > lib/supabase/database.types.ts

# Seeding
pnpm tsx scripts/seed.ts    # Seed mock data into Supabase
```

---

## Adding a New Block Type

1. Create the block spec in `components/editor/blocks/`:

   ```tsx
   // components/editor/blocks/DividerBlock.tsx
   import { createReactBlockSpec } from "@blocknote/react";

   export const DividerBlock = createReactBlockSpec(
     { type: "divider" as const, propSchema: {}, content: "none" },
     { render: () => <hr className="my-4 border-border" /> }
   );
   ```

2. Register it in the shared schema (`components/editor/schema.ts`):

   ```ts
   import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
   import { DividerBlock } from "./blocks/DividerBlock";

   export const schema = BlockNoteSchema.create({
     blockSpecs: { ...defaultBlockSpecs, divider: DividerBlock },
   });
   ```

3. Add it to the slash command menu in `components/editor/BlockEditor.tsx` via the `slashMenuItems` prop.

4. Handle it in `blocksToHTML()` rendering for public pages in `lib/data/render.ts`.

---

## Troubleshooting

### Editor not loading in dashboard
The block editor is loaded via `next/dynamic` with `{ ssr: false }`. Ensure the editor component file has `"use client"` at the top and is not accidentally imported in a Server Component.

### RLS blocking data access
Check the Supabase Table Editor → "RLS" tab to test policies as specific users. Temporarily disable RLS on a table (`ALTER TABLE posts DISABLE ROW LEVEL SECURITY;`) in local dev to confirm data exists.

### `cookies() was called outside a request scope`
This happens when `getDataProvider()` (Supabase path) is called in a context without a request. Ensure you call it inside a Server Component, Route Handler, or Server Action — never at module level or in a Client Component.

### BlockNote `transpilePackages` error
Add `@blocknote/react`, `@blocknote/core`, and `@blocknote/shadcn` (or `@blocknote/mantine`) to the `transpilePackages` array in `next.config.ts`.
