# 36 — Development Roadmap

## Overview

Soft Showcase is developed in 21 sequential phases. Each phase builds on the previous one.

**Current status:** Phase 3 — PostgreSQL + Prisma ✅ Complete (pending Neon credentials for migration)

---

## Phases

### Phase 1 — Documentation ✅

**Goal:** Complete specification and documentation before writing any code.

Deliverables:
- [x] All 36 docs/ files
- [x] README.md
- [x] .env.example
- [x] .gitignore
- [x] Project import template

---

### Phase 2 — Architecture ✅

**Goal:** Set up the project scaffold without implementing features.

Deliverables:
- [x] Initialize Next.js 15 project (`npx create-next-app@latest ./`)
- [x] Configure TypeScript strictly
- [x] Set up folder structure (app/, components/, lib/, etc.)
- [x] Configure Tailwind CSS
- [x] Configure `next.config.ts`
- [x] Configure `tsconfig.json`
- [x] Set up path aliases (`@/`)
- [x] Install base dependencies (NextAuth, Prisma, Zod, etc.)
- [x] Create `.env.example` in project

**Commit:** `feat: initialize soft-showcase next.js architecture`

---

### Phase 3 — PostgreSQL + Prisma ✅

**Goal:** Connect to the database and define the schema.

Deliverables:
- [x] Create Neon project and database ← **YOU must do this: set DATABASE_URL + DIRECT_URL in .env.local, then run `npm run db:migrate`**
- [x] Install Prisma
- [x] Write `prisma/schema.prisma` (full schema from docs)
- [x] Run `npx prisma migrate dev --name init` ← **Run after setting Neon credentials**
- [x] Create Prisma client singleton (`lib/db/client.ts`)
- [x] Write seed script (`prisma/seed.ts`) with:
  - Default categories
  - Default technologies
  - Admin user (with isAdmin: true)

**Commit:** `feat: add postgresql schema and prisma orm`

---

### Phase 4 — Authentication

**Goal:** Google OAuth login working end-to-end.

Deliverables:
- [ ] Install NextAuth.js v5
- [ ] Configure Google OAuth provider (`lib/auth/auth.ts`)
- [ ] Create NextAuth API handler (`app/api/auth/[...nextauth]/route.ts`)
- [ ] Create session helper (`lib/auth/session.ts`)
- [ ] Create admin auth guard (middleware or layout)
- [ ] Create sign-in page (`app/(auth)/login/page.tsx`)
- [ ] Add sign-in button to navbar
- [ ] Test: Sign in with Google → user created → isAdmin works

**Commit:** `feat: add google oauth authentication`

---

### Phase 5 — Design System

**Goal:** Build the reusable component library and visual foundation.

Deliverables:
- [ ] Install shadcn/ui
- [ ] Configure Google Fonts (Inter)
- [ ] Define color tokens in Tailwind config
- [ ] Build base UI components (Button, Card, Input, Badge, etc.)
- [ ] Build layout components (Navbar, Footer)
- [ ] Define typography scale
- [ ] Test responsive layout on mobile, tablet, desktop

**Commit:** `feat: add design system and base components`

---

### Phase 6 — Public Website

**Goal:** The public-facing marketing site is live with static content.

Deliverables:
- [ ] Homepage with all sections (hero, features, categories, how it works, CTA, footer)
- [ ] `/custom-project` page with form
- [ ] 404 page
- [ ] Error boundary page
- [ ] Sitemap and robots.txt
- [ ] Basic SEO metadata

**Commit:** `feat: add public homepage and marketing pages`

---

### Phase 7 — Project Catalog

**Goal:** Visitors can browse and filter published projects.

Deliverables:
- [ ] `/projects` page with project grid
- [ ] `ProjectCard` component
- [ ] Category filter sidebar
- [ ] Technology filter
- [ ] Search bar
- [ ] Pagination
- [ ] Empty state
- [ ] Loading skeleton

