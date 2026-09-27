# 04 — Provider Model

## What Is a Provider?

A **Provider** is any person or organization whose software projects are listed on Soft Showcase. They are the point of contact for customers interested in a project.

Providers are independent from the platform administrator. A provider may be:

- The platform owner themselves
- A friend or colleague
- An independent developer
- A software agency
- Any other project creator

---

## Provider Entity

### Database Table: `project_providers`

| Field | Type | Description |
|---|---|---|
| `id` | cuid | Primary key |
| `displayName` | String | Public-facing name (e.g., "Rahul") |
| `email` | String | Provider's email (private by default) |
| `whatsappNumber` | String? | International format (e.g., +919876543210) |
| `bio` | String? | Short professional bio |
| `avatarUrl` | String? | Optional profile image URL |
| `isActive` | Boolean | Whether the provider is active |
| `showEmail` | Boolean | Whether email contact is enabled |
| `showWhatsapp` | Boolean | Whether WhatsApp contact is enabled |
| `providerConsentConfirmed` | Boolean | Admin has confirmed provider consent |
| `providerConsentConfirmedAt` | DateTime? | When consent was confirmed |
| `createdAt` | DateTime | Created timestamp |
| `updatedAt` | DateTime | Last updated timestamp |

---

## Provider Consent

### What Is Provider Consent?

When a project belongs to a third-party provider (not the admin themselves), the admin must confirm that the provider has given permission to list their project on Soft Showcase before publishing.

### Who Confirms Consent?

The platform **administrator** confirms consent. This represents the admin's assurance that they have communicated with the provider and received permission.

### When Is Consent Required?

Consent must be confirmed before a project associated with a third-party provider can be published. If `providerConsentConfirmed = false`, the server blocks publication.

### Consent in the Admin UI

When creating or editing a provider, the admin sees a confirmation checkbox:

```
☐ I confirm that this provider has given permission to list their
  projects on Soft Showcase and to route customer inquiries to their
  contact details.
```

Until this box is checked, the provider's `providerConsentConfirmed` remains `false` and no project linked to them can be published.

### Publication Gate (Server-Side)

The server enforces this rule — it is not merely a UI warning:

```typescript
if (!provider.providerConsentConfirmed) {
  throw new Error("Provider consent has not been confirmed. Cannot publish.");
}
```

---

## Provider Lifecycle

```
Admin creates provider
        ↓
Admin confirms provider consent (providerConsentConfirmed = true)
        ↓
Provider is active by default
        ↓
Admin assigns provider to projects
        ↓
Customer sees provider info on project page
        ↓
Customer contacts provider via WhatsApp or Email
        ↓
[If provider becomes unavailable]
        ↓
Admin sets isActive = false
        ↓
Existing projects remain (not deleted)
        ↓
Contact buttons hidden on all that provider's published projects
        ↓
Projects cannot be published without a different active provider
```

---

## Provider Contact Settings

Each provider has two visibility flags that control which contact methods appear on project pages:

| Setting | Effect |
|---|---|
| `showWhatsapp = true` + `whatsappNumber` set | WhatsApp button shown |
| `showWhatsapp = false` OR `whatsappNumber` is null | WhatsApp button hidden |
| `showEmail = true` + `email` set | Email inquiry button shown |
| `showEmail = false` | Email inquiry button hidden |

### Valid Combinations

| showWhatsapp | showEmail | Result |
|---|---|---|
| true + number set | true | Both buttons shown |
| true + number set | false | Only WhatsApp shown |
| false | true | Only Email shown |
| false | false | "Contact unavailable" message; admin warned |

---

## Provider Deactivation (Server-Side Rules)

When an admin deactivates a provider (`isActive = false`), the server enforces:

1. **Existing projects are NOT deleted.** They remain in the database.
2. **Contact buttons are hidden** server-side on all published projects with this provider — no static caching can bypass this.
3. **New projects cannot be published** with this provider until they are reactivated.
4. **The provider cannot receive new inquiries** because contact buttons are hidden.
5. **Existing inquiries are preserved** and still reference the original providerId.

> **Recommended behavior:** Admin should reassign a different active provider to any published projects before deactivating a provider.

---

## Provider-Project Routing

```
one Provider → many Projects
one Project  → one Provider
```

This is a **one-to-many** relationship.

A provider can have multiple projects.
A project has exactly one provider.

**Provider routing is ALWAYS project-specific:**

```
Project A → Provider A → Provider A's WhatsApp / Email
Project B → Provider B → Provider B's WhatsApp / Email
```

There is NO global fallback number or email. If Provider A has no WhatsApp number, Project A shows no WhatsApp button. Provider B's number is never used for Project A under any circumstances.

---

## Provider Contact Privacy

The provider's email address is a **private field** by default.

The platform never exposes the raw email address to the public. The preferred flow:

```
Customer clicks "Send Email Inquiry"
        ↓
Form displayed (customer fills in their name, email, message)
        ↓
Server validates input
        ↓
Server looks up: project → provider → provider.email
        ↓
Email sent to provider.email using the email API
        ↓
provider.email never leaves the server
```

The customer never submits a `provider_email` field. The server always determines the recipient from the database.

---

## WhatsApp Number Format

WhatsApp numbers must be stored in international format:

```
+[country code][number]
Example: +919876543210
```

When generating the WhatsApp link:

```
https://wa.me/[number without +]?text=[encoded message]
Example: https://wa.me/919876543210?text=Hi...
```

If `whatsappNumber` is null or empty, the WhatsApp button is not shown. There is no default or fallback number.

---

## Multiple Providers Example

```
Project A: AI Resume Analyzer
  Provider: Varun
  WhatsApp: +91XXXXXXXXXX
  Email: varun@example.com

Project B: Smart Parking System
  Provider: Rahul
  WhatsApp: +91XXXXXXXXXX
  Email: rahul@example.com

Project C: E-Commerce Template
  Provider: Ajay
  WhatsApp: +91XXXXXXXXXX
  Email: ajay@example.com
```

If a customer opens Project A and clicks WhatsApp → they get **Varun's** WhatsApp only.
If a customer opens Project B and clicks WhatsApp → they get **Rahul's** WhatsApp only.

This routing is **enforced by the server**, not the UI.

---

## Admin Responsibilities for Providers

1. Verify provider's identity and contact details.
2. Confirm provider consent before listing their projects.
3. Ensure provider contact details are accurate.
4. Update provider details when they change.
5. Deactivate providers who are no longer available.
6. Reassign projects when providers change.

---

## Future: Provider Accounts

In a future version, providers may receive login credentials to:

- View their inquiry list
- Update their contact details (with admin approval)
- Upload their own projects (pending admin approval)

The database schema is designed to accommodate this.
