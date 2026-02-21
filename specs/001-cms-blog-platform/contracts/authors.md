# API Contract: Authors

**Base path**: `/api/authors`
**Auth**: Read endpoints are public. Write endpoints 🔒 require a valid session.

---

## `GET /api/authors`

List all author profiles.

**Success response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "displayName": "Jane Smith",
    "avatarUrl": "https://... | null",
    "bio": "string | null",
    "slug": "jane-smith",
    "role": "author | editor | admin",
    "createdAt": "2026-01-01T00:00:00Z"
  }
]
```

---

## `GET /api/authors/[slug]`

Get a single author profile by slug.

**Success response** `200 OK`: Full Author object.

**Error responses**: `404 Not Found`

---

## `PATCH /api/authors/[id]` 🔒

Update an author profile. Authors may only update their own profile. Admins may update any profile including the `role` field. Editors and authors cannot change `role`.

**Request body**:
```json
{
  "displayName": "string | null (1–100 chars)",
  "avatarUrl": "string | null",
  "bio": "string | null (max 500 chars)",
  "role": "admin | editor | author   (admin only)"
}
```

**Success response** `200 OK`: Updated Author object.

**Error responses**:
- `400` — validation failure
- `401` — no session
- `403` — attempting to update another user's profile without admin role, or attempting to change `role` without admin role
- `404` — author not found
