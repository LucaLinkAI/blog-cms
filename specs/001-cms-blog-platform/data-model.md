# Data Model: CMS Blog Platform

**Branch**: `001-cms-blog-platform`
**Date**: 2026-02-20
**Source**: Derived from spec.md Key Entities + Requirements + Clarifications

---

## Enums

```sql
CREATE TYPE user_role    AS ENUM ('admin', 'editor', 'author');
CREATE TYPE post_status  AS ENUM ('draft', 'published', 'archived');
```

---

## Tables

### `profiles`

One row per `auth.users` entry. Created automatically via `handle_new_user()` trigger.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK, FK `auth.users(id)` ON DELETE CASCADE | Mirrors Supabase auth user ID |
| `display_name` | `text` | NOT NULL | Shown on posts and author pages |
| `avatar_url` | `text` | nullable | URL to uploaded avatar image |
| `bio` | `text` | nullable | Rich text or plain text, max 500 chars |
| `role` | `user_role` | NOT NULL DEFAULT `'author'` | All new users start as author; admin promotes |
| `slug` | `text` | UNIQUE, NOT NULL | URL-safe identifier for author profile pages |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

**Indexes**: `profiles_slug_idx UNIQUE (slug)`

**Triggers**:
- `on_auth_user_created` — AFTER INSERT on `auth.users` → inserts a new `profiles` row with `role = 'author'` and auto-generates `slug` from email local part.

**Validation rules**:
- `slug`: lowercase alphanumeric + hyphens, 3–60 chars, unique across table
- `display_name`: 1–100 chars, non-empty
- `bio`: max 500 chars

---

### `categories`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `name` | `text` | NOT NULL, UNIQUE | Display name |
| `slug` | `text` | NOT NULL, UNIQUE | URL path segment |
| `description` | `text` | nullable | |
| `color` | `text` | nullable | Hex color string (e.g., `#3B82F6`) for UI badges |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

**Indexes**: `categories_slug_idx UNIQUE (slug)`, `categories_name_idx UNIQUE (name)`

**Validation rules**:
- `slug`: lowercase alphanumeric + hyphens, 2–60 chars
- `color`: valid CSS hex color or null

---

### `tags`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `name` | `text` | NOT NULL, UNIQUE | Display label |
| `slug` | `text` | NOT NULL, UNIQUE | URL path segment |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

**Indexes**: `tags_slug_idx UNIQUE (slug)`, `tags_name_idx UNIQUE (name)`

---

### `posts`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `title` | `text` | NOT NULL | 1–300 chars |
| `slug` | `text` | NOT NULL, UNIQUE | Auto-generated from title; user can override |
| `content` | `jsonb` | nullable | BlockNote `Block[]` JSON array |
| `excerpt` | `text` | nullable | For SEO meta description fallback + post cards |
| `cover_image_url` | `text` | nullable | Public URL to cover image |
| `author_id` | `uuid` | NOT NULL, FK `profiles(id)` ON DELETE CASCADE | |
| `category_id` | `uuid` | nullable, FK `categories(id)` ON DELETE SET NULL | Post retains when category deleted |
| `status` | `post_status` | NOT NULL DEFAULT `'draft'` | Enforced by trigger |
| `published_at` | `timestamptz` | nullable | Set automatically by trigger on publish; cleared on unpublish |
| `meta_title` | `text` | nullable | Overrides `title` in `<title>` tag if set |
| `meta_description` | `text` | nullable | Overrides `excerpt` in meta description if set |
| `reading_time` | `integer` | nullable | Minutes, auto-calculated on save |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` | Updated via trigger |

**Indexes**:
- `posts_slug_idx UNIQUE (slug)`
- `posts_author_idx (author_id)`
- `posts_category_idx (category_id)`
- `posts_status_published_at_idx (status, published_at DESC)` — for efficient listing queries
- `posts_search_idx` — GIN index on `to_tsvector('english', title || ' ' || coalesce(excerpt, ''))` for full-text search

**Triggers**:
- `posts_updated_at` — BEFORE UPDATE → sets `updated_at = now()`
- `posts_status_transition_check` — BEFORE UPDATE OF `status` → enforces transition matrix (see research.md §7)

**Validation rules (application-level via Zod)**:
- `title`: 1–300 chars, non-empty
- `slug`: lowercase alphanumeric + hyphens, 3–200 chars, unique
- `excerpt`: max 300 chars
- `meta_title`: max 70 chars (SEO best practice)
- `meta_description`: max 160 chars (SEO best practice)
- `reading_time`: positive integer, calculated as `ceil(wordCount / 200)`

---

### `post_tags`

Junction table. Cascade-deleted when either post or tag is deleted.

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `post_id` | `uuid` | NOT NULL, FK `posts(id)` ON DELETE CASCADE | |
| `tag_id` | `uuid` | NOT NULL, FK `tags(id)` ON DELETE CASCADE | |

**Primary Key**: `(post_id, tag_id)`

**Indexes**: `post_tags_tag_idx (tag_id)` — for efficient tag filtering

---

### `media`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | `uuid` | PK DEFAULT `gen_random_uuid()` | |
| `filename` | `text` | NOT NULL | Original filename |
| `storage_path` | `text` | NOT NULL | Path within Supabase Storage bucket |
| `url` | `text` | NOT NULL | Public CDN URL |
| `mime_type` | `text` | NOT NULL | e.g., `image/jpeg`, `video/mp4` |
| `size_bytes` | `integer` | NOT NULL | File size in bytes |
| `alt_text` | `text` | nullable | Accessibility description |
| `uploaded_by` | `uuid` | NOT NULL, FK `profiles(id)` ON DELETE CASCADE | Audit trail only; does not restrict visibility |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` | |

**Indexes**: `media_uploader_idx (uploaded_by)`

