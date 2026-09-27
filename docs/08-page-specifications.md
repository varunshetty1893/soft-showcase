# 08 — Page Specifications

This document details every page in the Soft Showcase platform using the standard specification format.

---

## Page: Homepage

| Attribute | Value |
|---|---|
| Page Name | Homepage |
| URL | `/` |
| Purpose | First impression, project discovery, platform introduction |
| User Role | All (Visitor, Customer, Admin) |
| Authentication | Not required |
| Authorization | None |

### Layout

- Full-page layout
- Fixed top navbar
- Sections stack vertically
- Footer at bottom

### Sections

1. **Navbar** — Logo, nav links, sign in button
2. **Hero** — Headline, subheadline, CTA buttons
3. **Featured Projects** — 3–6 featured project cards
4. **Categories** — Category browsing grid
5. **How It Works** — 3-step visual explanation
6. **Why Soft Showcase** — Value proposition cards
7. **Custom Project Request** — CTA section linking to `/custom-project`
8. **Final CTA** — Browse projects button
9. **Footer** — Links, social, copyright

### Components

- `<Navbar />` — includes auth state
- `<HeroSection />`
- `<FeaturedProjects />` — fetches featured=true projects from DB
- `<CategoryGrid />`
- `<HowItWorks />`
- `<WhyUs />`
- `<CustomProjectCTA />`
- `<Footer />`

### Data Required

- Featured projects (from DB: `projects` where `featured=true AND status=PUBLISHED`)
- Category list (from DB: `categories`)

### SEO

- Title: `Soft Showcase — Discover Software Projects`
- Description: "Browse and connect with software project providers on Soft Showcase."
- OG image: platform hero image

### Loading State

Skeleton cards for featured projects section.

### Empty State

If no featured projects: section hidden or shows "Coming soon" message.

---

## Page: Project Catalog

| Attribute | Value |
|---|---|
| Page Name | Project Catalog |
| URL | `/projects` |
| Purpose | Browse and filter all published projects |
| User Role | All |
| Authentication | Not required |
| Authorization | None |

### Layout

- Sidebar filters (desktop) or filter drawer (mobile)
- Project grid (main content area)
- Pagination at bottom

### Sections

1. **Page header** — Title, result count
2. **Filters** (sidebar) — Category, Technology, Project Type, Price Mode
3. **Search bar** — Full-text search on title/description
4. **Sort options** — Newest, Alphabetical, Featured first
5. **Project cards grid**
6. **Pagination**

### Components

- `<ProjectFilters />`
- `<ProjectSearch />`
- `<ProjectCard />` — repeated for each project
- `<Pagination />`
- `<EmptyProjectList />`

### Project Card Fields

- Primary image (thumbnail)
- Title
- Short description
- Category badge
- Technology tags (top 3)
- Price mode badge
- "View Project" button

### Data Required

- Published projects with filters applied
- Total count for pagination
- Category list for filter

### API

`GET /api/projects?category=&tech=&type=&search=&page=&sort=`

### SEO

- Title: `Browse Software Projects — Soft Showcase`
- Canonical: `/projects`
- Robots: index, follow

### Loading State

- Skeleton project cards grid

### Empty State

"No projects found for your search. Try different filters."

### Error State

"Unable to load projects. Please try again."

---

## Page: Project Detail

| Attribute | Value |
|---|---|
| Page Name | Project Detail |
| URL | `/projects/[slug]` |
| Purpose | Full project information and contact options |
| User Role | All |
| Authentication | Not required |
| Authorization | None |

### Layout

- Two-column layout on desktop (content + sidebar)
- Single column on mobile

### Sections

