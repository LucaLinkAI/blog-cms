# API Contract: Posts

**Base path**: `/api/posts`
**Auth**: Routes marked 🔒 require a valid session cookie. Role enforcement via Supabase RLS.

---

## `GET /api/posts`

List posts with optional filtering and pagination.

**Query parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `0` | Zero-based page index |
| `pageSize` | integer | `10` | Items per page (max 50) |
| `status` | string | `published` | `draft` \| `published` \| `archived` |
| `categorySlug` | string | — | Filter by category slug |
| `tagSlug` | string | — | Filter by tag slug |
| `authorId` | string | — | Filter by author UUID |
| `search` | string | — | Keyword search against title and excerpt |

**Auth**: Public for `status=published`. 🔒 Required for `draft` or `archived` (RLS enforces further role restrictions).

**Success response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "string",
      "slug": "string",
      "excerpt": "string | null",
      "coverImageUrl": "string | null",
      "status": "published",
      "publishedAt": "2026-02-20T10:00:00Z",
      "readingTime": 5,
      "author": { "id": "uuid", "displayName": "string", "avatarUrl": "string | null", "slug": "string" },
      "category": { "id": "uuid", "name": "string", "slug": "string", "color": "string | null" },
      "tags": [{ "id": "uuid", "name": "string", "slug": "string" }],
      "createdAt": "2026-02-20T09:00:00Z",
      "updatedAt": "2026-02-20T10:00:00Z"
    }
  ],
  "total": 42,
  "page": 0,
  "pageSize": 10
}
```

**Error responses**:
- `400 Bad Request` — invalid query param (e.g., `pageSize > 50`)
- `401 Unauthorized` — status=draft/archived without a valid session

---

## `POST /api/posts` 🔒

Create a new post. `author_id` is set from the session (RLS enforces it).

**Request body**:
```json
{
  "title": "string (required, 1–300 chars)",
  "slug": "string (required, unique)",
  "content": "Block[] | null",
  "excerpt": "string | null (max 300 chars)",
  "coverImageUrl": "string | null",
  "categoryId": "uuid | null",
  "tagIds": ["uuid"],
  "metaTitle": "string | null (max 70 chars)",
  "metaDescription": "string | null (max 160 chars)",
  "status": "draft | published"
}
```

**Success response** `201 Created`: Full Post object (same shape as list item, plus `content`).

**Error responses**:
- `400 Bad Request` — Zod validation failure (includes field-level errors)
- `401 Unauthorized` — no session
- `409 Conflict` — slug already in use

---

## `GET /api/posts/[id]`

Get a single post by UUID or slug.

**Path param**: `id` — UUID or slug string (server detects by UUID format)

**Auth**: Public if `status=published`. 🔒 Required for drafts/archived (RLS applies).

**Success response** `200 OK`: Full Post object including `content` (Block[] JSON).

**Error responses**:
- `404 Not Found` — post does not exist or is not visible to the caller

---

## `PATCH /api/posts/[id]` 🔒

Partial update. All fields optional. RLS enforces ownership (authors can only update own posts).

**Request body**: Any subset of `UpdatePostInput` fields.

**Status transition rules** (enforced by database trigger):
- `draft → published` → allowed for author (own post), editor, admin
- `published → draft` → allowed for author (own post), editor, admin
- `published → archived` → editor, admin only
- `draft → archived` → editor, admin only
- `archived → draft` → editor, admin only
- `archived → published` → BLOCKED for all roles

**Success response** `200 OK`: Updated Post object.

**Error responses**:
- `400 Bad Request` — Zod validation failure
- `401 Unauthorized` — no session
- `403 Forbidden` — RLS blocked (e.g., author trying to update another author's post)
- `404 Not Found`
- `422 Unprocessable Entity` — invalid status transition (trigger exception)

---

## `DELETE /api/posts/[id]` 🔒

Delete a post permanently. RLS enforces ownership.

**Success response** `204 No Content`

**Error responses**:
- `401 Unauthorized`
- `403 Forbidden` — not the owner, or not editor/admin
- `404 Not Found`
