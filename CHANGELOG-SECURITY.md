# Security & Data Integrity Changelog

All user-visible behavior changes and security remediations are documented below with their rationale.

## Phase 1 — Authentication & Data Integrity (HIGH)

- **H1 (AUTH_SECRET Hardening)**: Removed hardcoded fallback JWT secret; `lib/config/env.ts` enforces 32+ char secret in production and throws on startup if missing.
- **H2 (Strict Admin Authorization)**: Eliminated hardcoded email string checks in request routing paths; `lib/auth/admin.ts` trusts only DB-backed `isAdmin` flag, with one-time bootstrap on email verification.
- **H3 (Anti-Pre-Hijacking & Anti-Enumeration)**: Replaced direct user creation on registration with `PendingRegistration` staging; duplicate registration returns identical generic response and triggers owner notification rather than revealing user existence.
- **H5 (Production Database Isolation)**: Replaced silent in-memory fallback in `lib/db/client.ts` with strict singleton PrismaClient that throws if `DATABASE_URL` is missing in production; deleted startup auto-seeding.
- **H4 (Provider Contact Privacy)**: Excluded provider `email` and `whatsappNumber` from public project queries, RSC payloads, and saved cart items; contact communication is gated via authenticated, rate-limited channels.
