# Soft Showcase

Curated software discovery and direct creator inquiry platform built with Next.js 15 App Router, NextAuth v5, Prisma/PostgreSQL, Upstash Redis, and Cloudflare Turnstile.

## Getting Started

1. Copy `.env.example` to `.env.local` and configure the environment variables.
2. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Required Production Environment Variables

In production (`NODE_ENV=production`), the application validates the following variables at runtime and fails closed if any are missing:

- `AUTH_SECRET` — Cryptographic secret for NextAuth JWT signing (minimum 32 characters).
- `DATABASE_URL` — PostgreSQL connection string (e.g., Neon).
- `NEXT_PUBLIC_APP_URL` (or `AUTH_URL` / `NEXTAUTH_URL`) — Canonical public base URL of the deployment.
- `UPSTASH_REDIS_REST_URL` — Upstash Redis REST endpoint for distributed serverless rate limiting.
- `UPSTASH_REDIS_REST_TOKEN` — Upstash Redis REST bearer token.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — Cloudflare Turnstile public site key for anti-spam verification.
- `TURNSTILE_SECRET_KEY` — Cloudflare Turnstile server-side secret key.

Optional production variables:
- `RESEND_API_KEY` / `SMTP_*` — Transactional email delivery credentials.
- `ADMIN_EMAIL` / `ADMIN_EMAILS` — Verified administrator notification and bootstrap email(s).
- `TRUSTED_PROXY_COUNT` — Number of trusted reverse proxies for `x-forwarded-for` extraction (default `1`).

## Scripts

- `npm run dev` — Start local development server on port 3000.
- `npm run lint` — Run ESLint checks.
- `npx tsc --noEmit` — Run TypeScript type checking.
- `npm test` — Run Vitest unit and integration test suites.
- `npm run build` — Build standalone Next.js production bundle.
