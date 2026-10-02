# CHANGELOG-BUSINESS.md

All business-logic remediations and customer-side enhancements are tracked in this file.

---

## Phase 1 — Pricing Honesty & Public Data (HIGH)

### B1. Fabricated MRP / Fake Discount Remediation
- **Problem**: Earlier mock logic generated fabricated MRPs (`calculateMrp`) and fake discount percentages (multiplying real price by 1.5–1.8), creating misleading discounts. Free projects displayed a hardcoded `mockFreeMrp = 14999`.
- **Changes**:
  - Deleted `calculateMrp`, `mockFreeMrp`, and all call sites across the codebase.
  - Added additive nullable column `originalPrice Decimal? @db.Decimal(10, 2)` to `Project` model via migration `20261001110000_add_project_original_price`.
  - Added strict Zod schema validation in `lib/validation/project.schema.ts` (`ProjectSchema` and `ProjectUpdateSchema`): `originalPrice` must be strictly greater than `price` and is only allowed when `priceMode = FIXED`.
  - Added optional form input in `components/admin/ProjectForm.tsx` and `components/partner/PartnerSolutionForm.tsx`: `"Original price (only if you really sold/listed at this price before)"` with explanatory guidance.
  - Updated `components/projects/PriceBadge.tsx`: Strikethrough and discount percentage display ONLY when a verified `originalPrice > price` exists; FREE displays "Free" without MRP; CONTACT displays "Price on Request".
  - Cleaned urgency and deal copy across views.
  - Created shared helper `calculateDiscountPercent` in `lib/utils/format.ts` with comprehensive unit tests for rounding, zero/negative handling, and null-safety.
  - Backfill status: all existing projects maintain `originalPrice = null` (no discount shown).

### B6. Schema.org JSON-LD Structured Data Pricing Fix
- **Problem**: Project detail pages emitted hardcoded/fallback prices (`"0"`) and always claimed `InStock` regardless of listing mode.
- **Changes**:
  - Implemented `buildProjectOffers` and `buildSoftwareJsonLd` in `lib/utils/jsonld.ts`.
  - Emits `Offer` only when `priceMode = "FIXED"` and `price > 0`, formatted as plain number string with `DEFAULT_CURRENCY` (`INR`).
  - `FREE` mode emits `price: "0"`.
  - `CONTACT` and `STARTING_FROM` omit `offers` entirely per Google Rich Snippets guidelines.
  - Availability dynamically reflects project publication status (`https://schema.org/InStock` for `PUBLISHED`, `https://schema.org/OutOfStock` for drafts/archived).
  - Added unit test suite in `tests/unit/jsonld.test.ts` validating all pricing modes and availability states.

### B7. Robots, Sitemap, and Dead Link Remediation
- **Problem**: `app/robots.ts` disallowed non-existent legacy routes (`/verify-otp`, `/reset-password`), allowed login-only `/cart`, and missed customer/partner portals. `app/sitemap.ts` generated `new Date()` dynamically on every request. Footer and Auth pages linked to non-existent `/support`, `/terms`, and `/privacy` 404 routes.
- **Changes**:
  - Updated `app/robots.ts` to disallow internal/authenticated paths (`/cart`, `/my-*`, `/profile`, `/partner`, `/admin`, `/api`, `/login`, `/register`, `/verify-email`, `/forgot-password`) and explicitly allow public indexable paths.
  - Updated `app/sitemap.ts` to include `/become-a-partner`, `/support`, `/terms`, `/privacy`, using stable build date for static routes and database `updatedAt` for published projects.
  - Created public `/support` Help Center with categorized FAQs grounded in documentation and direct links to customer ticket management.
  - Created public `/terms` and `/privacy` pages grounded strictly in actual system architecture (accounts, inquiry routing to creators, custom requests, minimal cookies, NextAuth session tokens).
  - Added prominent `"DRAFT — Pending Formal Legal Review"` banners and explicit owner placeholders to both legal pages.
  - Created `tests/unit/routes.test.ts` verifying that every internal `href` in `Footer.tsx`, `NavbarClient.tsx`, and auth pages resolves to a registered Next.js App Router route.

---
