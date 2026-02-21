# API Contract: Tags

**Base path**: `/api/tags`
**Auth**: Read endpoints are public. Write endpoints 🔒 require editor or admin role.

---

## `GET /api/tags`

List all tags.

**Success response** `200 OK`:
```json
[
  { "id": "uuid", "name": "React", "slug": "react" }
]
```

---

## `POST /api/tags` 🔒 (editor, admin)

**Request body**:
```json
{
  "name": "string (required, unique, 1–60 chars)",
  "slug": "string (required, unique)"
}
```

**Success response** `201 Created`: Full Tag object.

**Error responses**: `400`, `401`, `403`, `409` (name or slug conflict)

---

## `DELETE /api/tags/[id]` 🔒 (editor, admin)

Deletes the tag. `post_tags` rows cascade-delete. Posts retain all other tags.

**Success response** `204 No Content`

**Error responses**: `401`, `403`, `404`
