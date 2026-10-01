# Security & Data Integrity Changelog

All user-visible behavior changes and security remediations are documented below with their rationale.

## Phase 1 — Authentication & Data Integrity (HIGH)

- **H1 (AUTH_SECRET Hardening)**: Removed hardcoded fallback JWT secret; `lib/config/env.ts` enforces 32+ char secret in production and throws on startup if missing.
- **H2 (Strict Admin Authorization)**: Eliminated hardcoded email string checks in request routing paths; `lib/auth/admin.ts` trusts only DB-backed `isAdmin` flag, with one-time bootstrap on email verification.
- **H3 (Anti-Pre-Hijacking & Anti-Enumeration)**: Replaced direct user creation on registration with `PendingRegistration` staging; duplicate registration returns identical generic response and triggers owner notification rather than revealing user existence.
- **H5 (Production Database Isolation)**: Replaced silent in-memory fallback in `lib/db/client.ts` with strict singleton PrismaClient that throws if `DATABASE_URL` is missing in production; deleted startup auto-seeding.
- **H4 (Provider Contact Privacy)**: Excluded provider `email` and `whatsappNumber` from public project queries, RSC payloads, and saved cart items; contact communication is gated via authenticated, rate-limited channels.

## Phase 2 & UI Remediation (Open Redirects, Image Gallery, Featured Controls)

- **M1 (Open Redirect Protection)**: Implemented strict RFC & URL-safe origin normalization in `lib/utils/safe-redirect.ts`. Disallows protocol-relative URLs (`//`, `/\`), backslashes, nested encoded sequences (`%2F%2F`, `%2F%5C`), non-http(s) schemes (`javascript:`, `data:`), and redirect loops to auth endpoints.
- **Admin Image Reordering & Primary Cover**: Integrated 4-way arrow controls (Left, Up, Down, Right), "Make Primary" cover toggle, and delete controls into `components/admin/ImageUploader.tsx` with parity to the partner portal.
- **Partner Upload Loading State**: Added dedicated progress state, animated spinner indicators, and skeleton placeholder card during photo uploads in `PartnerSolutionForm.tsx` to provide immediate feedback.
- **Direct Featured Solution Controls**: Added prominent interactive Featured toggle cards with star badges to admin (`ProjectForm.tsx`) and partner forms (`PartnerSolutionForm.tsx`), wired `featured` through edit page initial data, and provided inline toggle in tables.
- **Partner JSON Import Navigation**: Added direct "Import JSON" item to `PartnerSidebar.tsx` and quick action bar in solution creation.
