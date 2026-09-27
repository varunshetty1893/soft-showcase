# 33 — Environment Variables

## All Environment Variables

This document describes every environment variable used by Soft Showcase.

---

## Database

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL pooled connection string for Prisma (runtime use) |
| `DIRECT_URL` | ✅ | Direct (non-pooled) PostgreSQL connection for Prisma Migrate |

**Why two URLs?**

Neon (and other serverless Postgres providers) use a connection pooler. Prisma Migrate must use a direct connection to run DDL commands. The application runtime uses the pooled URL.

**Example (Neon):**

```bash
DATABASE_URL=postgresql://user:password@ep-something.neon.tech/soft-showcase?sslmode=require&pgbouncer=true
DIRECT_URL=postgresql://user:password@ep-something.neon.tech/soft-showcase?sslmode=require
```

---

## Authentication

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | ✅ | Long random secret for signing session tokens |
| `NEXTAUTH_URL` | ✅ | Full URL of the application (no trailing slash) |
| `GOOGLE_CLIENT_ID` | ✅ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ✅ | Google OAuth client secret |

**Generate AUTH_SECRET:**

```bash
openssl rand -base64 32
```

---

## Email (Gmail SMTP)

| Variable | Required | Description |
|---|---|---|
| `EMAIL_PROVIDER` | ✅ | Set to `gmail` |
| `SMTP_HOST` | ✅ | SMTP host (default: `smtp.gmail.com`) |
| `SMTP_PORT` | ✅ | SMTP port: `465` (SSL/TLS direct) |
| `SMTP_SECURE` | ✅ | SSL/TLS enabled: `true` |
| `SMTP_USER` | ✅ | Gmail address used for SMTP authentication |
| `SMTP_PASSWORD` | ✅ | Google App Password (not your primary password) |
| `EMAIL_FROM` | ✅ | From email address (e.g., your Gmail address) |
| `EMAIL_FROM_NAME` | ✅ | From display name (e.g., `Soft Showcase`) |
| `ADMIN_EMAIL` | ✅ | Admin's email — receives custom project requests |

---

## Image Storage

| Variable | Required | Description |
|---|---|---|
| `STORAGE_PROVIDER` | ✅ | Which storage provider: `cloudinary` or `uploadthing` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary only | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary only | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary only | Cloudinary API secret |
| `UPLOADTHING_SECRET` | Uploadthing only | Uploadthing secret |
| `UPLOADTHING_APP_ID` | Uploadthing only | Uploadthing app ID |

---

## Application

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✅ | Public URL (used for SEO, OG tags, sitemap generation) |
| `NEXT_PUBLIC_APP_NAME` | No | Display name of the platform (default: `Soft Showcase`) |

**Note:** Variables prefixed `NEXT_PUBLIC_` are bundled into client JavaScript. Never use this prefix for secrets.

---

## Rate Limiting

| Variable | Required | Description |
|---|---|---|
| `RATE_LIMIT_PROVIDER` | No | `memory` (default) or `upstash` |
| `UPSTASH_REDIS_REST_URL` | Upstash only | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash only | Upstash Redis REST token |

> **Note on memory rate limiting:** In-memory rate limiting is stored per-process. Serverless deployments spin up multiple instances. Memory rate limiting is acceptable for V1 (low traffic), but should be replaced with Upstash Redis in V2 for persistence across instances.

---

## What Is NOT an Environment Variable

**`DEFAULT_WHATSAPP_NUMBER` does NOT exist.**

There is no global fallback WhatsApp number. Provider routing is always project-specific:

```
project → provider → provider.whatsappNumber
```

If a provider has no WhatsApp number, the WhatsApp button is hidden. No fallback number is used under any circumstances.

---

## Local Development Setup

Create `.env.local` (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Fill in at minimum:

1. `DATABASE_URL` + `DIRECT_URL` — get from Neon dashboard
2. `AUTH_SECRET` — generate with `openssl rand -base64 32`
3. `NEXTAUTH_URL=http://localhost:3000`
4. `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — from Google Cloud Console
5. `EMAIL_PROVIDER=gmail` + `SMTP_USER` + `SMTP_PASSWORD` (Google App Password)
6. `EMAIL_FROM` + `EMAIL_FROM_NAME` + `ADMIN_EMAIL`
7. `STORAGE_PROVIDER=cloudinary` + Cloudinary credentials
8. `NEXT_PUBLIC_APP_URL=http://localhost:3000`

---

## Vercel Production Setup

In Vercel dashboard → Project → Settings → Environment Variables, add all variables.

Update for production:
- `NEXTAUTH_URL=https://your-domain.com`
- `NEXT_PUBLIC_APP_URL=https://your-domain.com`
- `DATABASE_URL` — production Neon branch with pooler URL

---

## Security Rules

1. Never commit `.env.local` — it's in `.gitignore`.
2. Never put secrets in `NEXT_PUBLIC_` variables.
3. Never hardcode values in source code.
4. Rotate `AUTH_SECRET` if it's ever exposed.
5. Never log any environment variable values.
6. `DIRECT_URL` must never be used in application code — only in migration scripts.
