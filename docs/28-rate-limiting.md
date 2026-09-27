# 28 — Rate Limiting

## Purpose

Rate limiting prevents:

- Spam inquiries to providers
- Automated form abuse
- Email API cost explosion
- WhatsApp link generation abuse
- Brute-force on auth endpoints

---

## V1 Strategy: In-Memory Rate Limiting

For V1, an in-memory rate limiter is used. This is simple, requires no Redis, and works fine for low traffic.

**Limitation:** Resets on every server restart and does not share state across Vercel serverless function instances.

This is acceptable for V1 where traffic is low and each serverless function instance handles few requests.

---

## Rate Limiter Implementation

```typescript
// lib/utils/rate-limit.ts

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export function createRateLimiter(options: RateLimitOptions) {
  return function check(identifier: string): boolean {
    const now = Date.now();
    const entry = store.get(identifier);

    if (!entry || now > entry.resetAt) {
      store.set(identifier, {
        count: 1,
        resetAt: now + options.windowMs,
      });
      return false; // not limited
    }

    if (entry.count >= options.maxRequests) {
      return true; // rate limited
    }

    entry.count++;
    return false; // not limited
  };
}
```

---

## Rate Limit Configuration Per Endpoint

```typescript
// config/constants.ts

export const RATE_LIMITS = {
  inquiry: createRateLimiter({
    maxRequests: 3,
    windowMs: 15 * 60 * 1000, // 15 minutes
  }),
  customRequest: createRateLimiter({
    maxRequests: 2,
    windowMs: 60 * 60 * 1000, // 1 hour
  }),
  whatsappLink: createRateLimiter({
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
  }),
};
```

---

## Using the Rate Limiter in API Routes

```typescript
// In API route handler

const ip = request.headers.get("x-forwarded-for") ?? "unknown";
const limited = RATE_LIMITS.inquiry(ip);

if (limited) {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
    { status: 429 }
  );
}
```

---

## Rate Limit Identifier

Use the client's IP address as the identifier:

```typescript
function getClientIp(request: Request): string {
  // Vercel sets x-forwarded-for header
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
```

---

## Rate Limit Response

When rate limited, the API returns:

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later."
  }
}
```

HTTP Status: **429 Too Many Requests**

The UI shows:

```
You have sent too many requests.
Please wait a few minutes before trying again.
```

---

## Upgrade Path (V2)

For production with multiple Vercel serverless instances, replace the in-memory store with Upstash Redis:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(3, "15 m"),
});

const { success } = await ratelimit.limit(ip);
```

This is a drop-in improvement requiring only the Upstash credentials.

---

## Rate Limiting Scope

| Endpoint | Rate Limit | Window |
|---|---|---|
| `POST /api/inquiries` | 3 requests | 15 minutes |
| `POST /api/custom-requests` | 2 requests | 1 hour |
| `GET /api/projects/[slug]/whatsapp` | 10 requests | 1 minute |
| Admin routes | No rate limit (auth required) | — |
| Auth routes | Handled by Google OAuth | — |
