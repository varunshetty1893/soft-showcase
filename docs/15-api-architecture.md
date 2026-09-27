# 15 — API Architecture

## Design Principles

1. All API routes are in `app/api/`.
2. Admin API routes require authentication + `isAdmin === true`.
3. Public API routes may still have rate limiting.
4. All inputs are validated with Zod before processing.
5. Errors return consistent JSON structure.
6. Database access is always server-side only.

---

## Standard Response Format

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "fields": {
      "email": "Invalid email format"
    }
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod validation failed |
| `NOT_FOUND` | 404 | Resource not found |
| `UNAUTHORIZED` | 401 | Not authenticated |
| `FORBIDDEN` | 403 | Authenticated but not authorized |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `PROVIDER_UNAVAILABLE` | 400 | Contact method disabled |

---

## Public API Routes

### GET /api/projects

Returns published projects with optional filters.

**Query Parameters:**

| Param | Type | Description |
|---|---|---|
| `category` | string | Category slug |
| `tech` | string | Technology slug |
| `type` | string | Project type |
| `search` | string | Search term (substring match on title, shortDescription, fullDescription) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 12, max: 50) |
| `sort` | string | `newest`, `oldest`, `az`, `featured` |

> **Search Strategy (V1):** Executed via Prisma using case-insensitive substring search (`mode: 'insensitive'`) against `title`, `shortDescription`, and `fullDescription`. This keeps the architecture simple and beginner-friendly without external search engines or complex database extensions.

**Response:**

```json
{
  "success": true,
  "data": {
    "projects": [...],
    "total": 100,
    "page": 1,
    "totalPages": 9
  }
}
```

---

### GET /api/projects/[slug]

Returns a single published project by slug.

**Response:**

```json
{
  "success": true,
  "data": {
    "project": {
      "id": "...",
      "title": "AI Resume Analyzer",
      "slug": "ai-resume-analyzer",
      "shortDescription": "...",
      "fullDescription": "...",
      "category": { "id": "...", "name": "AI / ML" },
      "technologies": [...],
      "features": [...],
      "specifications": [...],
      "faqs": [...],
      "images": [...],
      "provider": {
        "displayName": "Rahul",
        "bio": "...",
        "showWhatsapp": true,
        "showEmail": true
        // NOTE: email and whatsappNumber are NOT included here
      },
      "priceMode": "CONTACT",
      "price": null,
      "demoUrl": "https://..."
    }
  }
}
```

**Note:** The actual `provider.email` and `provider.whatsappNumber` are **never returned** in the public project API. Only display flags.

---

### GET /api/projects/[slug]/whatsapp

Generates the WhatsApp link for a project.

**Authorization:** Public (rate limited)

**Response:**

```json
{
  "success": true,
  "data": {
    "url": "https://wa.me/919876543210?text=Hi%2C%20I%27m%20interested..."
  }
}
```

**Errors:**

- 404: Project not found or not published
- 403: Provider has `showWhatsapp = false`
- 400: Provider has no WhatsApp number configured

---

### POST /api/inquiries

Submit an email inquiry.

**Body:**

```json
{
  "projectId": "cuid",
  "name": "John Doe",
  "email": "john@example.com",
  "whatsapp": "+919876543210",
  "message": "I am interested in this project..."
}
```

**Server Actions:**

1. Rate limit check
2. Zod validation
3. Look up project (must be PUBLISHED)
4. Look up provider (must be isActive + showEmail)
5. Check provider.email exists
6. INSERT inquiry into DB
7. Send email to provider via email service
8. Send confirmation to customer (optional)
9. Return success

**Response:**

```json
{
  "success": true,
  "data": {
    "inquiryId": "cuid",
    "message": "Your inquiry has been sent."
  }
}
```

---

### POST /api/custom-requests

Submit a custom project request.

**Body:**

```json
{
  "name": "John",
  "email": "john@example.com",
  "whatsapp": "+91...",
  "projectTitle": "My Idea",
  "category": "Web App",
  "technologyPreferences": ["React", "Node.js"],
  "description": "...",
  "requiredFeatures": "...",
  "deadline": "2025-03-01",
  "budget": "₹50,000",
  "additionalRequirements": "..."
}
```

**Server Actions:**

1. Rate limit check
2. Zod validation
3. INSERT custom_project_request
4. Send email to admin
5. Send confirmation to customer

---

## Admin API Routes

All admin routes require:

1. Valid session (NextAuth)
2. `session.user.isAdmin === true`

If either check fails → 401 or 403 response.

---

### GET /api/admin/projects

Returns all projects (any status) with pagination.

### POST /api/admin/projects

Create a new project manually.

### GET /api/admin/projects/[id]

Get single project for editing.

### PUT /api/admin/projects/[id]

Update a project.

### DELETE /api/admin/projects/[id]

Soft-delete (set status = ARCHIVED). Creates `PROJECT_ARCHIVED` audit log entry. Hard delete is not exposed via API.

### POST /api/admin/projects/import

Import a project from JSON.

**Body:**

```json
{
  "json": "{ ... raw project JSON string ... }",
  "action": "validate" | "import"
}
```

When `action = "validate"`: returns validation result and preview.
When `action = "import"`: creates project as DRAFT.

---

### GET /api/admin/providers

List all providers.

### POST /api/admin/providers

Create provider.

### GET /api/admin/providers/[id]

Get provider.

### PUT /api/admin/providers/[id]

Update provider.

### DELETE /api/admin/providers/[id]

Deactivate provider (sets isActive = false). Does not delete.

---

### GET /api/admin/inquiries

List all inquiries with filters.

### GET /api/admin/inquiries/[id]

Get inquiry detail.

### PUT /api/admin/inquiries/[id]

Update inquiry status and admin notes.

---

### POST /api/admin/uploads

Upload an image for a project.

**Content-Type:** `multipart/form-data`

**Body:**

- `file`: image file
- `projectId`: string
- `altText`: string (optional)
- `isPrimary`: boolean (optional)

**Validation:**

- File type: `image/jpeg`, `image/png`, `image/webp` only
- File size: max 5MB
- No executable files
- No SVG (XSS risk)

**Server Actions:**

1. Validate file type and size
2. Upload to Cloudinary
3. Save both `url` (CDN URL) and `storageKey` (Cloudinary `public_id`) in `project_images` table
4. Return image record

---

## Server Actions vs API Routes

| Use Case | Approach |
|---|---|
| Form submissions in admin | Server Actions (Next.js) |
| Public form submissions (inquiry) | API Route (POST) |
| Data fetching in Server Components | Direct Prisma (no API) |
| Client-side data fetching | API Route (GET) |
| File uploads | API Route (POST, multipart) |
| WhatsApp link generation | API Route (GET) |
