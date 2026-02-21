# API Contract: Auth

**Base path**: `/api/auth`
**Note**: These routes wrap Supabase Auth. In Phase 1 (mock), they return hardcoded success responses for UI development.

---

## `POST /api/auth/login`

Exchange email + password for a session. On success, sets `sb-*` session cookies.

**Request body**:
```json
{
  "email": "string (required, valid email)",
  "password": "string (required, min 8 chars)"
}
```

**Success response** `200 OK`:
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "profile": {
    "id": "uuid",
    "displayName": "Jane Smith",
    "role": "author | editor | admin",
    "slug": "jane-smith"
  }
}
```

**Error responses**:
- `400` — missing or malformed fields
- `401` — invalid credentials

---

## `POST /api/auth/logout` 🔒

Invalidate the current session and clear session cookies.

**Success response** `200 OK`:
```json
{ "success": true }
```

---

## `POST /api/auth/register`

Admin-managed registration. Creates a new user account with `role = 'author'`. Only callable by an authenticated admin (enforced server-side).

**Request body**:
```json
{
  "email": "string (required, valid email, unique)",
  "password": "string (required, min 8 chars)",
  "displayName": "string (required, 1–100 chars)"
}
```

**Success response** `201 Created`:
```json
{
  "user": { "id": "uuid", "email": "newuser@example.com" },
  "profile": { "id": "uuid", "displayName": "New User", "role": "author", "slug": "new-user" }
}
```

**Error responses**:
- `400` — validation failure
- `401` — not authenticated
- `403` — caller is not an admin
- `409` — email already registered
