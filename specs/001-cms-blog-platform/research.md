# Research: CMS Blog Platform

**Feature**: CMS Blog Platform
**Branch**: `001-cms-blog-platform`
**Date**: 2026-02-20
**Scope**: Block editor selection, Supabase RLS policy design, Next.js 15 App Router patterns, DataProvider abstraction, ISR revalidation, Tailwind CSS v4

---

## Research Area 1: Block Editor — BlockNote vs Tiptap

### Decision

**Use BlockNote** with the `@blocknote/shadcn` adapter (to avoid shipping Mantine alongside the existing shadcn/ui dependency).

### Rationale

The project requirements explicitly call for a Notion-like block editor UX: slash commands, drag-to-reorder, floating toolbar, and a standard block vocabulary. BlockNote provides all of this out of the box.

- **Slash command menu**, **drag handle**, **block side menu**, and **floating formatting toolbar** ship with BlockNote at zero configuration cost. Building equivalent UX on raw Tiptap is 3–6 weeks of work before reaching feature parity.
- **9 of 12 required block types** are in BlockNote's default schema. The three missing ones (Blockquote, Callout, Divider) are trivially added as React-component custom block specs — a one-afternoon task each, not a week of ProseMirror schema work.
- **Server-side rendering without loading the editor**: BlockNote provides `blocksToHTML()` from `@blocknote/server-util` — a Node.js utility with no DOM dependency. Public blog pages call it in a Server Component to render stored JSON to HTML, with zero editor JS in the client bundle.
- **Next.js 15 compatibility**: Requires `transpilePackages: ["@blocknote/react", "@blocknote/core", "@blocknote/shadcn"]` in `next.config.ts`. A one-line fix.

### Alternatives Considered

- **Tiptap alone**: Achieves identical end-state but requires building the full UX shell from scratch. Justified only for highly custom IDE-like editors. Rejected.
- **Tiptap + Tiptap Pro (paid)**: Adds drag handle and collaboration but at $149/month minimum, still without slash menus or block side menus. Rejected.
- **Plate.js**: Legitimate alternative built on Slate.js. More complex setup. Worth reconsidering if BlockNote theming constraints become a blocker. Deferred.
- **Lexical (Meta)**: Very low level, no block UX out of the box. Rejected.

### Key Implementation Notes

1. **Next.js config (required)**:
   ```ts
   // next.config.ts
   transpilePackages: ["@blocknote/react", "@blocknote/core", "@blocknote/shadcn"]
   ```

2. **Editor only on admin routes via dynamic import**:
   ```tsx
   // app/(dashboard)/posts/[id]/edit/page.tsx (Server Component)
   const BlockEditor = dynamic(() => import("@/components/editor/BlockEditor"), { ssr: false })
   ```

3. **Server-side render on public pages (zero editor JS)**:
   ```tsx
   // app/(public)/blog/[slug]/page.tsx (Server Component)
   import { blocksToHTML } from "@blocknote/server-util"
   const html = await blocksToHTML({ document: post.content, schema })
   return <article dangerouslySetInnerHTML={{ __html: html }} />
   ```

4. **Custom blocks (Callout example)**:
   ```tsx
   export const CalloutBlock = createReactBlockSpec(
     { type: "callout", propSchema: { icon: { default: "💡" }, type: { default: "info" } }, content: "inline" },
     { render: ({ block, contentRef }) => <div className={`callout callout--${block.props.type}`}><span>{block.props.icon}</span><div ref={contentRef} /></div> }
   )
   ```

5. **Content stored as `Block[]` JSON array** in the `posts.content` JSONB column.

---

## Research Area 2: Supabase RLS for Multi-Role CMS

---

## Table of Contents

