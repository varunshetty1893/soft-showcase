# 03 — User Roles

## Role Overview

| Role | Authentication | Account Required | Access Level |
|---|---|---|---|
| Visitor | None | No | Public pages only |
| Customer | Optional (Google OAuth) | Optional | Public pages + own profile/inquiries |
| Admin | Required (Google OAuth + admin flag) | Yes | Full platform |
| Provider | None in V1 | No in V1 | Managed by Admin |

---

## 1. Visitor

### Description

Any person who opens the Soft Showcase website without logging in.

### Can Access

- Homepage (`/`)
- Project catalog (`/projects`)
- Project detail pages (`/projects/[slug]`)
- Category pages (`/categories`, `/categories/[slug]`)
- Custom project request page (`/custom-project`)
- About, Contact, FAQ, Privacy, Terms pages
- Contact/inquiry form on project pages

### Cannot Access

- Admin dashboard
- Customer profile and inquiry pages
- Any authenticated route

### Actions Available

- Browse projects
- Search and filter projects
- View project details, screenshots, features
- Click "Discuss on WhatsApp" (opens WhatsApp)
- Submit email inquiry via form (no account required)
- Submit custom project request form

---

## 2. Customer

### Description

A visitor who has signed in with Google OAuth. Account creation is optional — visitors can submit inquiries without an account.

### Can Access

Everything a Visitor can access, plus:

- Profile settings (`/profile`)
- Inquiry history (`/my-inquiries`)
- Custom request history (`/my-requests`)

### Cannot Access

- Admin dashboard
- Provider management
- Other customers' data (enforced server-side)

### Actions Available

Everything a Visitor can do, plus:

- View their own inquiry history
- View their own custom request history
- Update profile information

### Account Creation

- Google OAuth only — no email/password accounts
- Account is created on first Google login
- Not required to submit an inquiry (but helps track history)

### Customer Data Isolation

**Critical:** A customer may only access their own inquiries and requests. The server verifies ownership on every request — it does not trust IDs supplied by the browser.

```typescript
// Example: Server must always filter by authenticated user's ID
const inquiries = await prisma.inquiry.findMany({
  where: { customerId: session.user.id }, // ← Always scope to authenticated user
});
```

Customer A cannot access Customer B's inquiries or requests, even by guessing IDs.

---

## 3. Admin

### Description

The platform administrator. Has full control over all platform content and settings.

### How Admin Is Granted

Admin access is NOT automatically given to any authenticated user.

The `users` table has an `isAdmin` boolean field. This must be manually set for the first admin.

**Admin authorization flow:**

```
User logs in with Google
       ↓
NextAuth creates session
       ↓
Server reads: SELECT isAdmin FROM users WHERE id = session.userId
       ↓
If false → redirect to home page (/)
If true → allow admin access
```

**Source of truth:** The `isAdmin` field in the `users` database table.

**No UI allows a user to self-assign admin.** The only way to grant admin is via:
1. Direct database update (Prisma Studio or SQL)
2. The Prisma seed script (for initial setup)

See [Admin Bootstrap → Deployment Guide](34-deployment.md) for the exact first-admin setup process.

### Can Access

All public routes, plus:

- Admin dashboard (`/admin`)
- Project management (`/admin/projects`, `/admin/projects/new`, `/admin/projects/[id]/edit`, `/admin/projects/import`)
- Provider management (`/admin/providers`, `/admin/providers/new`, `/admin/providers/[id]/edit`)
- Category management (`/admin/categories`)
- Technology management (`/admin/technologies`)
- Inquiry management (`/admin/inquiries`, `/admin/inquiries/[id]`)
- Custom request management (`/admin/custom-requests`, `/admin/custom-requests/[id]`)
- User management (`/admin/users`)
- Site settings (`/admin/settings`)
- Audit log (`/admin/audit-logs`)

### Actions Available

- Create, edit, archive projects
- Publish and unpublish projects
- Import projects via JSON
- Create, edit, deactivate providers
- Assign providers to projects
- Confirm provider consent before publication
- View and manage all inquiries
- Update inquiry status
- View custom project requests
- Upload and manage screenshots
- Manage categories and technologies
- Configure site settings
- View audit logs

---

## 4. Provider

### Description

A person or entity whose projects are listed on the platform. They receive customer inquiries via WhatsApp or Email.

### V1 Status

**Providers do NOT have a login account in V1.**

They are managed entirely by the Admin.

### How Providers Are Managed

```
Admin creates provider in /admin/providers
       ↓
Admin fills in: name, email, whatsapp, bio
       ↓
Admin sets: showEmail, showWhatsapp, isActive
       ↓
Admin confirms provider consent before publishing their projects
       ↓
Admin assigns provider to projects
       ↓
Customer contacts provider via WhatsApp / Email
```

### Future Consideration

The database schema is designed to support future provider accounts. The `project_providers` table can be linked to a `users` entry in a future version, allowing providers to log in, view their own inquiries, and manage their own projects.

### Provider Cannot (V1)

- Log in to the platform
- View their own inquiry list directly
- Modify their own profile
- Publish or manage projects

---

## Role Permission Matrix

| Feature | Visitor | Customer | Admin |
|---|---|---|---|
| Browse projects | ✅ | ✅ | ✅ |
| View project detail | ✅ | ✅ | ✅ |
| WhatsApp contact | ✅ | ✅ | ✅ |
| Email inquiry | ✅ | ✅ | ✅ |
| Custom project request | ✅ | ✅ | ✅ |
| View own inquiries | ❌ | ✅ | ✅ (all) |
| View all inquiries | ❌ | ❌ | ✅ |
| View own requests | ❌ | ✅ | ✅ (all) |
| Create projects | ❌ | ❌ | ✅ |
| Edit projects | ❌ | ❌ | ✅ |
| Publish projects | ❌ | ❌ | ✅ |
| Import projects | ❌ | ❌ | ✅ |
| Manage providers | ❌ | ❌ | ✅ |
| Manage categories | ❌ | ❌ | ✅ |
| Manage technologies | ❌ | ❌ | ✅ |
| View admin dashboard | ❌ | ❌ | ✅ |
| Access site settings | ❌ | ❌ | ✅ |
| View audit logs | ❌ | ❌ | ✅ |
