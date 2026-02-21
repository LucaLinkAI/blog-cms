# API Contract: Media

**Base path**: `/api/media`
**Auth**: All endpoints 🔒 require a valid session.

---

## `GET /api/media` 🔒

List all media items (shared library — visible to all authenticated users).

**Query parameters**:

| Param | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `0` | Zero-based page index |
| `pageSize` | integer | `20` | Items per page (max 50) |

**Success response** `200 OK`:
```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "cover.jpg",
      "url": "https://cdn.supabase.co/...",
      "mimeType": "image/jpeg",
      "sizeBytes": 204800,
      "altText": "string | null",
      "uploadedBy": "uuid",
      "createdAt": "2026-02-20T10:00:00Z"
    }
  ],
  "total": 35,
  "page": 0,
  "pageSize": 20
}
```

---

## `POST /api/media/upload` 🔒

Upload a new file. Accepts `multipart/form-data`.

**Request** (multipart/form-data):

| Field | Required | Description |
|---|---|---|
| `file` | Yes | The file to upload |
| `altText` | No | Accessibility description |
| `bucket` | Yes | `post-covers` \| `post-content` \| `avatars` |

**File size limits** (enforced server-side before upload):
- `post-covers`: max 5 MB; accept `image/jpeg`, `image/png`, `image/webp`
- `post-content`: max 10 MB; accept `image/*`, `video/mp4`
- `avatars`: max 2 MB; accept `image/jpeg`, `image/png`, `image/webp`

**Success response** `201 Created`:
```json
{
  "id": "uuid",
  "filename": "my-photo.jpg",
  "url": "https://cdn.supabase.co/storage/v1/object/public/post-covers/user-id/1234-my-photo.jpg",
  "mimeType": "image/jpeg",
  "sizeBytes": 204800,
  "altText": "null",
  "uploadedBy": "uuid",
  "createdAt": "2026-02-20T10:00:00Z"
}
```

**Error responses**:
- `400` — missing file, unsupported mime type, or invalid bucket
- `401` — no session
- `413 Payload Too Large` — file exceeds size limit for the target bucket
