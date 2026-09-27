# 26 — Custom Project System

## Overview

The custom project system allows any visitor to request a completely new, custom-built software project. These requests go directly to the platform administrator (not to a specific project provider).

This is different from a project inquiry:

| | Project Inquiry | Custom Request |
|---|---|---|
| Trigger | Customer interested in an existing project | Customer needs a new project built |
| Recipient | Project provider | Platform administrator |
| Stored in | `inquiries` table | `custom_project_requests` table |
| URL | `/projects/[slug]` (form) | `/custom-project` |

---

## Custom Project Request Form

**URL:** `/custom-project`

### Fields

| Field | Required | Type | Description |
|---|---|---|---|
| Name | Yes | Text | Customer's name |
| Email | Yes | Email | Customer's email |
| WhatsApp | No | Tel | Customer's WhatsApp (optional) |
| Project Title | Yes | Text | What they want built |
| Category | Yes | Select | From existing categories |
| Technology Preference | No | Multi-select | Tech they prefer/know |
| Description | Yes | Textarea | Detailed project description |
| Required Features | Yes | Textarea | Must-have features |
| Deadline | No | Date | When they need it |
| Budget | No | Text | Budget range (free text) |
| Additional Requirements | No | Textarea | Anything else |

---

## Custom Request Flow

```
Customer fills out form at /custom-project
        ↓
POST /api/custom-requests
        ↓
Rate limiter check
        ↓
Zod validation
        ↓
INSERT into custom_project_requests table
        ↓
Send email to admin (ADMIN_EMAIL from env)
        ↓
Send confirmation email to customer
        ↓
Return success message
```

---

## Validation Rules

| Field | Validation |
|---|---|
| Name | 2–100 characters |
| Email | Valid email format |
| WhatsApp | International format if provided |
| Project Title | 5–200 characters |
| Category | Must be a non-empty string |
| Description | 20–5000 characters |
| Required Features | 10–5000 characters |
| Budget | Max 100 characters (free text) |

---

## Admin Management of Custom Requests

Admin page: `/admin/custom-requests`

The admin can:

- View all custom project requests
- Filter by: status, date, category
- View full request details
- Update status
- Add internal notes
- Contact the customer manually via email or WhatsApp

---

## Custom Request Status

| Status | Description |
|---|---|
| `NEW` | Just received, not reviewed |
| `REVIEWING` | Admin is reviewing |
| `CONTACTED` | Admin has responded to customer |
| `IN_PROGRESS` | Project being built |
| `COMPLETED` | Project delivered |
| `DECLINED` | Request declined |

---

## Email Notification (to Admin)

**Subject:** New Custom Project Request — Soft Showcase

Includes:
- Customer contact details
- Project title and category
- Description
- Required features
- Budget and deadline
- Link to admin dashboard

---

## Email Confirmation (to Customer)

**Subject:** Your Custom Project Request Has Been Received — Soft Showcase

Message:
```
Hi [Name],

Thank you for submitting your custom project request for:

[Project Title]

Our team will review your requirements and get in touch via the contact details you provided.

Best regards,
Soft Showcase Team
```

---

## Rate Limiting

Custom project requests are limited to **2 per IP per hour** to prevent spam.

---

## Custom Request vs Regular Inquiry

This is an intentional design distinction:

- **Custom project requests** go to the admin — they're about building something new.
- **Project inquiries** go to the provider — they're about an existing project.

The admin can then decide to:
1. Handle the custom project themselves
2. Assign it to one of their providers
3. Decline it

All of this is handled outside the platform.
