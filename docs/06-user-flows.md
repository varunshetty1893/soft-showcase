# 06 — User Flows

## Flow 1: Visitor Browses and Contacts via WhatsApp

```
START: Visitor opens Soft Showcase homepage
        ↓
Views hero section and featured projects
        ↓
Clicks "Browse Projects" or a featured project
        ↓
Lands on /projects catalog
        ↓
Optionally applies filters (category, technology)
        ↓
Reads project cards (title, short description, tech tags)
        ↓
Clicks a project card
        ↓
Lands on /projects/[slug]
        ↓
Reads full description
        ↓
Views screenshots (gallery)
        ↓
Reviews features list
        ↓
Reviews specifications
        ↓
Sees "Interested in this project?" section
        ↓
Clicks "Discuss on WhatsApp"
        ↓
Browser opens wa.me link with pre-filled message
        ↓
WhatsApp opens with provider's number + pre-filled text
        ↓
Visitor sends message
        ↓
Provider receives WhatsApp message
END
```

---

## Flow 2: Visitor Submits Email Inquiry

```
START: Visitor is on /projects/[slug]
        ↓
Clicks "Send Email Inquiry"
        ↓
Inquiry form appears (modal or section below)
        ↓
Visitor fills in:
  - Name
  - Email
  - WhatsApp (optional)
  - Message
        ↓
Visitor clicks "Send Inquiry"
        ↓
Client sends POST /api/inquiries
        ↓
Server validates form (Zod)
        ↓
[If validation fails]
  → Errors shown on form
  → Flow ends
[If validation passes]
        ↓
Server resolves: project → provider → provider.email
        ↓
Server stores inquiry in database (status: NEW)
        ↓
Server sends email to provider
        ↓
Server sends confirmation to visitor (optional)
        ↓
Client shows success message:
  "Your inquiry has been sent to the provider."
END
```

---

## Flow 3: Visitor Submits Custom Project Request

```
START: Visitor clicks "Request Custom Project" (homepage CTA or nav link)
        ↓
Lands on /custom-project
        ↓
Fills in form:
  - Name
  - Email
  - WhatsApp (optional)
  - Project title
  - Category
  - Technology preference
  - Description
  - Required features
  - Deadline
  - Budget
  - Additional requirements
        ↓
Clicks "Submit Request"
        ↓
Server validates
        ↓
Server stores custom request in database
        ↓
Server sends email to ADMIN (not a provider)
        ↓
Server sends confirmation to visitor
        ↓
Success page or message shown
END
```

---

## Flow 4: Admin Imports a Project

```
START: Admin has project information (from developer or AI assistant)
        ↓
Admin asks AI assistant:
  "Generate Soft Showcase JSON for this project based on the template."
        ↓
AI generates structured JSON
        ↓
Admin copies JSON
        ↓
Admin opens /admin/projects/import
        ↓
Admin pastes JSON into import textarea
        ↓
Clicks "Validate"
        ↓
Server parses JSON
        ↓
Zod validation runs
        ↓
[If invalid]
  → Errors shown with field-level details
  → Admin corrects JSON
[If valid]
        ↓
Preview shown:
  - Title
  - Description
  - Category
  - Technologies
  - Features
  - Specs
  - Price mode
  - Provider (matched or to be created)
        ↓
Admin reviews preview
        ↓
Admin clicks "Import as Draft"
        ↓
Server creates project with status: DRAFT
        ↓
Admin redirected to project edit page
        ↓
Admin uploads screenshots
        ↓
Admin verifies provider assignment
        ↓
Admin reviews all content
        ↓
Admin redirected to project edit page
        ↓
Admin uploads screenshots
        ↓
Admin verifies provider assignment
        ↓
Admin reviews all content
        ↓
Admin clicks "Publish"
        ↓
Server evaluates publication gate:
  - Provider assigned and active?
  - At least one contact method enabled and populated?
  - Provider consent confirmed?
[If gate fails]
  → Server returns validation error; project remains DRAFT
[If gate passes]
        ↓
Project status → PUBLISHED
END
```

---

## Flow 5: Admin Creates Provider

```
START: Admin opens /admin/providers/new
        ↓
Fills in:
  - Provider Name
  - Email
  - WhatsApp Number
  - Bio
  - Show Email (toggle)
  - Show WhatsApp (toggle)
  - Active (toggle, default: true)
  - Provider Consent Confirmed (checkbox: confirms permission obtained)
        ↓
Clicks "Save Provider"
        ↓
Server validates (Zod)
        ↓
[If invalid]
  → Field errors shown
[If valid]
        ↓
Provider created in database (with providerConsentConfirmed and timestamp)
        ↓
Admin redirected to provider list
        ↓
Admin can now assign this provider to projects
END
```

---

## Flow 6: Customer Creates Account (Optional)

```
START: Visitor clicks "Sign In" in navbar
        ↓
Redirected to /login
        ↓
Clicks "Sign in with Google"
        ↓
Google OAuth flow
        ↓
User grants permission
        ↓
NextAuth creates session
        ↓
If first login: user created in database (isAdmin: false)
        ↓
User redirected to their previous page or /
END
```

---

## Flow 7: Admin Deactivates Provider

```
START: Admin opens /admin/providers/[id]/edit
        ↓
Clicks "Deactivate Provider"
        ↓
Confirmation dialog shown:
  "Deactivating this provider will hide contact options
   on all their projects. Projects will NOT be deleted.
   Are you sure?"
        ↓
Admin confirms
        ↓
Server sets is_active = false
        ↓
Admin sees warning banner listing affected projects
        ↓
Admin should assign a new provider to affected published projects
END
```

---

## Flow 8: Admin Updates Inquiry Status

```
START: Admin opens /admin/inquiries
        ↓
Sees list of inquiries (newest first)
        ↓
Clicks on an inquiry
        ↓
Views inquiry details:
  - Customer name, email, WhatsApp
  - Project name
  - Provider name
  - Message
  - Submission date
  - Current status
  - Notification status (SENT, PENDING, FAILED)
        ↓
Admin selects new status:
  NEW → CONTACTED → DISCUSSING → QUOTED → CLOSED
        ↓
Optionally adds admin note
        ↓
Clicks "Update"
        ↓
Status updated in database
        ↓
Audit log entry created
END
```
