# 02 — Business Model

## Overview

Soft Showcase operates as a **project catalog and lead-generation platform**. It does NOT process payments or charge commissions in V1.

---

## Customer Journey (Full Flow)

```
Visitor arrives at Soft Showcase
        ↓
Browses project catalog (/projects)
        ↓
Applies filters (category, technology, type)
        ↓
Opens project detail page (/projects/[slug])
        ↓
Reads description
        ↓
Views screenshots
        ↓
Reviews features and specifications
        ↓
Decides to contact provider
        ↓
Chooses communication method:
    ├── WhatsApp → Opens wa.me link with pre-filled message
    └── Email → Submits inquiry form on Soft Showcase
        ↓
Provider receives contact
        ↓
Provider discusses price, customization, delivery
        ↓
Payment handled OUTSIDE Soft Showcase
        ↓
Provider delivers project
```

---

## Revenue Model (V1)

There is **no revenue model built into the platform** in V1.

The platform owner monetizes separately (e.g., flat listing fee, direct arrangement with providers) — this is handled entirely outside the platform.

---

## Revenue Model (Future Considerations)

These are **not implemented in V1** but the architecture should not prevent them:

| Future Feature | Notes |
|---|---|
| Listing fees | Charge providers to list projects |
| Featured placement | Charge for homepage/category featured slots |
| Commission tracking | Manual commission logging |
| Provider subscription | Monthly fee for provider accounts |
| Premium inquiry routing | Priority leads for premium providers |

---

## Key Stakeholders

| Stakeholder | Role |
|---|---|
| Platform Owner / Admin | Manages the platform, imports projects, manages providers |
| Project Providers | Create/supply the projects; receive leads |
| Visitors | Browse projects |
| Customers | Visitors who submit inquiries or requests |

---

## What the Platform Facilitates

```
Soft Showcase Platform
├── Showcases projects (catalog)
├── Provides project details (spec, features, screenshots)
├── Routes customers to providers (WhatsApp / Email)
├── Captures inquiries (email form → stored + forwarded)
└── Captures custom requests (sent to admin)
```

---

## What Happens OUTSIDE the Platform

```
Outside Soft Showcase
├── Price negotiation (Provider ↔ Customer)
├── Payment (Provider ↔ Customer)
├── Delivery (Provider → Customer)
├── Support after delivery (Provider → Customer)
└── Commission settlement (Admin ↔ Provider, if any)
```

---

## Provider Business Relationship

Providers are NOT employees or contractors of Soft Showcase.

They are independent entities whose projects are showcased on the platform.

The platform administrator:

1. Gets consent from the provider to list their project.
2. Adds the provider's contact information.
3. Creates the project listing.
4. Routes customer inquiries to the provider.

The provider:

1. Receives customer inquiries via WhatsApp or Email.
2. Handles all negotiations independently.
3. Accepts payment outside the platform.
4. Delivers the project directly to the customer.

---

## Inquiry Lifecycle (Email Channel)

```
Customer submits inquiry form
        ↓
Server validates form data
        ↓
Server looks up: project → provider → provider email
        ↓
Email sent to provider
        ↓
Confirmation email sent to customer
        ↓
Inquiry stored in database with status: NEW
        ↓
Admin can view inquiry in dashboard
        ↓
Admin can update status manually:
    NEW → CONTACTED → DISCUSSING → QUOTED → CLOSED
```

---

## Inquiry Lifecycle (WhatsApp Channel)

```
Customer clicks "Discuss on WhatsApp"
        ↓
App generates wa.me link with provider number + pre-filled message
        ↓
Browser/app opens WhatsApp
        ↓
Customer sends message directly to provider
        ↓
[V1: No automatic tracking of WhatsApp inquiries]
```

> **Note:** WhatsApp clicks are not automatically stored as inquiries in V1. Future versions may add click tracking and webhook-based message tracking.

---

## Platform Fees (V1)

**None.**

No transaction fees. No listing fees. No commission. All commercial arrangements are between provider and customer.
