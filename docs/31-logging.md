# 31 — Logging

## Logging Philosophy

- **Log enough to debug production issues** — but not so much it becomes noise.
- **Never log secrets** — API keys, tokens, OAuth secrets, passwords.
- **Structured logging** — use key-value format for parseability.
- **Server logs only** — no sensitive data in browser console in production.

---

## What to Log

### Authentication Events

```typescript
// User signs in
console.log("[Auth] User signed in", { userId: user.id, email: user.email });

// Admin access
console.log("[Auth] Admin access granted", { userId: user.id });

// Admin access denied
console.warn("[Auth] Admin access denied", { userId: user.id, email: user.email });
```

### Project Operations

```typescript
// Project created
console.log("[Project] Created", { projectId, title, status: "DRAFT", adminId });

// Project imported
console.log("[Project] Imported via JSON", { projectId, title, providerId, adminId });

// Project published
console.log("[Project] Published", { projectId, title, adminId });

// Project archived
console.log("[Project] Archived", { projectId, title, adminId });
```

### Provider Operations

```typescript
// Provider created
console.log("[Provider] Created", { providerId, displayName, email, adminId });

// Provider deactivated
console.warn("[Provider] Deactivated", { providerId, displayName, affectedProjects: n, adminId });
```

### Inquiry Operations

```typescript
// Inquiry created
console.log("[Inquiry] Created", { inquiryId, projectId, providerId, contactMethod: "EMAIL" });

// Email sent to provider
console.log("[Email] Provider inquiry email sent", { inquiryId, providerId });

// Email failed
console.error("[Email] Failed to send provider inquiry", { inquiryId, error: error.message });
```

### Upload Operations

```typescript
// Upload success
console.log("[Upload] Image uploaded", { projectId, imageId, url: result.secure_url });

// Upload failed
console.error("[Upload] Image upload failed", { projectId, error: error.message });
```

### Rate Limiting

```typescript
// Rate limit hit
console.warn("[RateLimit] Limit exceeded", { endpoint: "/api/inquiries", ip });
```

---

## What NEVER to Log

```typescript
// ❌ NEVER log these:
console.log("Database URL:", process.env.DATABASE_URL);
console.log("SMTP password:", process.env.SMTP_PASSWORD);
console.log("Session token:", session.sessionToken);
console.log("OAuth access token:", account.access_token);
console.log("User password:", ...); // No passwords in system anyway
console.log("Google client secret:", process.env.GOOGLE_CLIENT_SECRET);
```

---

## Log Levels

| Level | Use Case |
|---|---|
| `console.log` | Normal operational events |
| `console.warn` | Unusual but non-critical (rate limit hit, inactive provider) |
| `console.error` | Errors that need investigation (email failure, upload failure) |

---

## Vercel Log Access

Logs are available in the Vercel dashboard under:

`Project → Deployments → [Deployment] → Logs`

Or using Vercel CLI:

```bash
vercel logs --follow
```

---

## Future: Structured Logging

For V2, consider structured logging with a service like:

- **Axiom** (free tier, Vercel-native integration)
- **Logtail** (Better Stack)
- **Datadog** (paid)

This allows:

- Log search by field
- Alerts on error patterns
- Request tracing
