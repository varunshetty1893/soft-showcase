# 25 — Inquiry System

## Overview

The inquiry system captures and manages customer inquiries about specific projects. All inquiries are stored in the database and routed to the correct project provider.

---

## Inquiry Model

```prisma
model Inquiry {
  id                 String             @id @default(cuid())
  projectId          String
  providerId         String             // Provider at time of inquiry (important!)
  customerId         String?            // Optional — only if customer is logged in
  name               String
  email              String
  whatsapp           String?
  message            String             @db.Text
  contactMethod      ContactMethod      @default(EMAIL)
  status             InquiryStatus      @default(NEW)
  notificationStatus NotificationStatus @default(PENDING) // PENDING, SENT, FAILED
  adminNotes         String?            @db.Text
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
}
```

---

## Inquiry Submission Flow

```
Customer fills inquiry form on /projects/[slug]
        ↓
POST /api/inquiries with:
  { projectId, name, email, whatsapp, message }
        ↓
Rate limiter (3 requests per IP per 15 minutes)
        ↓
Zod validation
        ↓
Lookup: project WHERE id = projectId AND status = PUBLISHED
        ↓
[If not found → 404 error]
        ↓
Lookup: provider via project.providerId
        ↓
Check: provider.isActive AND provider.showEmail AND provider.email exists
        ↓
[If not available → 400 error with message]
        ↓
INSERT inquiry into DB:
  projectId = project.id
  providerId = project.provider.id   ← Captured at submission time
  customerId = session.user.id || null
  name, email, whatsapp, message
  contactMethod = EMAIL
  status = NEW
  notificationStatus = PENDING
        ↓
Send email to provider.email (via email service)
  [If email succeeds] → UPDATE inquiry: notificationStatus = SENT
  [If email fails]    → UPDATE inquiry: notificationStatus = FAILED (logged server-side)
        ↓
Send confirmation to customer (optional)
        ↓
Return { success: true, inquiryId: "..." }
```

---

## Why Provider ID Is Captured at Submission

If the project's provider changes later:

```
Inquiry submitted → providerId = Rahul's ID
Project reassigned to Ajay
Inquiry still shows: Provider = Rahul ✅
```

This ensures historical accuracy and avoids confusion when tracking who received what leads.

---

## Inquiry Status Lifecycle

```
NEW
 ↓
CONTACTED (Admin marks: provider has been in contact)
 ↓
DISCUSSING (Active conversation)
 ↓
QUOTED (Price or proposal sent)
 ↓
CLOSED (Conversation ended, regardless of outcome)
```

**Note:** Status transitions can be non-linear. Admin can move to any status at any time.

---

## Inquiry Admin View

The admin can:

- View all inquiries sorted by date
- Filter by: status, notificationStatus, project, provider, date range
- Click to view full inquiry
- Update status
- Add admin notes
- See customer contact details
- View email notification delivery status (SENT / FAILED)

---

## Inquiry Detail (Admin)

```
Inquiry #ABC123
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Status: NEW                     [Update Status ▼]
Notification: SENT              [Retry Notification if FAILED]

Project:   AI Resume Analyzer   [View Project →]
Provider:  Rahul (rahul@example.com)
Submitted: 25 September 2026, 11:30 AM

Customer
━━━━━━━━
Name:     John Doe
Email:    john@example.com
WhatsApp: +919876543210

Message
━━━━━━━
"I am interested in the AI Resume Analyzer project.
Can you tell me what customization options are available
and what the typical delivery time is?"

Admin Notes
━━━━━━━━━━
[                                        ]
[                                        ]
[ Save Notes ]
```

---

## Customer Inquiry List

Logged-in customers can view their own inquiry history at `/my-inquiries`.

Each inquiry shows:
- Project name
- Date submitted
- Status (customer-friendly language)

Customers do NOT see admin notes. Customer queries are strictly isolated on the server using `where: { customerId: session.user.id }`.

---

## WhatsApp Inquiries (V1)

In V1, WhatsApp contacts are NOT automatically stored as inquiries.

The WhatsApp button generates a link — the customer leaves Soft Showcase to WhatsApp.

**Future:** Track WhatsApp clicks as WHATSAPP contact method inquiries to give providers visibility into WhatsApp leads.

---

## Inquiry Validation

| Field | Required | Validation |
|---|---|---|
| projectId | Yes | Must exist, must be PUBLISHED |
| name | Yes | 2–100 characters |
| email | Yes | Valid email format |
| whatsapp | No | +[digits], 7-15 digits total |
| message | Yes | 10–2000 characters |

---

## Inquiry Security

1. **Rate limiting:** 3 inquiries per IP per 15 minutes
2. **Project validation:** projectId must be a published project
3. **Provider resolution:** Server looks up provider — customer never submits provider details
4. **Email sanitization:** All content is HTML-escaped before templating
5. **No arbitrary recipients:** Server determines all email addresses

---

## Inquiry Notification to Admin

The admin is NOT automatically emailed for every inquiry (this would be noisy).

The admin checks the dashboard regularly.

An optional "Daily Digest" email summarizing new inquiries can be added in V2.

**Exception:** Inquiries on high-priority or featured projects may optionally trigger admin notification.
