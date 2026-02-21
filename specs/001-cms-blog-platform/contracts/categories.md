# API Contract: Categories

**Base path**: `/api/categories`
**Auth**: Read endpoints are public. Write endpoints 🔒 require editor or admin role.

---

## `GET /api/categories`

List all categories.

**Success response** `200 OK`:
```json
[
  {
    "id": "uuid",
    "name": "Technology",
    "slug": "technology",
    "description": "string | null",
    "color": "#3B82F6 | null"
  }
]
```

---

## `POST /api/categories` 🔒 (editor, admin)

**Request body**:
```json
{
  "name": "string (required, unique, 1–100 chars)",
  "slug": "string (required, unique)",
  "description": "string | null",
  "color": "string | null (CSS hex, e.g., #3B82F6)"
}
```

**Success response** `201 Created`: Full Category object.

**Error responses**:
- `400` — validation failure
- `401` — no session
- `403` — author role (insufficient permissions)
- `409` — name or slug already in use

---

## `PATCH /api/categories/[id]` 🔒 (editor, admin)

Partial update.

**Request body**: Any subset of category fields (name, slug, description, color).

**Success response** `200 OK`: Updated Category object.

**Error responses**: `400`, `401`, `403`, `404`, `409` (slug/name conflict)

---

## `DELETE /api/categories/[id]` 🔒 (editor, admin)

Deletes the category. Posts that belonged to it have their `category_id` set to `null` (ON DELETE SET NULL).

**Success response** `204 No Content`

**Error responses**: `401`, `403`, `404`