1. [Schema Baseline](#1-schema-baseline)
2. [Role Storage: JWT Claims vs Profiles Table Lookup](#2-role-storage-jwt-claims-vs-profiles-table-lookup)
3. [Helper Function: `get_my_role()`](#3-helper-function-get_my_role)
4. [RLS Policies: `profiles` Table](#4-rls-policies-profiles-table)
5. [RLS Policies: `posts` Table](#5-rls-policies-posts-table)
6. [RLS Policies: `media` Table](#6-rls-policies-media-table)
7. [Status Transition Enforcement](#7-status-transition-enforcement)
8. [Next.js Server Components and Route Handler Gotchas](#8-nextjs-server-components-and-route-handler-gotchas)
9. [Recommendation Summary](#9-recommendation-summary)

---

## 1. Schema Baseline

The policies below are written against this table structure. The exact DDL will be finalized in `data-model.md`; this section captures the assumptions that drive every policy.

```sql
-- Roles enum
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'author');

-- Post status enum
CREATE TYPE post_status AS ENUM ('draft', 'published', 'archived');

-- Profiles: one row per auth.users row
CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      user_role NOT NULL DEFAULT 'author',
  full_name text,
  bio       text,
  avatar_url text
);

-- Posts
CREATE TABLE posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       text NOT NULL,
  slug        text NOT NULL UNIQUE,
  content     jsonb,
  status      post_status NOT NULL DEFAULT 'draft',
  published_at timestamptz,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Media
CREATE TABLE media (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url         text NOT NULL,
  filename    text NOT NULL,
  file_type   text NOT NULL,
  file_size   int  NOT NULL,
  alt_text    text,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**Critical**: Every table must have RLS enabled before any policy takes effect. Without `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`, the table is unprotected.

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts    ENABLE ROW LEVEL SECURITY;
ALTER TABLE media    ENABLE ROW LEVEL SECURITY;
```

---

## 2. Role Storage: JWT Claims vs Profiles Table Lookup

This is the most consequential architectural decision for RLS. Both approaches work; they have different trade-offs.

### Option A — Query the `profiles` table inside each policy

Every policy that needs to know the user's role executes a subquery:

```sql
(SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
```

**How it works**: `auth.uid()` is a built-in Supabase function that returns the UUID of the authenticated user from the validated JWT. The subquery hits the `profiles` table on every RLS check.

**Advantages**:
- Role changes (e.g., admin promotes author to editor) take effect on the very next request — no token refresh required.
- No custom infrastructure needed; works out of the box.
- Simpler to reason about: the source of truth is always the database.

**Disadvantages**:
- Every policy evaluation that checks a role adds one extra `SELECT` against `profiles`. On a busy table with many rows being filtered, this multiplies. PostgreSQL is generally able to cache the result within a single query (via `STABLE` function semantics), but it is still a real cost.
- Can cause N+1 style database pressure under very high read throughput.

**When to choose this**: Almost all CMS-scale applications. Unless you have tens of thousands of concurrent users with very low latency SLAs, this cost is invisible. It is the right default for this platform.

---

### Option B — Store role in JWT custom claims

Supabase allows you to add arbitrary claims to the JWT via a database hook. The claim is then readable inside RLS policies as:

```sql
(auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
-- or, with a custom claim namespace:
(auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
```

Supabase strongly recommends `app_metadata` (server-controlled) rather than `user_metadata` (user-editable) for role claims.

**Setting up the claim via an Auth hook** (Supabase `auth.users` trigger approach):

```sql
-- Function that runs after every sign-in to inject the role into the JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims    jsonb;
  user_role user_role;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event ->> 'user_id')::uuid;

  claims := event -> 'claims';
  claims := jsonb_set(claims, '{app_metadata, role}', to_jsonb(user_role::text));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
```

This function must then be registered in the Supabase dashboard under **Authentication > Hooks > Custom Access Token**.

**Policy usage after claims are set**:

```sql
CREATE POLICY "admin_full_access"
  ON posts
  FOR ALL
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );
```

**Advantages**:
- Zero extra database round-trips per policy check — the role is already in the token.
- Consistent with how many larger platforms work (e.g., Auth0 RBAC).

**Disadvantages**:
- Role changes are NOT immediate. The old JWT remains valid until it expires (Supabase default: 1 hour). During that window, a demoted admin still has admin-level RLS access.
- Adds infrastructure complexity: the hook must be registered, tested, and kept in sync with any schema changes to the `profiles` table.
- If the hook fails or returns a malformed payload, sign-in breaks entirely.
- For a CMS where an admin changes a user's role and expects the effect to be immediate, this lag is a real UX problem.

**When to choose this**: High-throughput APIs where role-check latency matters more than instant role propagation (e.g., a public API serving millions of requests/second). Not the right fit for this CMS.

---

### Decision for This Project

**Use Option A: query the `profiles` table inside policies.**

Rationale from the spec:
- SC-007 requires zero permission leakage. With JWT claims, a newly demoted user retains old permissions for up to one hour — that is permission leakage by definition.
- FR-034 requires an admin to be able to change a user's role. Admins expect that change to be effective immediately.
- This is a CMS, not a high-frequency trading API. The subquery overhead is negligible at CMS-scale traffic.
- No additional Supabase hook infrastructure to manage, test, or debug.

To eliminate repeated subquery text and centralize the role-check logic, we use a helper SQL function (see next section).

---

## 3. Helper Function: `get_my_role()`

Centralizing the role lookup in one `SECURITY DEFINER` function has two benefits:
1. All policies share one definition — change the logic in one place.
2. PostgreSQL marks `STABLE` functions as safe to evaluate once per query and cache within a transaction, reducing repeated hits to the `profiles` table even when multiple policies check the role.

```sql
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;
```

**Why `SECURITY DEFINER`**: The `profiles` table has RLS enabled. Without `SECURITY DEFINER`, the function would run as the calling user, and that user's own RLS policies on `profiles` would apply — which could create circular dependencies. `SECURITY DEFINER` makes it run as the function owner (a superuser or the `postgres` role in Supabase), bypassing RLS for this single lookup, which is safe because we are only reading the role of the currently authenticated user.

**Why `SET search_path = public`**: Prevents schema injection attacks where a malicious user creates a `profiles` table in a different schema to intercept the lookup.

**Why `STABLE`**: Tells PostgreSQL the function returns the same value for the same inputs within a single query execution. This enables the planner to cache the result and avoid re-executing the subquery for each row in a large table scan.

---

## 4. RLS Policies: `profiles` Table

### Access rules from the spec

| Operation | Who can do it |
|-----------|---------------|
| SELECT (any profile) | Admin, Editor (need to view user list) |
| SELECT (own profile) | Author (can view own profile for editing) |
| SELECT (published author info) | Unauthenticated visitors (for public author pages) |
| UPDATE (any profile) | Admin (FR-034: can change any user's role) |
| UPDATE (own profile) | Author (FR-033: name, bio, avatar — but NOT role) |
| INSERT | System only (auto-created via trigger on `auth.users`) |
| DELETE | Admin only (or handle via auth.users cascade) |

### SQL policies

```sql
-- ============================================================
-- profiles: SELECT
-- ============================================================

-- Public read of basic profile data (needed for public author pages, FR-022)
-- Visitors (anon role) can read profiles to display author name/avatar on posts
CREATE POLICY "profiles_select_public"
  ON profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- NOTE: If you want to restrict what columns visitors can see (e.g., hide email),
-- do that at the API/view layer, or use a separate public view. RLS cannot
-- filter columns — only rows. Column-level restrictions require separate views
-- or Postgres column privileges.

-- ============================================================
-- profiles: UPDATE
-- ============================================================

-- Admin can update any profile (including role changes — FR-034)
CREATE POLICY "profiles_update_admin"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Author can update only their own profile, and CANNOT change their own role
-- The WITH CHECK clause rejects any UPDATE that would change the role column
CREATE POLICY "profiles_update_own"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    AND public.get_my_role() = 'author'
  )
  WITH CHECK (
    id = auth.uid()
    AND public.get_my_role() = 'author'
    -- Reject if the UPDATE is trying to change the role column
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );
-- IMPORTANT GOTCHA: The WITH CHECK sub-select here reads the current value of
-- role from the table (before the update). This prevents an author from
-- escalating their own privileges by passing a different role value.
-- If you prefer belt-and-suspenders, also add a column-level trigger
-- (see Status Transition Enforcement section for the pattern).

-- Editor has no UPDATE on profiles (view-only per FR-030)

-- ============================================================
-- profiles: INSERT
-- ============================================================

-- Profiles should be created automatically via a database trigger that fires
-- on INSERT into auth.users. No direct INSERT from application code should
-- be needed. Leave INSERT ungranted to all roles, or restrict to service_role.
-- Example trigger:
--
-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, role)
--   VALUES (NEW.id, 'author');  -- all new users start as author; admin promotes
--   RETURN NEW;
-- END;
-- $$;
--
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- profiles: DELETE
-- ============================================================

-- Cascade from auth.users handles physical deletion.
-- If you want explicit admin-driven deletion of a profile row:
CREATE POLICY "profiles_delete_admin"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');
```

---

## 5. RLS Policies: `posts` Table

### Access rules from the spec

| Operation | Admin | Editor | Author |
|-----------|-------|--------|--------|
| SELECT | All posts | All posts | Own posts only |
| INSERT | Yes | Yes | Yes (own author_id) |
| UPDATE | All posts, any status transition | All posts, any transition allowed to editor | Own posts only; status limited (see §7) |
| DELETE | All posts | All posts | Own posts only |

### SQL policies

```sql
-- ============================================================
-- posts: SELECT
-- ============================================================

-- Unauthenticated visitors: only published posts
CREATE POLICY "posts_select_public"
  ON posts
  FOR SELECT
  TO anon
  USING (status = 'published');

-- Admin and Editor: all posts regardless of status
CREATE POLICY "posts_select_admin_editor"
  ON posts
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() IN ('admin', 'editor')
  );

-- Author: only their own posts (any status — they need to see their own drafts)
CREATE POLICY "posts_select_author"
  ON posts
  FOR SELECT
  TO authenticated
  USING (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  );

-- ============================================================
-- posts: INSERT
-- ============================================================

-- All authenticated roles can create posts, BUT author_id must equal their own
-- UID. This prevents an author from impersonating another author by supplying
-- a different author_id.
CREATE POLICY "posts_insert_authenticated"
  ON posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- Admin and Editor can insert for any author_id (e.g., creating a post on
    -- behalf of another author — omit the author_id restriction for them)
    public.get_my_role() IN ('admin', 'editor')
    OR
    -- Authors can only insert rows where they are the author
    (public.get_my_role() = 'author' AND author_id = auth.uid())
  );

-- Note: INSERT policies only use WITH CHECK (not USING), because there is no
-- existing row to filter against — only the new row being inserted.

-- ============================================================
-- posts: UPDATE
-- ============================================================

-- Admin: update any post
CREATE POLICY "posts_update_admin"
  ON posts
  FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() = 'admin')
  WITH CHECK (public.get_my_role() = 'admin');

-- Editor: update any post
CREATE POLICY "posts_update_editor"
  ON posts
  FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() = 'editor')
  WITH CHECK (public.get_my_role() = 'editor');

-- Author: update only their own posts
-- Status transition enforcement (which transitions are allowed) is handled
-- by a separate trigger (see §7). At the RLS layer we only enforce row ownership.
CREATE POLICY "posts_update_author"
  ON posts
  FOR UPDATE
  TO authenticated
  USING (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  )
  WITH CHECK (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  );

-- ============================================================
-- posts: DELETE
-- ============================================================

-- Admin: delete any post
CREATE POLICY "posts_delete_admin"
  ON posts
  FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');

-- Editor: delete any post
CREATE POLICY "posts_delete_editor"
  ON posts
  FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'editor');

-- Author: delete only their own posts
CREATE POLICY "posts_delete_author"
  ON posts
  FOR DELETE
  TO authenticated
  USING (
    public.get_my_role() = 'author'
    AND author_id = auth.uid()
  );
```

### Policy interaction note

Supabase (PostgreSQL) applies `OR` logic across multiple permissive policies for the same table + command + role. When an authenticated user triggers a SELECT, PostgreSQL evaluates all `FOR SELECT` policies that match the `TO authenticated` role and returns any row that passes **at least one** policy. This is why it is safe to have separate policies for admin/editor and author — they do not conflict; they compose correctly.

---

## 6. RLS Policies: `media` Table

### Access rules from the spec (FR-035, FR-036, FR-037)

- All authenticated users can SELECT all media rows (shared library).
- All authenticated users can INSERT new media rows (uploading).
- Ownership is recorded for audit (`uploaded_by`) but does not restrict visibility.
- Unauthenticated visitors do NOT need to query the `media` table directly — public images are accessed by URL from Supabase Storage, not from this table. If you do expose public media metadata, restrict to `anon` SELECT as well.

### SQL policies

```sql
-- ============================================================
-- media: SELECT
-- ============================================================

-- All authenticated users can browse the full shared media library
CREATE POLICY "media_select_authenticated"
  ON media
  FOR SELECT
  TO authenticated
  USING (true);

-- Optionally expose media metadata to anonymous users if image URLs
-- are embedded in public post content (avoids 401 errors on metadata fetches):
-- CREATE POLICY "media_select_anon"
--   ON media
--   FOR SELECT
--   TO anon
--   USING (true);

-- ============================================================
-- media: INSERT
-- ============================================================

-- Any authenticated user can upload; uploaded_by must equal their own UID
CREATE POLICY "media_insert_authenticated"
  ON media
  FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================
-- media: UPDATE
-- ============================================================

-- Only admins and editors can update media metadata (e.g., alt text corrections)
-- Authors cannot edit media they did not upload (but can edit their own)
CREATE POLICY "media_update_admin_editor"
  ON media
  FOR UPDATE
  TO authenticated
  USING  (public.get_my_role() IN ('admin', 'editor'))
  WITH CHECK (public.get_my_role() IN ('admin', 'editor'));

CREATE POLICY "media_update_own"
  ON media
  FOR UPDATE
  TO authenticated
  USING  (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- ============================================================
-- media: DELETE
-- ============================================================

-- Only admin can delete media (prevents accidental deletion of shared assets)
CREATE POLICY "media_delete_admin"
  ON media
  FOR DELETE
  TO authenticated
  USING (public.get_my_role() = 'admin');
```

### Supabase Storage bucket policies

The `media` table tracks metadata, but the actual files live in a Supabase Storage bucket. Storage buckets have their own RLS-like policies configured in the Supabase dashboard or via SQL against `storage.objects`. These must mirror the table policies:

```sql
-- Allow any authenticated user to upload to the 'media' bucket
CREATE POLICY "storage_insert_authenticated"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'media');

-- Allow any authenticated user to view/download media objects
CREATE POLICY "storage_select_authenticated"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'media');

-- Allow anon to read from media bucket if images are embedded in public posts
CREATE POLICY "storage_select_anon"
  ON storage.objects
  FOR SELECT
  TO anon
  USING (bucket_id = 'media');
```

---

## 7. Status Transition Enforcement

The spec (FR-013) defines a strict transition matrix. RLS UPDATE policies grant row-level access but cannot intrinsically enforce the "which status values are allowed" rules. The right tool for this is a **`BEFORE UPDATE` trigger** that runs as `SECURITY DEFINER`, which means it can read `profiles` without circular RLS issues.

### Allowed transitions matrix

| From | To | Who |
|------|----|-----|
| `draft` | `published` | admin, editor, author (own post) |
| `published` | `draft` | admin, editor, author (own post) |
| `published` | `archived` | admin, editor |
| `draft` | `archived` | admin, editor |
| `archived` | `draft` | admin, editor |
| `archived` | `published` | NOBODY (blocked) |

### Implementation

```sql
CREATE OR REPLACE FUNCTION public.enforce_post_status_transition()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role user_role;
  old_status post_status;
  new_status post_status;
BEGIN
  -- Only run when status is actually changing
  IF NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  SELECT role INTO actor_role
  FROM public.profiles
  WHERE id = auth.uid();

  old_status := OLD.status;
  new_status := NEW.status;

  -- Rule 1: archived -> published is NEVER allowed (FR-013)
  IF old_status = 'archived' AND new_status = 'published' THEN
    RAISE EXCEPTION
      'Cannot transition post directly from archived to published. '
      'Restore to draft first.';
  END IF;

  -- Rule 2: Only admin/editor can archive or un-archive (archived -> draft)
  IF new_status = 'archived' OR old_status = 'archived' THEN
    IF actor_role NOT IN ('admin', 'editor') THEN
      RAISE EXCEPTION
        'Only admins and editors can archive or restore posts.';
    END IF;
  END IF;

  -- Rule 3: Author can only publish/unpublish their own post
  -- (Row ownership is already enforced by RLS; this is belt-and-suspenders)
  IF actor_role = 'author' AND NEW.author_id != auth.uid() THEN
    RAISE EXCEPTION
      'Authors can only change the status of their own posts.';
  END IF;

  -- If we reach here, the transition is allowed
  -- Auto-set published_at when transitioning to published
  IF new_status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at := now();
  END IF;

  -- Clear published_at when unpublishing
  IF old_status = 'published' AND new_status != 'published' THEN
    NEW.published_at := NULL;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER posts_status_transition_check
  BEFORE UPDATE OF status ON posts
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_post_status_transition();
```

**Why a trigger rather than extending RLS WITH CHECK clauses**:

RLS `WITH CHECK` clauses can access `OLD` values in PostgreSQL, but the syntax becomes complex and is harder to audit. A dedicated trigger is:
- Easier to read and test in isolation.
- Able to raise descriptive error messages that bubble up to the application.
- Able to perform side effects like setting `published_at`.
- Testable with `psql` or `pgTAP` independently of the RLS layer.

**Why `SECURITY DEFINER` on the trigger function**: The trigger needs to look up the caller's role from `profiles`. Since `profiles` itself has RLS enabled, running the lookup as the calling user risks being blocked by the very policies we are enforcing. `SECURITY DEFINER` lets the trigger function bypass RLS for the single role lookup it needs.

---

## 8. Next.js Server Components and Route Handler Gotchas

### 8.1 Use the Server-Side Supabase Client, Not the Browser Client

Next.js App Router has two contexts: **client components** (run in the browser) and **server components / route handlers** (run on the server). RLS is enforced based on the JWT Supabase receives. If you use the wrong client, RLS either won't apply or will fail silently.

```
Browser client  → uses the user's session from localStorage/cookies → RLS applies
Server component → must manually pass the session cookie → RLS applies
Route handler   → must manually pass the session cookie → RLS applies
Service role key → bypasses RLS entirely (for admin server-side ops only)
```

**Install `@supabase/ssr`** (the current official package for Next.js, replacing the deprecated `auth-helpers-nextjs`):

```bash
npm install @supabase/ssr @supabase/supabase-js
```

### 8.2 Server Component Client (reads cookies from the request)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,  // anon key — RLS enforced
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // setAll called from a Server Component — safe to ignore
            // The middleware will handle session refresh
          }
        },
      },
    }
  )
}
```

Usage in a Server Component:

```typescript
// app/dashboard/posts/page.tsx
import { createClient } from '@/lib/supabase/server'

export default async function PostsPage() {
  const supabase = createClient()

  // RLS applies: admin/editor sees all; author sees only own posts
  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, status, author_id')
    .order('created_at', { ascending: false })

  if (error) throw error
  return <PostList posts={posts} />
}
```

### 8.3 Route Handler Client

```typescript
// app/api/posts/route.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  // RLS enforces author_id and role restrictions automatically
  const { data, error } = await supabase
    .from('posts')
    .insert({ ...body, author_id: user.id })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  return NextResponse.json(data)
}
```

### 8.4 Middleware for Session Refresh (Required)

Without middleware, server-side Supabase clients may get stale sessions. The middleware refreshes the session on every request that touches a protected route.

```typescript
// middleware.ts  (project root)
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh the session (do NOT remove this call)
  const { data: { user } } = await supabase.auth.getUser()

  // Redirect unauthenticated users away from dashboard pages (FR-031)
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### 8.5 Gotchas Specific to Next.js + Supabase RLS

**Gotcha 1: Never trust `getSession()` server-side — use `getUser()` instead**

`supabase.auth.getSession()` returns the session from the cookie without re-validating it against Supabase Auth servers. `supabase.auth.getUser()` makes a network call to validate the JWT. For any security check (redirects, role verification), always use `getUser()`. The extra network call is cheap compared to the security risk.

```typescript
// WRONG — do not use for security decisions
const { data: { session } } = await supabase.auth.getSession()

// CORRECT — validated against Auth server
const { data: { user } } = await supabase.auth.getUser()
```

**Gotcha 2: The service-role key bypasses RLS — never expose it client-side**

The `SUPABASE_SERVICE_ROLE_KEY` in your `.env` must never appear in `NEXT_PUBLIC_*` variables and must never be shipped to the browser. If you need to perform an admin operation that bypasses RLS from a server action (e.g., creating a new user from an admin panel), create a separate server-only client:

```typescript
// lib/supabase/service.ts  — SERVER ONLY, never imported from client components
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // NOT NEXT_PUBLIC_
)
```

**Gotcha 3: RLS errors surface as empty arrays, not 403s**

When a row is blocked by RLS on a SELECT, Supabase does not return an error — it returns an empty array. This can mask bugs during development (you think there are no posts when in fact your policy is wrong). During development, check your policies by:

1. Temporarily disabling RLS in a local Supabase instance to verify the data exists.
2. Using the Supabase Table Editor, which shows policies and lets you test as a specific user.
3. Running policy tests with `pgTAP` or raw SQL using `SET LOCAL role = authenticated; SET LOCAL "request.jwt.claims" = '{"sub": "user-uuid"}';`.

**Gotcha 4: `FOR UPDATE` and `FOR DELETE` policies require a `USING` clause, not `WITH CHECK`**

`WITH CHECK` is only evaluated on INSERT and UPDATE (for the new row state). `USING` is the row filter for SELECT, UPDATE (existing row), and DELETE. A common mistake is writing a DELETE policy with only `WITH CHECK`, which does nothing.

```sql
-- WRONG: this policy does nothing for DELETE
CREATE POLICY "bad_delete" ON posts FOR DELETE TO authenticated
  WITH CHECK (author_id = auth.uid());  -- WITH CHECK ignored on DELETE

-- CORRECT
CREATE POLICY "correct_delete" ON posts FOR DELETE TO authenticated
  USING (author_id = auth.uid());
```

**Gotcha 5: Forgetting `FOR ALL` splits into per-command policies**

A policy with `FOR ALL` applies to SELECT, INSERT, UPDATE, and DELETE. If you are granting different access per command (which this CMS requires), you must write separate policies per command. Do not use `FOR ALL` when access rules differ by command — it leads to overly permissive policies.

**Gotcha 6: Infinite recursion in RLS policies**

If a policy on table A references table B, and a policy on table B references table A, you get infinite recursion. The most common case in this schema is a policy on `posts` that joins `profiles`, where `profiles` itself has a policy that tries to join `posts`. Avoid cross-table joins in policies. Use the `get_my_role()` helper function (which is `SECURITY DEFINER` and bypasses RLS on `profiles`) to safely look up roles from within `posts` policies.

**Gotcha 7: Next.js static rendering and RLS**

Next.js may statically render pages at build time. Any `supabase.from(...).select(...)` call inside a statically rendered page runs without an authenticated session, so it will hit the `anon` RLS policies. This is correct for public blog pages (they should only show published posts). Make sure to:
- Use `export const dynamic = 'force-dynamic'` on dashboard pages to prevent accidental static rendering.
- Use `revalidate` tags on public pages if you want ISR (Incremental Static Regeneration) with proper cache invalidation on publish.

**Gotcha 8: Author impersonation via crafted `author_id`**

Without the `WITH CHECK (author_id = auth.uid())` clause on INSERT, an author could insert a post with someone else's `author_id`. Always validate `author_id` in both the RLS `WITH CHECK` and the application layer. The policies in §5 already handle this.

---

## 9. Recommendation Summary

### Role Storage

**Use the `profiles` table lookup via the `get_my_role()` helper function.** Do not use JWT custom claims for role storage in this project. The reasons:

1. Role changes (admin promoting/demoting a user) take effect immediately — no stale JWT window.
2. The CMS-scale query volume does not justify the infrastructure complexity of Auth hooks.
3. SC-007 (zero permission leakage between roles) is only achievable with live database role lookups.

### Policy Architecture Principles Applied

1. **Principle of least privilege**: default to no access; grant explicitly per role per command.
2. **Separate policies per command**: never use `FOR ALL` when access differs by operation.
3. **Row-level ownership via `author_id = auth.uid()`**: the canonical pattern for author-scoped access.
4. **`USING` for row filtering, `WITH CHECK` for write validation**: applied consistently throughout.
5. **Trigger for business rule enforcement**: status transitions are enforced by a `BEFORE UPDATE` trigger, not by RLS, because triggers can access `OLD`, raise descriptive errors, and run side effects.
6. **`SECURITY DEFINER` helper function**: prevents circular RLS evaluation when looking up the caller's role from within policies on other tables.
7. **Never ship the service-role key to the client**: all server-side admin operations use a separate server-only client.
8. **Always use `getUser()` server-side**: never trust `getSession()` for security decisions in Next.js.

### Quick Reference: Which tool enforces which rule

| Rule | Enforced by |
|------|-------------|
| Author sees only own posts (SELECT) | RLS `USING (author_id = auth.uid())` |
| Author cannot set another user's `author_id` on INSERT | RLS `WITH CHECK (author_id = auth.uid())` |
| Author cannot update another user's post | RLS `USING (author_id = auth.uid())` on UPDATE |
| Admin/Editor can see all posts | RLS `USING (get_my_role() IN ('admin', 'editor'))` |
| No archived→published transition | `BEFORE UPDATE` trigger |
| Only admin/editor can archive | `BEFORE UPDATE` trigger |
| Author cannot escalate own role | RLS `WITH CHECK (role = current_role_value)` on profiles UPDATE |
| All authenticated users can read media | RLS `USING (true)` on media SELECT TO authenticated |
| Upload must set correct `uploaded_by` | RLS `WITH CHECK (uploaded_by = auth.uid())` on media INSERT |
| Unauthenticated users only see published posts | RLS `USING (status = 'published')` on posts SELECT TO anon |
| Dashboard requires authentication | Next.js middleware redirect |
| Service-role operations bypass RLS | Server-only `supabaseAdmin` client, never client-side |

---

## Research Area 3: Next.js 15 App Router Patterns

### 3.1 Middleware Auth (Supabase SSR)

**Decision**: Use `@supabase/ssr` middleware that calls `getUser()` (not `getSession()`) and preserves the `supabaseResponse` object through the full `setAll` cookie cycle.

**Critical rules**:
- Never create a new `NextResponse` after `getUser()` — it drops refreshed session cookies.
- Use `getUser()` not `getSession()` for all security decisions (getSession reads the cookie without server validation).
- Role-based page guards belong in layout Server Components, not middleware (middleware only checks authentication).

**Matcher**: Exclude `_next/static`, `_next/image`, `favicon.ico`, and image assets.

### 3.2 DataProvider Abstraction

**Decision**: A TypeScript `DataProvider` interface in `lib/data/types.ts` with two implementations — `MockDataProvider` (in-memory arrays) and `SupabaseDataProvider` (Supabase client). Switched via `process.env.NEXT_PUBLIC_DATA_SOURCE`. Single import point: `lib/data/index.ts`.

**Key constraints**:
- The Supabase provider requires `cookies()` from `next/headers` — only callable from Server Components and Route Handlers, never Client Components.
- Mock data must mirror production shape exactly (same field names, same nullability) to prevent shape-divergence bugs on the provider switch.
- The mock provider is `getDataProvider()` singleton; the Supabase provider should be constructed per-request (to get fresh cookies).

### 3.3 Server Components + Supabase (Public Pages)

**Decision**: Public pages (blog listing, post, category, tag, author) are Server Components using `createServerClient` from `@supabase/ssr` with `await cookies()` (required in Next.js 15). The `setAll` callback is a no-op for read-only pages.

**Key pattern**: `unstable_cache` wraps data-fetching functions to enable the Next.js Data Cache with tag-based invalidation.

**Gotchas**:
- `cookies()` is async in Next.js 15 — always `await` it before `.getAll()`.
- Use anon key for public pages (RLS enforces published-only visibility).
- `setAll` no-op is correct for read-only Server Components; the middleware handles session refresh.

### 3.4 React Query vs Zustand Split

| Concern | Tool |
|---|---|
| Post list (paginated, filtered) | React Query |
| Single post for editing (server version) | React Query |
| Categories / Tags reference data | React Query (5-min stale time) |
| Media library | React Query |
| Current user + role | React Query |
| Block editor draft content (unsaved) | Zustand |
| Editor UI state (selected block, toolbar) | Zustand |
| Slash command menu open/closed | Zustand |
| Media picker modal state | Zustand |
| Active filters in post list | URL search params |

**Gotcha**: `QueryClient` must be in `useState` inside the provider component, never at module level (prevents cross-request state leakage in SSR).

### 3.5 ISR with On-Demand Revalidation

**Decision**: `unstable_cache` + `revalidateTag` via a `/api/revalidate` Route Handler. Tags follow the pattern: `posts`, `post:{slug}`, `category:{slug}`, `tag:{slug}`, `author:{id}`.

**Trigger**: The dashboard publish/unpublish/archive action calls the revalidate Route Handler after updating the database. The sitemap is revalidated alongside post status changes.

**Gotcha**: `revalidateTag` / `revalidatePath` are only callable from Server Actions or Route Handlers, never from middleware or Client Components.

### 3.6 Tailwind CSS v4 + next/font

**Decision**: CSS-first configuration via `@import "tailwindcss"` + `@theme {}` in `globals.css`. No `tailwind.config.js` needed. PostCSS uses `@tailwindcss/postcss` (replace old `tailwindcss` plugin). `next/font` variables are wired via `@theme { --font-sans: var(--font-inter); }`.

**Breaking changes from v3**:
- `shadow` → `shadow-sm` (default shadow sizes shifted)
- `bg-gradient-to-r` → `bg-linear-to-r`
- Dark mode: add `@variant dark (&:is(.dark *));` for class-based dark mode (old `darkMode: 'class'` config key gone)
- `autoprefixer` no longer needed in PostCSS config

**shadcn/ui**: Use `npx shadcn@canary init` for Tailwind v4 compatibility.
