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
  - Added optional form input in `components/admin/ProjectForm.tsx` (wired in `app/admin/projects/[id]/edit/page.tsx`) and `components/partner/PartnerSolutionForm.tsx` (wired in `app/partner/(portal)/solutions/[id]/edit/page.tsx`): `"Original price (only if you really sold/listed at this price before)"` with explanatory guidance.
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

## Phase 2 — Lead Routing, Contact Eligibility & Account Linkage (HIGH)

### B2 & B3. Provider Contact Eligibility & Visibility Enforcement
- **Problem**: Public project detail queries and contact endpoints (`POST /api/inquiries` and `GET /api/projects/[slug]/whatsapp`) checked `provider.isActive` but did not verify `provider.applicationStatus === "approved"`, nor did `POST /api/inquiries` reject email inquiries when `provider.showEmail === false`, or check that a provider actually had a valid `whatsappNumber` when computing `hasWhatsapp`.
- **Changes**:
  - Added `isProviderEligibleForRouting` in `lib/db/queries/providers.ts` requiring `isActive === true` and `applicationStatus === "approved"` (if set).
  - Updated `lib/db/queries/projects.ts` (`getProjectBySlug`) to compute `hasWhatsapp` only when the provider is eligible, `showWhatsapp === true`, and `whatsappNumber` is non-empty, and `hasEmail` only when the provider is eligible, `showEmail === true`, and `email` is non-empty.
  - Updated `app/api/inquiries/route.ts` and `app/api/projects/[slug]/whatsapp/route.ts` to enforce provider routing eligibility and return `403` when `provider.showEmail === false` or `provider.showWhatsapp === false`.
  - Updated `components/providers/ProviderCard.tsx` and `components/providers/ProjectDetailActions.tsx` to render the "Send Email Inquiry" button only when `hasEmail` is true and show an informational notice when neither contact channel is enabled.

### B4. Unified Phone / WhatsApp Validation & E.164 Normalization
- **Problem**: Phone/WhatsApp validation used inconsistent regex checks across forms and schemas without international or Indian E.164 normalization.
- **Changes**:
  - Created `lib/utils/phone.ts` powered by `libphonenumber-js` (`parsePhone`, `normalizeToE164`, `isValidPhone`, `toWhatsAppDigits`) with default country `"IN"` and support for international numbers (including `+`, `00`, and country-code-prefixed numbers).
  - Updated `lib/validation/inquiry.schema.ts`, `lib/validation/custom-request.schema.ts`, `lib/validation/provider.schema.ts`, `lib/validation/partner.schema.ts`, `lib/validation/project-import.schema.ts`, and `app/api/user/profile/route.ts` to validate and normalize phone numbers to E.164.
  - Enforced conditional requirement in `InquirySchema` so `whatsapp` is required when `contactMethod === "WHATSAPP"`.

### B5. Account Scoping & Verified-Only Record Linking
- **Problem**: Customer queries (`getCustomerRequests`, `getCustomerTransactions`) performed read-time auto-linking by email address on every page load, and `verify-otp` / OAuth sign-in did not explicitly invoke verified record linking.
- **Changes**:
  - Scoped `getCustomerInquiries`, `getCustomerRequests`, `getCustomerStats`, and `getCustomerTransactions` in `lib/db/queries/customer.ts` and `lib/db/queries/transactions.ts` strictly by `customerId: userId` with no read-time `updateMany` side effects.
  - Implemented `linkVerifiedUserRecords(userId, email)` in `lib/db/queries/customer.ts` to link prior unlinked inquiries, custom requests, and transactions strictly once upon verified authentication (`app/api/auth/verify-otp/route.ts` and `lib/auth/auth.ts`).

---

## Phase 3 — Shortlist Honesty, Profile Persistence & Polish (MEDIUM)

### B8. Honest Shortlist / Saved Projects Framing (Replacing Fake Checkout Cart)
- **Problem**: The `/cart` feature was labeled as a "Shopping Cart" with "Order Summary" and "Add to Cart" buttons despite the platform operating on direct creator inquiries rather than an automated checkout gateway. Additionally, `localStorage` cart keys were shared across all users on the same browser.
- **Changes**:
  - Reframed all UI copy across `components/cart/AddToCartButton.tsx`, `components/cart/CartNavButton.tsx`, `components/cart/CartPageContent.tsx`, `app/cart/page.tsx`, and `components/layout/NavbarClient.tsx` to "Saved Projects / Shortlist" ("Save to Shortlist", "Saved", "Shortlist Summary", "Inquire with Builder") while preserving the `/cart` route.
  - Scoped shortlist storage key per authenticated user ID (`soft_showcase_shortlist_${userId}`) in `lib/cart/cart-context.tsx` with one-time migration from legacy storage.

### B9. Database-Persisted Customer Contact Details
- **Problem**: Customer profile contact preferences (`whatsapp` and `contactEmail`) were stored only in browser `localStorage` instead of the database.
- **Changes**:
  - Added additive nullable `whatsapp` and `contactEmail` columns to `User` in `prisma/schema.prisma` (`prisma/migrations/20260331000001_add_user_contact_fields/migration.sql`).
  - Updated `GET /api/user/profile` and `PATCH /api/user/profile` (`app/api/user/profile/route.ts`), `app/(customer)/profile/page.tsx`, and `components/customer/ProfileEditForm.tsx` to read and persist `whatsapp` (normalized to E.164) and `contactEmail` in the database.
  - Updated `CustomProjectForm` and `InquiryForm` to pre-fill contact fields from the user's database-backed profile.

### B10. Email Delivery Honesty & Marketing Copy Cleanup
- **Problem**: Inquiry and custom-request APIs always claimed confirmation emails were dispatched even when `RESEND_API_KEY` was unconfigured, and public pages contained unverifiable marketing metrics and dead `#` social links.
- **Changes**:
  - Updated `app/api/inquiries/route.ts` and `app/api/custom-requests/route.ts` to return honest status messages (`emailDispatched` flag and accurate message when email delivery is skipped/queued).
  - Removed unverifiable marketing statistics and dead `#` social links across `components/home/*`, `app/become-a-partner/page.tsx`, and `components/layout/Footer.tsx`.

---

## NEEDS OWNER DECISION (Placeholders & Policy Decisions)
1. **Legal Entity Details (`/terms`, `/privacy`)**: Replace `[OWNER PLACEHOLDER: Legal Entity Name]`, `[OWNER PLACEHOLDER: Registered Office Address]`, `[OWNER PLACEHOLDER: Jurisdiction / Courts]`, and `[OWNER PLACEHOLDER: Grievance Officer Name & Contact]` before removing the draft legal banner.
2. **Official Social Media URLs (`config/constants.ts` / `Footer.tsx`)**: Provide verified external profile URLs if social links should be displayed in the footer.
3. **Commercial Commission & Refund Policy (`/terms`, `/become-a-partner`)**: Confirm exact marketplace commission percentages or milestone dispute policies if they should be stated publicly.