**Commit:** `feat: add project catalog with search and filters`

---

### Phase 8 — Project Detail

**Goal:** Full project detail pages are live.

Deliverables:
- [ ] `/projects/[slug]` page with all sections
- [ ] `ProjectGallery` with lightbox
- [ ] Features list
- [ ] Specifications table
- [ ] FAQ accordion
- [ ] Provider card (no contact yet)
- [ ] Related projects section
- [ ] Static generation + revalidation
- [ ] SEO metadata per project

**Commit:** `feat: add project detail pages`

---

### Phase 9 — Provider Management (Admin)

**Goal:** Admin can manage providers.

Deliverables:
- [ ] Admin layout with sidebar
- [ ] `/admin/providers` list
- [ ] `/admin/providers/new` create form
- [ ] `/admin/providers/[id]/edit` edit form
- [ ] Provider deactivation with confirmation
- [ ] Validation (Zod)
- [ ] Audit logging

**Commit:** `feat: add provider management admin pages`

---

### Phase 10 — Project Management (Admin)

**Goal:** Admin can create, edit, and manage projects.

Deliverables:
- [ ] `/admin/projects` list
- [ ] `/admin/projects/new` create form (all sections)
- [ ] `/admin/projects/[id]/edit` edit form
- [ ] Provider selector (auto-loads provider contact info)
- [ ] Feature list editor
- [ ] Spec editor
- [ ] FAQ editor
- [ ] Status management (Draft/Published/Archived)
- [ ] Featured toggle
- [ ] Slug auto-generation

**Commit:** `feat: add project management admin pages`

---

### Phase 11 — WhatsApp Contact

**Goal:** WhatsApp contact flow is live.

Deliverables:
- [ ] `/api/projects/[slug]/whatsapp` route
- [ ] `generateWhatsAppUrl()` utility
- [ ] `WhatsAppButton` component
- [ ] Rate limiting on WhatsApp endpoint
- [ ] Contact button logic (show/hide based on provider settings)
- [ ] Test: Project A → Provider A's WhatsApp only

**Commit:** `feat: add whatsapp contact flow`

---

### Phase 12 — Email Inquiry

**Goal:** Email inquiry system is live end-to-end.

Deliverables:
- [ ] Email service (`lib/email/`)
- [ ] Gmail SMTP provider implementation (port 465 SSL)
- [ ] Email templates (provider inquiry, customer confirmation)
- [ ] `/api/inquiries` route
- [ ] `InquiryForm` + `InquiryModal` components
- [ ] Rate limiting on inquiry endpoint
- [ ] Inquiry stored in DB
- [ ] Provider receives email
- [ ] Customer receives confirmation
- [ ] Security test: provider_email injection blocked

**Commit:** `feat: add email inquiry system`

---

### Phase 13 — Project Import

**Goal:** Admin can import projects from AI-generated JSON.

Deliverables:
- [ ] Zod import schema
- [ ] `/api/admin/projects/import` route
- [ ] `/admin/projects/import` page
- [ ] JSON paste + validate UI
- [ ] Import preview
- [ ] Provider matching/creation logic
- [ ] Create project as DRAFT on import
- [ ] Audit log on import
- [ ] `docs/23-project-import-template.md` (standalone copy for AI prompts)

**Commit:** `feat: add project json import system`

---

### Phase 14 — Image Storage

**Goal:** Admin can upload screenshots to projects.

Deliverables:
- [ ] Cloudinary integration (`lib/storage/`)
- [ ] `/api/admin/uploads` route
- [ ] File validation (type, size)
- [ ] `ImageUploader` component (drag-and-drop)
- [ ] Project gallery reorder
- [ ] Primary image selection
- [ ] Alt text editing
- [ ] Image deletion
- [ ] next.config.ts remotePatterns for Cloudinary

**Commit:** `feat: add cloudinary image storage and upload`

---

### Phase 15 — Customer Area

