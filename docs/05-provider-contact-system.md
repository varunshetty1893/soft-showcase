# 05 — Provider Contact System

## Overview

The provider contact system is the **core mechanism** by which customers reach project owners. It ensures:

1. Customers can easily contact the right provider for any project.
2. Provider contact information is **never controlled by the customer**.
3. Both WhatsApp and Email channels are supported.
4. The server determines routing — not the client.

---

## Architecture Principle

```
Customer opens project page
        ↓
Clicks "Discuss on WhatsApp" or "Send Email Inquiry"
        ↓
Server identifies: project → provider → contact details
        ↓
Contact is routed to the CORRECT provider
```

The customer **never sees** which email address will receive their message. They never submit a `provider_email` field. The server always resolves this.

---

## WhatsApp Contact Flow

### Step-by-Step

```
1. Customer visits /projects/ai-resume-analyzer
2. Customer clicks "Discuss on WhatsApp"
3. Client sends: GET /api/projects/ai-resume-analyzer/whatsapp
4. Server:
   a. Looks up project by slug
   b. Checks project.provider
   c. Checks provider.showWhatsapp === true
   d. Checks provider.whatsappNumber exists
   e. Generates pre-filled message
   f. Encodes message
   g. Returns wa.me URL
5. Client opens URL in new tab
6. WhatsApp opens with pre-filled message
7. Customer sends message directly to provider
```

### Pre-filled WhatsApp Message Format

```
Hi, I'm interested in the "[Project Title]" project listed on Soft Showcase.

Project ID: [project.id or display code]

I would like to know:
- Price
- Features included
- Customization options
- Delivery details

Please let me know when you're available to discuss.
```

### WhatsApp URL Format

```
https://wa.me/{number}?text={encoded_message}
```

Where `{number}` is the provider's WhatsApp number without the `+` prefix.

Example:

```
https://wa.me/919876543210?text=Hi%2C+I%27m+interested+in+...
```

### WhatsApp Security Notes

- The server resolves the provider's WhatsApp number — the client does not submit it.
- The project slug or ID is used to look up the provider.
- If `provider.showWhatsapp` is false, the API returns a 403 or the button is not rendered.

---

## Email Inquiry Flow

### Step-by-Step

```
1. Customer visits /projects/ai-resume-analyzer
2. Customer clicks "Send Email Inquiry"
3. Inquiry form modal opens
4. Customer fills in:
   - Name
   - Email
   - WhatsApp (optional)
   - Message
5. Customer submits form
6. Client sends: POST /api/inquiries with:
   {
     projectId: "...",
     name: "John",
     email: "john@example.com",
     whatsapp: "+91...",
     message: "..."
   }
7. Server:
   a. Validates all fields (Zod)
   b. Looks up project by projectId
   c. Resolves project.provider
   d. Checks provider.showEmail === true
   e. Checks provider.email exists
   f. Stores inquiry in database
   g. Sends email to provider.email (via email API)
   h. Optionally sends confirmation to customer
   i. Returns success response
8. Client shows success message
```

### What the Customer Submits

```json
{
  "projectId": "cuid-of-project",
  "name": "John Doe",
  "email": "john@example.com",
  "whatsapp": "+919876543210",
  "message": "I am interested in customization options..."
}
```

### What the Customer NEVER Submits

```
provider_email ← This is resolved SERVER-SIDE ONLY
provider_id    ← Resolved from project
```

---

## Email Inquiry Form Fields

| Field | Required | Validation |
|---|---|---|
| Name | Yes | 2–100 characters |
| Email | Yes | Valid email format |
| WhatsApp | No | International phone format if provided |
| Message | Yes | 10–2000 characters |

---

## Provider Email Sent (to Provider)

**Subject:** New Inquiry for [Project Name] — Soft Showcase

**Body:**

```
You have received a new inquiry about your project listed on Soft Showcase.

Project: AI Resume Analyzer
Project ID: AI-001

Customer Information:
Name: John Doe
Email: john@example.com
WhatsApp: +919876543210

Message:
"I am interested in customization options for this project.
Can you tell me how much it would cost to add a dashboard?"

---
This inquiry was received through Soft Showcase.
Please respond directly to the customer at john@example.com.
```

---

## Customer Confirmation Email (Optional)

**Subject:** Your Inquiry Has Been Received — Soft Showcase

**Body:**

```
Hi John,

Thank you for your inquiry about:

AI Resume Analyzer

Your message has been forwarded to the project provider.
They will contact you using the information you provided.

Best regards,
Soft Showcase Team
```

---

## Contact Button Rendering Logic

The project detail page renders contact buttons based on provider settings:

```typescript
// Pseudo-code for contact button rendering
const showWhatsApp = provider.showWhatsapp && !!provider.whatsappNumber;
const showEmail = provider.showEmail && !!provider.email;

if (!showWhatsApp && !showEmail) {
  return <ContactUnavailable />;
}

return (
  <>
    {showWhatsApp && <WhatsAppButton project={project} />}
    {showEmail && <EmailInquiryButton project={project} />}
  </>
);
```

---

## Cross-Provider Routing Prevention

### The Problem This Architecture Prevents

Without server-side routing, a malicious customer could:

1. Open browser DevTools
2. Modify the form request to include a different `provider_email`
3. Use Soft Showcase as a spam tool targeting arbitrary emails

### The Solution

The server **NEVER** uses a `provider_email` field from the client request.

The email routing is always:

```
client submits: { projectId, name, email, message }
server resolves: project → provider → provider.email
server sends to: provider.email (from database)
```

This is a critical security requirement — see [Security](27-security.md).

---

## Provider Contact Not Available State

If a published project has a provider where both `showWhatsapp = false` and `showEmail = false`:

**Public page shows:**

```
Contact information for this project is currently unavailable.
Please check back later or visit our contact page.
```

**Admin dashboard warning:**

```
⚠ Warning: Project "AI Resume Analyzer" has no active contact methods.
The assigned provider has both WhatsApp and Email disabled.
Customers cannot contact this project.
[ Edit Provider ] [ Change Provider ]
```
