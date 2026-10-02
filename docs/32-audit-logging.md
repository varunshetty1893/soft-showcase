# 32 — Audit Logging

## Purpose

The audit log records all significant administrative and system actions. This enables:

- Accountability (who did what, when)
- Debugging (tracing what happened before an issue)
- Compliance (record of data changes)

---

## Audit Log Table

```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     String?  // ID of the admin who performed the action; null for system actions
  action     String   // Action constant (see list below)
  entityType String   // "Project", "ProjectProvider", "CustomProjectRequest", "User", "Inquiry", etc.
  entityId   String?  // ID of the affected entity
  details    Json?    // Redacted JSON payload with action-specific context
  searchText String?  @db.Text // Lowercased searchable text (action + entity + actor + flattened redacted payload)
  createdAt  DateTime @default(now())

  @@index([createdAt])
  @@index([action])
  @@index([entityType, entityId])
  @@index([userId])
  @@map("audit_logs")
}
```

> **Immutability Guarantee:** Audit log rows are strictly append-only. No `update` or `delete` path exists in application code, API routes, UI, or the mock database client.

---

## Audit Actions

### Project & Moderation Actions

| Action | Description |
|---|---|
| `PROJECT_CREATED` | Project created manually |
| `PROJECT_IMPORTED` | Project imported via JSON |
| `PROJECT_UPDATED` | Project fields updated |
| `PROJECT_PUBLISHED` | Status changed to `PUBLISHED` |
| `PROJECT_ARCHIVED` | Status changed to `ARCHIVED` (standard soft-delete) |
| `PROJECT_DELETED` | Project hard-deleted from database |
| `PROJECT_MODERATED` | Admin updated moderation-allowed fields (`status`, `featured`, `featuredOrder`, `categoryId`, `moderationNote`) on a partner-owned project |
| `ADMIN_EDIT_DENIED` | Admin attempted to modify partner-owned content or pricing fields (blocked with HTTP `403`) |

### Pricing & Promotional Offer Actions (Phase 4)

| Action | Description |
|---|---|
| `PROJECT_OFFER_CREATED` | New promotional offer / Limited Deal configured on a `FIXED` price project |
| `PROJECT_OFFER_UPDATED` | Promotional offer type, prices, qualifier, or schedule updated |
| `PROJECT_OFFER_EXTENDED` | Active or expired promotional offer end timestamp (`dealEndsAt`) extended |
| `PROJECT_OFFER_ENDED` | Promotional offer ended early (`dealType` reset to `NONE`, `price` reverted to `originalPrice`) |

### Provider & Partner Lifecycle Actions (Phase 2)

| Action | Description |
|---|---|
| `PROVIDER_CREATED` | New provider added |
| `PROVIDER_UPDATED` | Provider details updated |
| `PROVIDER_DEACTIVATED` | Provider set inactive |
| `PROVIDER_REACTIVATED` | Provider set active |
| `PARTNER_ACTIVATED` | Provider/partner activated via the state-aware status toggle (`isActive: true`, `applicationStatus: "approved"`) |
| `PARTNER_DEACTIVATED` | Provider/partner deactivated via the state-aware status toggle (`isActive: false`, `applicationStatus: "deactivated"`) |
| `PROVIDER_REMOVED` | Provider soft-removed (`removedAt` set, `isActive: false`, active sessions revoked, published projects unpublished) |
| `PROVIDER_RESTORED` | Soft-removed provider restored to active (`removedAt: null`, `isActive: true`, `applicationStatus: "approved"`) |
| `PROVIDER_PERMANENTLY_DELETED` | Soft-removed provider with zero linked projects/inquiries/transactions permanently deleted |
| `PROVIDER_CONSENT_CONFIRMED` | Admin confirmed provider consent |

### Inquiry Actions

| Action | Description |
|---|---|
| `INQUIRY_RECEIVED` | New inquiry submitted |
| `INQUIRY_STATUS_CHANGED` | Status updated by admin |

### Custom Request Actions

| Action | Description |
|---|---|
| `CUSTOM_REQUEST_RECEIVED` | New custom project request |
| `CUSTOM_REQUEST_STATUS_CHANGED` | Status updated |

### Settings Actions

| Action | Description |
|---|---|
| `SETTINGS_UPDATED` | Site settings changed |

---

## Payload Redaction & Search Indexing

Before any audit row is persisted or displayed, `redactPayload()` recursively replaces sensitive keys (`password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `secret`, `otp`, `codeHash`, `authorization`, `apiKey`, `privateKey`, `cookie`) with `"[REDACTED]"`.

At write time, `createAuditLog()` (aliased as `writeAuditLog` and `recordAuditLog`) builds the lowercased `searchText` column from:
- `action`
- `entityType` and `entityId`
- Actor `userId`, `name`, and `email` (or `"system"` when `userId` is `null`)
- Flattened non-redacted tokens from `details`

---

## Admin Audit Log View (`/admin/audit-logs`)

Server-rendered and driven by URL search parameters (`q`, `action`, `entityType`, `actor`, `from`, `to`, `sort`, `pageSize`, `page`) so filtered views are shareable and survive browser Back/Forward and refresh:

- **Search (`q`, max 100 chars, debounced with `useTransition`):** Matches `action`, `entityType`, `entityId`, actor name/email, and payload text via `searchText` (no raw unsafe SQL).
- **Filters:** Multi-select `action`, multi-select `entityType`, `actor` (admins + `"System"`), inclusive IST (`Asia/Kolkata`) date bounds (`from` / `to`), `sort` (`newest` / `oldest`), and `pageSize` (`25` / `50` / `100`), with active filter chips, `"Clear all"`, and `"Showing X–Y of Z matches"` summary.
- **Readable Rows (Batch Resolved, Zero N+1):**
  - Actors resolve in a single batch query to `Name (email)`, `"System"` (when `userId` is `null`), or `"Deleted user"` (when missing).
  - Entities resolve in one batch query per entity type (`Project` → `title` + `/admin/projects/[id]/edit`, `ProjectProvider` → `displayName` + `/admin/providers/[id]/edit`, `CustomProjectRequest` → `projectTitle` + `/admin/custom-requests/[id]`, `User` → `email`).
- **Colour-Coded Action Badges:** Categorized into `created_approved` (emerald), `rejected_deleted` (rose), and `updated` (teal).
- **Redacted JSON Payload Viewer:** Expandable pretty-printed JSON with a one-click Copy button.
- **CSV Export (`GET /api/admin/audit-logs/export`):** Admin-only export of the current filtered set (capped at 10,000 rows), protected against CSV formula injection by prefixing cells starting with `=`, `+`, `-`, or `@` with `'`.

---

## Audit Log Retention

Audit logs are permanent — never deleted in V1.

Future: Add retention policy (e.g., archive logs older than 1 year).

---

## What Is NOT Audit Logged

- Regular page views
- Search queries
- Failed login attempts (handled by Google OAuth)
- Email sends (logged separately in application logs)
- WhatsApp link opens (not tracked in V1)