**Goal:** Logged-in customers can track their inquiries and view profile.

Deliverables:
- [ ] `/profile` settings
- [ ] `/my-inquiries` list
- [ ] `/my-requests` list

**Commit:** `feat: add customer area`

---

### Phase 16 — Admin Dashboard

**Goal:** Full admin dashboard with stats and recent activity.

Deliverables:
- [ ] `/admin` dashboard with real stats from DB
- [ ] Inquiry management (`/admin/inquiries`)
- [ ] Custom request management (`/admin/custom-requests`)
- [ ] Audit log view (`/admin/audit-logs`)
- [ ] Admin notification for inactive-provider published projects

**Commit:** `feat: add admin dashboard and inquiry management`

---

### Phase 17 — Custom Project Request

**Goal:** Visitors can request custom projects.

Deliverables:
- [ ] `/api/custom-requests` route
- [ ] Full form validation
- [ ] Email to admin
- [ ] Confirmation to customer
- [ ] Rate limiting

**Commit:** `feat: add custom project request system`

---

### Phase 18 — Security Hardening

**Goal:** Security audit and hardening before production.

Deliverables:
- [ ] Review all Zod schemas
- [ ] Verify provider email routing (security test)
- [ ] Add secure headers to next.config.ts
- [ ] File upload security review
- [ ] Rate limiting on all public endpoints
- [ ] Error message audit (no technical leaks)
- [ ] Admin access test (every admin route)
- [ ] Environment variable audit

**Commit:** `feat: security hardening and review`

---

### Phase 19 — SEO

**Goal:** Full SEO implementation.

Deliverables:
- [ ] Metadata on all pages
- [ ] Dynamic metadata on project pages
- [ ] OpenGraph images
- [ ] Sitemap generation
- [ ] Robots.txt
- [ ] Static generation for project pages
- [ ] Canonical URLs

**Commit:** `feat: add seo metadata and sitemap`

---

### Phase 20 — Testing

**Goal:** Core test coverage before deployment.

Deliverables:
- [ ] Provider routing tests (critical)
- [ ] Email routing security test
- [ ] Zod validation tests
- [ ] API route tests
- [ ] E2E: inquiry submission
- [ ] E2E: WhatsApp link
- [ ] E2E: project import

**Commit:** `feat: add core test suite`

---

### Phase 21 — Production Deployment

**Goal:** Platform is live and verified.

Deliverables:
- [ ] Vercel deployment configured
- [ ] Neon production database
- [ ] All environment variables set in Vercel
- [ ] Google OAuth production credentials
- [ ] Email API production key
- [ ] Cloudinary production credentials
- [ ] Production smoke tests
- [ ] Domain configured (optional)
- [ ] HTTPS verified
- [ ] Admin user set in production DB

**Commit:** `feat: production deployment ready`

---

## Phase Timeline Estimate

| Phase | Estimated Time |
|---|---|
| 1 — Documentation | 1 day |
| 2 — Architecture | 0.5 day |
| 3 — PostgreSQL + Prisma | 0.5 day |
| 4 — Authentication | 1 day |
| 5 — Design System | 2 days |
| 6 — Public Website | 2 days |
| 7 — Project Catalog | 2 days |
| 8 — Project Detail | 2 days |
| 9 — Provider Management | 1 day |
| 10 — Project Management | 2 days |
| 11 — WhatsApp | 0.5 day |
| 12 — Email Inquiry | 1 day |
| 13 — Project Import | 1.5 days |
| 14 — Image Storage | 1.5 days |
| 15 — Customer Dashboard | 1 day |
| 16 — Admin Dashboard | 1.5 days |
| 17 — Custom Project Request | 0.5 day |
| 18 — Security Hardening | 1 day |
| 19 — SEO | 0.5 day |
| 20 — Testing | 1 day |
| 21 — Production Deployment | 1 day |
| **Total** | **~25 days** |

Actual timeline depends on developer speed and number of iterations.
