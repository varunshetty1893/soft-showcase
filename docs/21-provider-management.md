# 21 — Provider Management

## Overview

Provider management is an admin-only feature. Providers are created, edited, and deactivated exclusively by the platform administrator.

---

## Provider Management Pages

| Page | URL | Purpose |
|---|---|---|
| Provider List | `/admin/providers` | View all providers |
| Create Provider | `/admin/providers/new` | Add new provider |
| Edit Provider | `/admin/providers/[id]/edit` | Update provider details |

---

## Creating a Provider

### Required Fields

| Field | Validation |
|---|---|
| Display Name | Required, 2–100 characters |
| Email | Required, valid email format, unique |
| Provider Consent Confirmed | Checkbox: confirms admin has obtained permission to list this provider's projects and route customer leads to them |

### Optional Fields

| Field | Validation |
|---|---|
| WhatsApp Number | International format if provided (e.g., +919876543210) |
| Bio | Max 500 characters |
| Show Email | Toggle, default: false |
| Show WhatsApp | Toggle, default: true |
| Active | Toggle, default: true |

### Duplicate Detection

- Email must be unique across all providers
- If a duplicate email is submitted, return a friendly error:
  ```
  A provider with this email already exists.
  ```

### Provider Consent Confirmation

Provider consent is a mandatory compliance requirement for third-party providers:
- `providerConsentConfirmed`: boolean (default: `false` on programmatic creation)
- `providerConsentConfirmedAt`: timestamp set when consent is confirmed by the admin
- **Server Enforcement:** Projects assigned to this provider **cannot be published** unless `providerConsentConfirmed === true`.

---

## Editing a Provider

All fields from creation can be updated.

### Important: Provider Contact Changes

When a provider's WhatsApp or email is updated, all future customer contacts use the new information.

Existing inquiries already stored in the database retain the `providerId` at the time of submission — they do not change.

---

## Deactivating a Provider

Deactivation sets `isActive = false`.

### What Happens

| Entity | Effect |
|---|---|
| Provider record | `isActive` set to `false` |
| Provider's projects | Remain unchanged in DB |
| Published projects | Contact buttons hidden (provider inactive) |
| Existing inquiries | Remain in DB with original `providerId` |
| New project publishing | Not allowed with inactive provider |

### Deactivation Warning

Before deactivating, the admin sees a confirmation:

```
Deactivate Provider: Rahul

This will:
✗ Hide contact buttons on all 3 projects assigned to Rahul.
✗ Prevent publishing new projects with this provider.

Existing projects and inquiries are preserved.

[ Confirm Deactivation ] [ Cancel ]
```

After deactivation, the admin dashboard shows a warning:

```
⚠ 3 published projects have an inactive provider.
Projects affected: Smart Parking, AI Resume, E-Commerce Template
These projects currently show no contact options.
```

---

## Provider List View

The provider table shows:

| Column | Description |
|---|---|
| Name | displayName |
| Email | email (partially masked or full, admin context) |
| WhatsApp | whatsappNumber (if set) |
| Status | Active / Inactive badge |
| Projects | Count of projects assigned |
| Show Email | Yes/No |
| Show WhatsApp | Yes/No |
| Actions | Edit, Deactivate/Activate |

---

## Provider → Projects Relationship

From the provider edit page, the admin can see a list of all projects assigned to this provider:

```
Projects assigned to Rahul (3)

┌─────────────────────────────────┬────────────┬──────────┐
│ Project                         │ Status     │ Actions  │
├─────────────────────────────────┼────────────┼──────────┤
│ AI Resume Analyzer              │ Published  │ Edit     │
│ Smart Parking System            │ Published  │ Edit     │
│ E-Commerce Template             │ Draft      │ Edit     │
└─────────────────────────────────┴────────────┴──────────┘
```

---

## Provider Selector in Project Form

When the admin creates or edits a project and selects a provider:

**UX Behavior:**