**Validation rules**:
- `mime_type` for avatars and covers: `image/jpeg`, `image/png`, `image/webp` only
- `mime_type` for post content: additionally allow `image/gif`, `video/mp4`
- `size_bytes` for covers: ≤ 5,242,880 (5 MB)
- `size_bytes` for post content: ≤ 10,485,760 (10 MB)
- `size_bytes` for avatars: ≤ 2,097,152 (2 MB)

---

## Storage Buckets (Supabase Storage)

| Bucket | Access | Path Convention |
|---|---|---|
| `post-covers` | Public | `post-covers/{user_id}/{timestamp}-{filename}` |
| `post-content` | Public | `post-content/{user_id}/{timestamp}-{filename}` |
| `avatars` | Public | `avatars/{user_id}/{timestamp}-{filename}` |

---

## Entity Relationship Diagram (text)

```
auth.users (Supabase managed)
    │ 1
    │ ◄── created by trigger
    ▼ 1
profiles
    │ 1
    │
    ▼ N
  posts ──────────────────────► categories
    │                                (N posts : 1 category)
    │ N
    ▼
  post_tags
    │ N
    ▼
  tags

profiles ──────────────────────► media
  (1 profile : N media items, via uploaded_by — audit only)
```

---

## State Transitions: Post Status

```
            ┌────────────────────────────────────────────────┐
            │                                                │
            ▼                                                │
          DRAFT ──────────────────────────────────► ARCHIVED │
            │  (editor/admin only)                     │     │
            │                                          │     │
            │ draft→published                          │ archived→draft
            │ (author/editor/admin)                    │ (editor/admin only)
            ▼                                          │
        PUBLISHED ◄───────────────────────────────────┘
            │       (NOT ALLOWED: archived→published)
            │
            ├── published→draft (author/editor/admin)
            │
            └── published→archived (editor/admin only)
```

**Business rules enforced by `posts_status_transition_check` trigger**:
1. `archived → published` is NEVER allowed from any role.
2. Archiving and restoring from archive require `editor` or `admin` role.
3. `published_at` is set to `now()` when transitioning to `published`; cleared when leaving `published`.

---

## TypeScript Types (DataProvider interface)

```typescript
// lib/data/types.ts

export type UserRole = 'admin' | 'editor' | 'author'
export type PostStatus = 'draft' | 'published' | 'archived'

export interface Author {
  id: string
  displayName: string
  avatarUrl: string | null
  bio: string | null
  role: UserRole
  slug: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  color: string | null
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Post {
  id: string
  title: string
  slug: string
  content: Block[] | null          // BlockNote Block[] JSON
  excerpt: string | null
  coverImageUrl: string | null
  authorId: string
  author?: Author                  // populated on join
  categoryId: string | null
  category?: Category              // populated on join
  tagIds: string[]
  tags?: Tag[]                     // populated on join
  status: PostStatus
  publishedAt: string | null
  metaTitle: string | null
  metaDescription: string | null
  readingTime: number | null
  createdAt: string
  updatedAt: string
}

export interface MediaItem {
  id: string
  filename: string
  storagePath: string
  url: string
  mimeType: string
  sizeBytes: number
  altText: string | null
  uploadedBy: string
  createdAt: string
}

export interface PaginatedResult<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface PostFilters {
  status?: PostStatus
  categorySlug?: string
  tagSlug?: string
  authorId?: string
  authorSlug?: string
  search?: string
}

// Inputs

export interface CreatePostInput {
  title: string
  slug: string
  content?: Block[]
  excerpt?: string
  coverImageUrl?: string
  categoryId?: string
  tagIds?: string[]
  metaTitle?: string
  metaDescription?: string
  status?: PostStatus
}

export interface UpdatePostInput extends Partial<CreatePostInput> {}

export interface CreateCategoryInput {
  name: string
  slug: string
  description?: string
  color?: string
}

export interface UpdateCategoryInput extends Partial<CreateCategoryInput> {}

export interface CreateTagInput {
  name: string
  slug: string
}

export interface UpdateAuthorInput {
  displayName?: string
  avatarUrl?: string
  bio?: string
}

export interface CreateMediaInput {
  filename: string
  storagePath: string
  url: string
  mimeType: string
  sizeBytes: number
  altText?: string
  uploadedBy: string
}

// DataProvider interface — all implementations must satisfy this contract

export interface DataProvider {
  // Posts
  listPosts(filters: PostFilters, page: number, pageSize: number): Promise<PaginatedResult<Post>>
  getPostBySlug(slug: string): Promise<Post | null>
  getPostById(id: string): Promise<Post | null>
  createPost(input: CreatePostInput, authorId: string): Promise<Post>
  updatePost(id: string, input: UpdatePostInput): Promise<Post>
  deletePost(id: string): Promise<void>

  // Categories
  listCategories(): Promise<Category[]>
  getCategoryBySlug(slug: string): Promise<Category | null>
  createCategory(input: CreateCategoryInput): Promise<Category>
  updateCategory(id: string, input: UpdateCategoryInput): Promise<Category>
  deleteCategory(id: string): Promise<void>

  // Tags
  listTags(): Promise<Tag[]>
  getTagBySlug(slug: string): Promise<Tag | null>
  createTag(input: CreateTagInput): Promise<Tag>
  deleteTag(id: string): Promise<void>

  // Authors
  listAuthors(): Promise<Author[]>
  getAuthorById(id: string): Promise<Author | null>
  getAuthorBySlug(slug: string): Promise<Author | null>
  updateAuthor(id: string, input: UpdateAuthorInput): Promise<Author>

  // Media
  listMedia(page: number, pageSize: number): Promise<PaginatedResult<MediaItem>>
  createMediaItem(input: CreateMediaInput): Promise<MediaItem>
}
```
