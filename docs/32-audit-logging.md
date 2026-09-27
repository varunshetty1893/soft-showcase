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
  id         String  @id @default(cuid())
  userId     String?      // Admin who performed the action (null for system actions)
  action     String       // Action name (see list below)
  entityType String       // Entity type (Project, Provider, Inquiry, etc.)
  entityId   String?      // ID of the affected entity
  details    Json?        // Additional context
  createdAt  DateTime @default(now())

  @@map("audit_logs")
}
```

---

## Audit Actions

### Project Actions

| Action | Description |
|---|---|
| `PROJECT_CREATED` | Project created manually |
| `PROJECT_IMPORTED` | Project imported via JSON |
| `PROJECT_UPDATED` | Project fields updated |
| `PROJECT_PUBLISHED` | Status changed to PUBLISHED |
| `PROJECT_ARCHIVED` | Status changed to ARCHIVED (standard soft-delete) |
| `PROJECT_DELETED` | Project hard-deleted from database (direct DB administration only; no UI) |

### Provider Actions

| Action | Description |
|---|---|
| `PROVIDER_CREATED` | New provider added |
| `PROVIDER_UPDATED` | Provider details updated |
| `PROVIDER_DEACTIVATED` | Provider set inactive |
| `PROVIDER_REACTIVATED` | Provider set active |
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

## Creating Audit Log Entries

```typescript
// lib/db/audit.ts

import { prisma } from "./client";

interface AuditOptions {
  userId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, unknown>;
}

export async function createAuditLog(options: AuditOptions) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: options.userId,
        action: options.action,
        entityType: options.entityType,
        entityId: options.entityId,
        details: options.details ?? undefined,
      },
    });
  } catch (error) {
    // Audit log failure should not block the main operation
    console.error("[AuditLog] Failed to write audit log", error);
  }
}
```

---

## Example Usage

```typescript
// After publishing a project
await createAuditLog({
  userId: session.user.id,
  action: "PROJECT_PUBLISHED",
  entityType: "Project",
  entityId: project.id,
  details: {
    title: project.title,
    slug: project.slug,
    providerId: project.providerId,
  },
});

// After deactivating a provider
await createAuditLog({
  userId: session.user.id,
  action: "PROVIDER_DEACTIVATED",
  entityType: "ProjectProvider",
  entityId: provider.id,
  details: {
    displayName: provider.displayName,
    affectedProjects: affectedCount,
  },
});
```

---

## Admin Audit Log View

**URL:** `/admin/audit-logs`

Shows:

| Column | Description |
|---|---|
| Timestamp | When the action occurred |
| Admin | Who performed the action |
| Action | What was done |
| Entity | What was affected |
| Details | JSON details (expandable) |

Filters:

- By action type
- By entity type
- By date range
- By admin user

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