1. Admin opens project form.
2. Admin selects provider from dropdown.
3. UI **immediately shows** (read-only):
   - Provider email
   - Provider WhatsApp number
   - Provider active status
   - Provider `show_email` and `show_whatsapp` flags
4. Admin does NOT retype contact details.
5. If provider is inactive, admin sees a prominent warning:
   ```
   ⚠ This provider is currently inactive.
   Projects with an inactive provider CANNOT be published.
   Attempting to publish will fail the server-side publication gate.
   ```

---

## Admin Audit Logging & Lifecycle Rules for Providers (Phase 2A & 2B)

### 1. Single State-Aware Status Toggle Button (Phase 2A)
Each non-removed provider row renders **at most one** status button based on `(isActive, applicationStatus)`:
- `isActive: true, applicationStatus: "approved"` → **Deactivate** (destructive outline, requires confirmation dialog). Sets `isActive = false`, `applicationStatus = "deactivated"`, and logs `PARTNER_DEACTIVATED`.
- `isActive: false, applicationStatus: "approved" | "deactivated" | "suspended" | "rejected"` → **Activate** (primary). Sets `isActive = true`, `applicationStatus = "approved"`, and logs `PARTNER_ACTIVATED`.
- `applicationStatus: "pending"` → Status toggle is hidden; row renders **Approve / Reject** review actions instead.
- **Compare-and-Set & Self-Lockout Guards:** `PATCH /api/admin/providers/[id]` validates `expectedIsActive` (returning `409 Conflict` on stale state) and blocks an admin from deactivating or removing their own linked provider record (`400 Bad Request`).

### 2. Soft Removal, Restore & Permanent Delete (Phase 2B)
- **Soft Remove (`POST /api/admin/providers/[id]/remove`):** Requires typed confirmation (provider's exact `displayName` or `email`) and an optional reason (max 500 chars). Atomically sets `removedAt = now()`, `removedById`, `removalReason`, `isActive = false`, `applicationStatus = "deactivated"`, unpublishes all `PUBLISHED` projects (`status = DRAFT`), increments `User.tokenVersion` and deletes active `Session` rows, writes `PROVIDER_REMOVED`, and sends a transactional notification email.
- **Public Visibility Exclusion:** All public queries (`publicProviderWhere()` and `publicProjectWhere()`) require `removedAt: null`, `isActive: true`, and `applicationStatus: "approved"`. Projects belonging to a removed or inactive provider return `404` publicly and reject new inquiries.
- **Removed Tab & Restore (`POST /api/admin/providers/[id]/restore`):** `/admin/providers` provides **Active** (`removedAt IS NULL`) and **Removed** (`removedAt IS NOT NULL`) tabs. Restoring clears `removedAt`, `removedById`, `removalReason`, sets `isActive = true`, `applicationStatus = "approved"`, and logs `PROVIDER_RESTORED`. Projects remain `DRAFT` so they can be reviewed before republishing.
- **Permanent Delete (`DELETE /api/admin/providers/[id]`):** Allowed **only** when the provider is already soft-removed (`removedAt != null`) **and** has `0` projects, `0` inquiries, and `0` transactions (otherwise returns `409 Conflict`). Logs `PROVIDER_PERMANENTLY_DELETED`.

| Action | Description |
|---|---|
| `PROVIDER_CREATED` | New provider added |
| `PROVIDER_UPDATED` | Provider details changed |
| `PARTNER_ACTIVATED` / `PROVIDER_REACTIVATED` | Provider activated |
| `PARTNER_DEACTIVATED` / `PROVIDER_DEACTIVATED` | Provider deactivated |
| `PROVIDER_REMOVED` | Provider soft-removed |
| `PROVIDER_RESTORED` | Soft-removed provider restored |
| `PROVIDER_PERMANENTLY_DELETED` | Eligible removed provider permanently deleted |

---

## Future: Provider Accounts

In V2, providers could have login accounts to:

- See their own inquiries
- Update their contact details (with admin approval)
- Upload their own projects (pending admin approval)

The database schema supports this via a potential `userId` field on `project_providers`.