1. **Breadcrumb** — Home > Projects > [Category] > [Title]
2. **Hero** — Primary image, title, category, short description, price mode badge
3. **Overview** — Full markdown/rich-text description
4. **Features** — Bullet list of features
5. **Technology Stack** — Technology tag badges
6. **Screenshots** — Image gallery (lightbox on click)
7. **Specifications** — Key-value spec table
8. **What's Included** — Bullet list
9. **Demo** — Demo URL button if available
10. **Provider Card** — Provider name, bio, contact buttons
11. **FAQ** — Accordion Q&A
12. **Contact Options** — WhatsApp + Email buttons (from provider settings)
13. **Related Projects** — 3 projects from same category

### Forms

**Email Inquiry Modal** (appears when "Send Email Inquiry" is clicked):

| Field | Required | Type |
|---|---|---|
| Name | Yes | Text |
| Email | Yes | Email |
| WhatsApp | No | Tel |
| Message | Yes | Textarea |

### Buttons

- `💬 Discuss on WhatsApp` (conditional on provider.showWhatsapp)
- `✉ Send Email Inquiry` (conditional on provider.showEmail)
- `🔗 View Demo` (conditional on demoUrl)

### Data Required

- Project (all fields)
- Provider (display fields only)
- Project images
- Project features
- Project specifications
- Project FAQs
- Related projects

### API

- `GET /api/projects/[slug]` — load project
- `POST /api/inquiries` — submit email inquiry
- `GET /api/projects/[slug]/whatsapp` — get WhatsApp link

### SEO

- Title: `[Project Title] — Soft Showcase`
- Description: project.shortDescription
- OG image: project primary image
- Canonical: `/projects/[slug]`
- Structured data: Product schema (optional)

### Loading State

Full-page skeleton matching layout.

### Error State

- 404: "This project was not found."
- 500: "Unable to load project. Please try again."

### Mobile Behavior

- Single column layout
- Contact buttons sticky at bottom of screen (floating bar)
- Gallery becomes horizontal scroll

### Accessibility

- All images have alt text
- Gallery has keyboard navigation
- Inquiry form has proper labels
- Contact buttons have descriptive aria-labels

---

## Page: Custom Project Request

| Attribute | Value |
|---|---|
| Page Name | Custom Project Request |
| URL | `/custom-project` |
| Purpose | Allow visitors to request a custom-built project |
| User Role | All |
| Authentication | Not required |
| Authorization | None |

### Form Fields

| Field | Required | Type |
|---|---|---|
| Name | Yes | Text |
| Email | Yes | Email |
| WhatsApp | No | Tel |
| Project Title | Yes | Text |
| Category | Yes | Select |
| Technology Preference | No | Multi-select |
| Description | Yes | Textarea |
| Required Features | Yes | Textarea |
| Deadline | No | Date |
| Budget | No | Text |
| Additional Requirements | No | Textarea |

### Actions

- Submit → `POST /api/custom-requests`
- Server validates, stores, emails admin
- Success message shown

### SEO

- Title: `Request a Custom Project — Soft Showcase`
- Description: "Tell us about the project you need. Our team will get in touch."

---

## Page: Admin Dashboard

| Attribute | Value |
|---|---|
| Page Name | Admin Dashboard |
| URL | `/admin` |
| Purpose | Overview of platform health and recent activity |
| User Role | Admin only |
| Authentication | Required |
| Authorization | isAdmin === true |

### Sections

1. **Stats row** — Total projects, published, drafts, providers, inquiries (new), custom requests
2. **Recent Inquiries** — Last 5 inquiries
3. **Recent Projects** — Last 5 projects created/updated
4. **Quick Actions** — Links to create project, import project, create provider

### Data Required

- Aggregated counts from: projects, providers, inquiries, custom_project_requests
- Recent records

### SEO

- No-index (admin page)

---

## Page: Admin Provider List

| Attribute | Value |
|---|---|
| Page Name | Provider List |
| URL | `/admin/providers` |
| Purpose | View and manage all project providers |
| User Role | Admin only |
| Authentication | Required |
| Authorization | isAdmin === true |

### Content

