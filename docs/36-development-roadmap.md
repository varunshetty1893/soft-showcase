# 36 — Development Roadmap

## Overview

Soft Showcase is developed in 21 sequential phases. Each phase builds on the previous one.

**Current status:** All 21 Phases Complete ✅ — Platform Production-Ready

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
- [x] Create Neon project and database
- [x] Install Prisma
- [x] Write `prisma/schema.prisma` (full schema from docs)
- [x] Run `npx prisma migrate dev --name init`
- [x] Create Prisma client singleton (`lib/db/client.ts`)
- [x] Write seed script (`prisma/seed.ts`) with:
  - Default categories
  - Default technologies
  - Admin user (with isAdmin: true)

**Commit:** `feat: add postgresql schema and prisma orm`

---

### Phase 4 — Authentication ✅

**Goal:** Google OAuth and Credentials login working end-to-end.

Deliverables:
- [x] Install NextAuth.js v5
- [x] Configure Google OAuth & Credentials providers (`lib/auth/auth.ts`)
- [x] Create NextAuth API handler (`app/api/auth/[...nextauth]/route.ts`)
- [x] Create session helper (`lib/auth/session.ts`)
- [x] Create admin auth guard (middleware and layouts)
- [x] Create sign-in page (`app/(auth)/login/page.tsx`)
- [x] Add sign-in button and user menu to navbar
- [x] Test: Sign in with Google & Credentials → user created → isAdmin works

**Commit:** `feat: add google oauth authentication`

---

### Phase 5 — Design System ✅

**Goal:** Build the reusable component library and visual foundation.

Deliverables:
- [x] Install design tokens and Tailwind CSS typography
- [x] Configure Google Fonts (Inter)
- [x] Define color tokens in Tailwind config
- [x] Build base UI components (Button, Card, Input, Badge, Textarea, Label, etc.)
- [x] Build layout components (Navbar, Footer, UserNavDropdown)
- [x] Define typography scale
- [x] Test responsive layout on mobile, tablet, desktop

**Commit:** `feat: add design system and base components`

---

### Phase 6 — Public Website ✅

**Goal:** The public-facing marketing site is live with rich content.

Deliverables:
- [x] Homepage with all sections (hero, features, categories, how it works, CTA, footer)
- [x] `/custom-project` page with form
- [x] 404 page (`app/not-found.tsx`)
- [x] Error boundary page (`app/error.tsx`)
- [x] Sitemap (`app/sitemap.ts`) and robots.txt (`app/robots.ts`)
- [x] Basic SEO metadata and OpenGraph tags

**Commit:** `feat: add public homepage and marketing pages`

---

### Phase 7 — Project Catalog ✅

**Goal:** Visitors can browse and filter published projects.

Deliverables:
- [x] `/projects` page with project grid
- [x] `ProjectCard` component
- [x] Category filter sidebar
- [x] Technology filter
- [x] Search bar
- [x] Pagination
- [x] Empty state
- [x] Loading skeleton (`app/projects/loading.tsx`)

**Commit:** `feat: add project catalog with search and filters`

---

### Phase 8 — Project Detail ✅

**Goal:** Full project detail pages are live.

Deliverables:
- [x] `/projects/[slug]` page with all sections
- [x] `ProjectGallery` with lightbox & image viewer
- [x] Features list
- [x] Specifications table
- [x] FAQ accordion
- [x] Provider card (with contact actions)
- [x] Related projects section
- [x] Static generation + revalidation
- [x] SEO metadata per project

**Commit:** `feat: add project detail pages`

---

### Phase 9 — Provider Management (Admin) ✅

**Goal:** Admin can manage providers.

Deliverables:
- [x] Admin layout with sidebar
- [x] `/admin/providers` list
- [x] `/admin/providers/new` create form
- [x] `/admin/providers/[id]/edit` edit form
- [x] Provider deactivation with confirmation & project demotion
- [x] Validation (Zod)
- [x] Audit logging

**Commit:** `feat: add provider management admin pages`

---

### Phase 10 — Project Management (Admin) ✅

**Goal:** Admin can create, edit, and manage projects.

Deliverables:
- [x] `/admin/projects` list
- [x] `/admin/projects/new` create form (all sections)
- [x] `/admin/projects/[id]/edit` edit form
- [x] Provider selector (auto-loads provider contact info)
- [x] Feature list editor
- [x] Spec editor
- [x] FAQ editor
- [x] Status management (Draft/Published/Archived)
- [x] Featured toggle
- [x] Slug auto-generation with collision protection

**Commit:** `feat: add project management admin pages`

---

### Phase 11 — WhatsApp Contact ✅

**Goal:** WhatsApp contact flow is live.

Deliverables:
- [x] `/api/projects/[slug]/whatsapp` route
- [x] `generateWhatsAppUrl()` utility
- [x] `WhatsAppButton` component
- [x] Rate limiting on WhatsApp endpoint
- [x] Contact button logic (show/hide based on provider settings)
- [x] Test: Project A → Provider A's WhatsApp only

**Commit:** `feat: add whatsapp contact flow`

---

### Phase 12 — Email Inquiry ✅

**Goal:** Email inquiry system is live end-to-end.

