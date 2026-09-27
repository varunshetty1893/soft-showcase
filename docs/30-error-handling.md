# 30 — Error Handling

## Error Handling Philosophy

1. **Customers see friendly messages** — never technical errors.
2. **Technical details go to server logs** — not client responses.
3. **Every important operation has an error state** — loading, success, error.
4. **Errors are recoverable** — provide a clear next action.

---

## Error Categories

| Category | Examples | User Message |
|---|---|---|
| Validation | Missing required field, invalid email | Field-level error messages |
| Not found | Project doesn't exist, page missing | "This page was not found." |
| Auth required | Accessing dashboard without login | Redirect to sign in |
| Forbidden | Non-admin accessing admin pages | Redirect to home |
| Rate limited | Too many inquiries | "Too many requests. Try again later." |
| Email failure | Email API down | "Couldn't send your inquiry. Try again." |
| Upload failure | Cloudinary error | "Image upload failed. Try again." |
| Server error | DB connection, unexpected exception | "Something went wrong. Try again." |

---

## API Error Response Format

All errors return consistent JSON:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check the form fields.",
    "fields": {
      "email": "Invalid email address",
      "message": "Message is too short"
    }
  }
}
```

---

## Form Error Handling (Client-Side)

```typescript
// In inquiry form component

const [errors, setErrors] = useState<Record<string, string>>({});
const [globalError, setGlobalError] = useState<string | null>(null);

async function onSubmit(data) {
  const res = await fetch("/api/inquiries", { method: "POST", body: JSON.stringify(data) });
  const result = await res.json();

  if (!result.success) {
    if (result.error.code === "VALIDATION_ERROR") {
      setErrors(result.error.fields);
    } else {
      setGlobalError("We couldn't send your inquiry right now. Please try again.");
    }
    return;
  }

  // Show success state
}
```

---

## Page-Level Error States

### Not Found (404)

```tsx
// app/not-found.tsx

export default function NotFound() {
  return (
    <main>
      <h1>Page Not Found</h1>
      <p>The page you're looking for doesn't exist or has been moved.</p>
      <Link href="/">Go back to homepage</Link>
    </main>
  );
}
```

### Server Error (500)

```tsx
// app/error.tsx

"use client";

export default function Error({ error, reset }) {
  return (
    <main>
      <h1>Something went wrong</h1>
      <p>We encountered an unexpected error. Please try again.</p>
      <button onClick={reset}>Try Again</button>
    </main>
  );
}
```

---

## Loading States

### Page Loading

Use Next.js `loading.tsx`:

```tsx
// app/(public)/projects/loading.tsx

export default function Loading() {
  return <ProjectGridSkeleton />;
}
```

### Button Loading

```tsx
<button disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner /> Sending...
    </>
  ) : (
    "Send Inquiry"
  )}
</button>
```

---

## Success States

After form submission:

```tsx
{submitSuccess && (
  <div role="alert">
    <CheckIcon />
    <h3>Inquiry Sent!</h3>
    <p>
      Your message has been forwarded to the project provider.
      They will contact you using the details you provided.
    </p>
  </div>
)}
```

---

## Empty States

### No Projects in Catalog

```tsx
<EmptyState
  icon={<SearchIcon />}
  title="No projects found"
  description="Try different filters or search terms."
  action={<Button onClick={clearFilters}>Clear Filters</Button>}
/>
```

### No Inquiries

```tsx
<EmptyState
  icon={<InboxIcon />}
  title="No inquiries yet"
  description="Inquiries you submit will appear here."
  action={<Link href="/projects">Browse Projects</Link>}
/>
```

---

## Server-Side Error Logging

```typescript
// Standard error logging pattern

try {
  await emailService.sendProviderInquiryEmail(data);
} catch (error) {
  // Log full error on server
  console.error("[Email] sendProviderInquiryEmail failed", {
    inquiryId: inquiry.id,
    providerId: inquiry.providerId,
    error: error instanceof Error ? error.message : String(error),
  });

  // Don't re-throw — inquiry is already saved
  // Admin can manually contact provider if email fails
}
```

---

## Error Messages Reference

| Situation | User-Facing Message |
|---|---|
| Invalid form field | Field-level: "This field is required." / "Invalid email format." |
| Rate limited | "You've sent too many requests. Please wait before trying again." |
| Project not found | "This project was not found or is no longer available." |
| Contact unavailable | "Contact for this project is currently unavailable. Please check back later." |
| Email send failure | "We couldn't send your inquiry right now. Please try again later or contact us directly." |
| Image upload failure | "Image upload failed. Please try again or contact support." |
| Server error | "Something went wrong on our end. Please try again." |

---

## Things NEVER Shown to Users

- Stack traces
- Database error messages
- SQL query errors
- API provider error codes (e.g., "SMTP: Authentication failed")
- File system paths
- Internal IDs or cuid values in error messages
- Environment variable names