- Table of all providers
- Columns: Name, Email, WhatsApp, Active, Projects count, Actions
- Actions: Edit, Deactivate/Activate, View Projects

### Buttons

- `+ Add Provider` → `/admin/providers/new`

---

## Page: Admin Provider Form (Create/Edit)

| Attribute | Value |
|---|---|
| Page Name | Provider Form |
| URL | `/admin/providers/new` or `/admin/providers/[id]/edit` |
| Purpose | Create or edit a project provider |
| User Role | Admin only |

### Form Fields

| Field | Required | Type |
|---|---|---|
| Display Name | Yes | Text |
| Email | Yes | Email |
| WhatsApp Number | No | Tel |
| Bio | No | Textarea |
| Show Email | No | Toggle |
| Show WhatsApp | No | Toggle |
| Active | No | Toggle (default: true) |
| Provider Consent Confirmed | Yes | Checkbox (confirms permission obtained from provider) |

### Validation

- Name: 2–100 characters, required
- Email: valid format, required, unique
- WhatsApp: international format if provided
- Duplicate email detection
- Consent confirmation required prior to publishing associated projects

---

## Page: Admin Project Import

| Attribute | Value |
|---|---|
| Page Name | Project Import |
| URL | `/admin/projects/import` |
| Purpose | Import a project from AI-generated or manually created JSON |
| User Role | Admin only |

### Sections

1. **Instructions** — How to use the import feature, link to template
2. **JSON Input** — Large textarea
3. **Validate Button**
4. **Preview Panel** — Shows parsed project data
5. **Import Button** — Creates project as DRAFT

### States

- Empty: Instructions shown
- JSON entered: Validate button enabled
- Validation errors: Field-level error messages shown
- Validation passed: Preview panel shown
- Imported: Redirect to project edit page

---

## Page: Admin Project Edit

| Attribute | Value |
|---|---|
| Page Name | Project Edit |
| URL | `/admin/projects/[id]/edit` |
| Purpose | Edit all aspects of a project |
| User Role | Admin only |

### Tabs/Sections

1. **Basic** — Title, slug, short description, full description (rendered as Markdown)
2. **Classification** — Category, project type, technologies
3. **Features** — Feature list (add/remove)
4. **Specifications** — Key-value pairs
5. **Pricing** — Price mode, price (conditional validation)
6. **Provider** — Provider selector + display of provider contact
7. **Media** — Screenshots, demo URL
8. **Content** — What's included, FAQ
9. **Publishing** — Status (DRAFT / PUBLISHED / ARCHIVED), featured toggle

### Important UX & Server-Side Publication Gate

When admin selects a Provider, the UI immediately shows:

- Provider email
- Provider WhatsApp
- Provider active status
- Provider consent confirmation status

The admin does NOT retype provider contact details.

**Publication Gate:** Setting status to `PUBLISHED` requires:
- Assigned provider is active (`isActive = true`)
- Provider consent is confirmed (`providerConsentConfirmed = true`)
- At least one contact method is enabled and populated
- Price is set if mode is `FIXED` or `STARTING_FROM`

If any requirement is missing, the server rejects publication with clear error feedback.

---

## Page: Admin Inquiry Detail

| Attribute | Value |
|---|---|
| Page Name | Inquiry Detail |
| URL | `/admin/inquiries/[id]` |
| Purpose | View and manage a single inquiry |
| User Role | Admin only |

### Content

- Customer: name, email, whatsapp
- Project: title, link
- Provider: name, email
- Message
- Contact method (EMAIL / WHATSAPP)
- Current status (`NEW`, `CONTACTED`, `DISCUSSING`, `QUOTED`, `CLOSED`)
- Notification status (`PENDING`, `SENT`, `FAILED`) with retry trigger if failed
- Admin notes
- Timestamps

### Actions

- Update status dropdown
- Add admin note
- Retry notification email (if failed)
- Save changes