Deliverables:
- [x] Email service (`lib/email/`)
- [x] Gmail SMTP provider implementation (port 465 SSL)
- [x] Email templates (provider inquiry, customer confirmation)
- [x] `/api/inquiries` route
- [x] `InquiryForm` + `InquiryModal` components
- [x] Rate limiting on inquiry endpoint
- [x] Inquiry stored in DB
- [x] Provider receives email
- [x] Customer receives confirmation
- [x] Security test: provider_email injection blocked

**Commit:** `feat: add email inquiry system`

---

### Phase 13 — Project Import ✅

**Goal:** Admin can import projects from AI-generated JSON.

Deliverables:
- [x] Zod import schema
- [x] `/api/admin/projects/import` route
- [x] `/admin/projects/import` page
- [x] JSON paste + validate UI
- [x] Import preview
- [x] Provider matching/creation logic
- [x] Create project as DRAFT on import
- [x] Audit log on import
- [x] `docs/23-project-import-template.md` (standalone copy for AI prompts)

**Commit:** `feat: add project json import system`

---

### Phase 14 — Image Storage ✅

**Goal:** Admin and partners can upload screenshots to projects.

Deliverables:
- [x] Cloudinary integration (`lib/storage/`)
- [x] `/api/admin/uploads` and `/api/partner/uploads` routes
- [x] Real file magic bytes validation (JPEG, PNG, WebP)
- [x] `ImageUploader` component (drag-and-drop)
- [x] Project gallery reorder
- [x] Primary image selection
- [x] Alt text editing
- [x] Image deletion
- [x] `next.config.ts` remotePatterns for Cloudinary & external hosts

**Commit:** `feat: add cloudinary image storage and upload`

---

### Phase 15 — Customer Area ✅

**Goal:** Logged-in customers can track their inquiries and view profile.

Deliverables:
- [x] `/profile` settings & password change
- [x] `/my-inquiries` list & status badges
- [x] `/my-requests` list
- [x] `/my-transactions` payment verification & receipts
- [x] `/my-support` customer support thread viewer

**Commit:** `feat: add customer area`

---

### Phase 16 — Admin Dashboard ✅

**Goal:** Full admin dashboard with stats and recent activity.

Deliverables:
- [x] `/admin` dashboard with real stats from DB
- [x] Inquiry management (`/admin/inquiries`)
- [x] Custom request management (`/admin/custom-requests`)
- [x] Audit log view (`/admin/audit-logs`)
- [x] Partner management & transaction verifications (`/admin/transactions`)
- [x] Admin notification for inactive-provider published projects

**Commit:** `feat: add admin dashboard and inquiry management`

---

### Phase 17 — Custom Project Request ✅

**Goal:** Visitors can request custom projects.

Deliverables:
- [x] `/api/custom-requests` route
- [x] Full form validation
- [x] Email to admin
- [x] Confirmation to customer
- [x] Rate limiting (IP bounded)

**Commit:** `feat: add custom project request system`

---

### Phase 18 — Security Hardening ✅

**Goal:** Security audit and hardening before production.

Deliverables:
- [x] Review all Zod schemas
- [x] Verify provider email routing (security test passed)
- [x] Add secure headers & Content-Security-Policy to `next.config.ts`
- [x] File upload security with magic bytes inspection and base64 removal
- [x] Distributed Upstash Redis rate limiting with seamless memory fallback
- [x] Brute-force rate limiting on auth endpoints (login, OTP, reset)
- [x] Account linking takeover protection (`allowDangerousEmailAccountLinking: false` + `signIn` checks)
- [x] Error message audit (no technical/stack leaks)
- [x] Admin access guards (middleware + layouts)
- [x] Environment variable audit

**Commit:** `feat: security hardening and review`

---

### Phase 19 — SEO ✅

**Goal:** Full SEO implementation.

Deliverables:
- [x] Metadata on all pages
- [x] Dynamic metadata on project pages
- [x] OpenGraph images and Twitter card tags
- [x] Sitemap generation (`app/sitemap.ts`)
- [x] Robots.txt (`app/robots.ts`)
- [x] Static generation for project pages
- [x] Canonical URLs

**Commit:** `feat: add seo metadata and sitemap`

---

### Phase 20 — Testing ✅

**Goal:** Core test coverage before deployment.

Deliverables:
- [x] Provider routing tests (critical - 8 tests passing)
- [x] Email routing security test
- [x] Zod validation tests (18 tests passing)
- [x] Auth validation tests (12 tests passing)
- [x] Custom request tests (2 tests passing)
- [x] WhatsApp routing tests (6 tests passing)
- [x] Email provider tests (4 tests passing)
- [x] All 50 tests passing in CI/Vitest

**Commit:** `feat: add core test suite`

---

### Phase 21 — Production Deployment ✅

**Goal:** Platform is configured, verified, and ready to deploy.

Deliverables:
- [x] Vercel deployment configured (`vercel.json`, `output: "standalone"`)
- [x] Neon production database schema & migrations ready
- [x] All environment variables documented and verified
- [x] Google OAuth production callback configured
- [x] Gmail SMTP production credentials support
- [x] Cloudinary production credentials support
- [x] Upstash Redis production rate limiting configured
- [x] Security headers and Content Security Policy verified
- [x] Zero compilation errors and verified test suite

**Commit:** `feat: production deployment ready`
