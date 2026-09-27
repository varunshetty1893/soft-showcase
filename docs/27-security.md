# 27 — Security

## Security Philosophy

Security in Soft Showcase is designed around these core principles:

1. **Never trust client input** — validate everything on the server.
2. **Server determines recipients** — customers cannot control who receives emails.
3. **Minimal privilege** — users get only the access they need.
4. **Defense in depth** — multiple layers of protection.
5. **Secrets never leave the server** — API keys, email, OAuth secrets stay server-side.

---

## Security Controls Summary

| Area | Control | Implementation |
|---|---|---|
| Authentication | Google OAuth only | NextAuth.js v5 |
| Authorization | isAdmin flag | Database + middleware |
| Input validation | All forms server-validated | Zod |
| Rate limiting | All public endpoints | In-memory (V1) |
| Email routing | Server-resolved only | project → provider → email |
| WhatsApp routing | Server-resolved only | project → provider → number |
| File uploads | Type + size validation | Server-side |
| Secrets | Environment variables only | .env.local (never committed) |
| Cookies | HTTP-only, SameSite=Lax | NextAuth.js session |
| SQL injection | ORM only | Prisma |
| XSS | Template escaping | HTML escaping in templates |
| Admin access | Explicit isAdmin flag | Not automatic from auth |

---

## 1. Authentication & Authorization

### Authentication

- Google OAuth via NextAuth.js v5
- No email/password login (no password to steal/hash incorrectly)
- Sessions stored in database (can be invalidated)
- HTTP-only session cookies (inaccessible to JavaScript)

### Authorization

```
Anyone can: browse, view projects, submit inquiries (rate limited)
Authenticated users can: access /profile, /my-inquiries, /my-requests
Users with isAdmin=true can: access admin panel (/admin/...)
```

**Customer Data Isolation:**
All customer-facing queries for inquiries and profile details must strictly be scoped server-side using the authenticated user's session ID (`where: { customerId: session.user.id }`). The client never passes customerId to scope data.

**Critical:** `isAdmin` is set only by direct database access. No UI allows a user to self-assign admin.

---

## 2. Email Routing Security

This is the most critical security control.

### The Threat

Without server-side routing, a malicious user could manipulate the inquiry form (e.g., via browser DevTools) to insert an arbitrary `provider_email` field, turning Soft Showcase into a free email relay for spam.

### The Defense

The client **NEVER** submits a `provider_email` field.

The server **ALWAYS** resolves:

```typescript
const project = await prisma.project.findUnique({
  where: { id: body.projectId, status: "PUBLISHED" },
  include: { provider: true },
});

// This is the ONLY source of the recipient email:
const recipientEmail = project.provider.email;
```

If `body.provider_email` exists in the request body, it is **ignored entirely**.

---

## 3. Input Validation

All server endpoints validate input with Zod before processing:

```typescript
const result = InquirySchema.safeParse(body);

if (!result.success) {
  return NextResponse.json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      fields: result.error.flatten().fieldErrors,
    },
  }, { status: 400 });
}

// Only use result.data from here — typed and validated
const { projectId, name, email, whatsapp, message } = result.data;
```

Never use `body.anyField` directly after this point — always use `result.data`.

---

## 4. Rate Limiting

Rate limiting protects all public endpoints from abuse:

| Endpoint | Limit |
|---|---|
| `POST /api/inquiries` | 3 per IP per 15 minutes |
| `POST /api/custom-requests` | 2 per IP per hour |
| `GET /api/projects/[slug]/whatsapp` | 10 per IP per minute |
| Sign In (`/login`, `/api/auth/signin/google`) | Handled by NextAuth + Google |

**V1:** In-memory rate limiting (resets on server restart). Acceptable for low traffic.

**V2:** Upstash Redis-based rate limiting for persistence across deployments.

---

## 5. File Upload Security

```typescript
function validateImageFile(file: File) {
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP allowed.");
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new Error("File too large. Maximum size is 5MB.");
  }
}
```

**Never allow:**
- `.exe`, `.php`, `.sh`, or any executable
- `.svg` (can contain embedded JavaScript)
- Files larger than 5MB

---

## 6. XSS Protection

- All email template variables are HTML-escaped before insertion.
- Next.js automatically escapes JSX output.
- `dangerouslySetInnerHTML` is never used with user-supplied data.
- Project `fullDescription` is rendered safely using `react-markdown`.
- Content-Security-Policy headers are configured in production.

---

## 7. SQL Injection Prevention

Prisma uses parameterized queries automatically. Raw SQL is never used. Never construct SQL strings from user input.

---

## 8. Secret Management

| Secret | Location | Exposed to client? |
|---|---|---|
| DATABASE_URL | .env.local | ❌ Never |
| AUTH_SECRET | .env.local | ❌ Never |
| GOOGLE_CLIENT_SECRET | .env.local | ❌ Never |
| SMTP_PASSWORD | .env.local | ❌ Never |
| CLOUDINARY_API_SECRET | .env.local | ❌ Never |
| GOOGLE_CLIENT_ID | .env.local | ✅ Safe (public credential) |
| NEXT_PUBLIC_APP_URL | .env.local | ✅ Safe (intentionally public) |

Rule: If the variable name starts with `NEXT_PUBLIC_`, it is bundled into the client JavaScript. Never prefix secrets with `NEXT_PUBLIC_`.

---

## 9. CSRF Protection

NextAuth.js v5 uses CSRF protection on authentication endpoints automatically.

For API routes using Server Actions, Next.js App Router includes CSRF protection by default for form submissions.

---

## 10. Secure Headers & Content Security Policy (CSP)

Configure in `next.config.ts`:

```typescript
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https://res.cloudinary.com https://lh3.googleusercontent.com",
      "connect-src 'self' https://*.neon.tech https://api.cloudinary.com",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];
```

---

## 11. Error Handling Security

**Never expose** internal error details to the client:

```typescript
// ❌ BAD
return NextResponse.json({ error: error.message }); // Could leak stack trace, DB schema

// ✅ GOOD
console.error("[API] Inquiry error:", error);
return NextResponse.json({ 
  success: false,
  error: { code: "INTERNAL_ERROR", message: "Something went wrong." }
}, { status: 500 });
```

---

## Pre-Production Security Checklist

- [ ] `isAdmin` only set via database seed — no UI path
- [ ] Email routing tested: customer cannot change provider email via DevTools
- [ ] Rate limiting enabled on all public endpoints
- [ ] File uploads reject non-image types
- [ ] All environment variables in Vercel (not in code)
- [ ] `.env.local` in `.gitignore` and not committed
- [ ] Error messages don't leak internal details
- [ ] Session cookies are HTTP-only
- [ ] HTTPS enforced (Vercel handles this automatically)
- [ ] API keys verified as not exposed in client bundle
- [ ] Admin routes tested: unauthenticated redirects to sign in
- [ ] Admin routes tested: non-admin user redirects to home
