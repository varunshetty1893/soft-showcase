# 19 — Email Templates

## Template Standards

All templates must:

- Be readable in plain-text email clients
- Avoid excessive HTML
- Include the project name clearly
- Include Soft Showcase branding
- Have a professional, clean tone
- Not promise response times
- Not expose unnecessary information

---

## Template 1: Provider Inquiry Email

**File:** `lib/email/templates/provider-inquiry.ts`

**Trigger:** Customer submits inquiry form on a project page

**Recipient:** `provider.email` (from database, never from client)

**Subject:**
```
New Inquiry for [Project Title] — Soft Showcase
```

**Full HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>New Inquiry — Soft Showcase</title>
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 24px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 16px; border-radius: 0 0 8px 8px; font-size: 12px; color: #6b7280; }
    .label { font-weight: bold; color: #374151; }
    .message-box { background: #f3f4f6; padding: 16px; border-radius: 6px; border-left: 4px solid #4f46e5; }
    .divider { border: none; border-top: 1px solid #e5e7eb; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">Soft Showcase</h1>
      <p style="margin: 8px 0 0; opacity: 0.8;">New Project Inquiry</p>
    </div>
    <div class="content">
      <p>Hello <strong>{{providerName}}</strong>,</p>
      <p>
        You have received a new inquiry for your project listed on Soft Showcase.
      </p>

      <hr class="divider">

      <p class="label">Project</p>
      <p>{{projectTitle}}</p>

      <hr class="divider">

      <p class="label">Customer Information</p>
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="padding: 6px 0; color: #6b7280; width: 140px;">Name</td>
          <td style="padding: 6px 0;">{{customerName}}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">Email</td>
          <td style="padding: 6px 0;"><a href="mailto:{{customerEmail}}">{{customerEmail}}</a></td>
        </tr>
        <tr>
          <td style="padding: 6px 0; color: #6b7280;">WhatsApp</td>
          <td style="padding: 6px 0;">{{customerWhatsapp}}</td>
        </tr>
      </table>

      <hr class="divider">

      <p class="label">Message</p>
      <div class="message-box">
        <p style="margin: 0; white-space: pre-wrap;">{{message}}</p>
      </div>

      <hr class="divider">

      <p>
        Please respond directly to the customer at
        <a href="mailto:{{customerEmail}}">{{customerEmail}}</a>.
      </p>
    </div>
    <div class="footer">
      <p>This inquiry was received through Soft Showcase. Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>
```

---

## Template 2: Customer Confirmation Email

**File:** `lib/email/templates/customer-confirmation.ts`

**Trigger:** Immediately after inquiry is stored in database

**Recipient:** `inquiry.email` (customer's email — they provided it)

**Subject:**
```
Your Inquiry Has Been Received — Soft Showcase
```

**Full HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 24px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 16px; font-size: 12px; color: #6b7280; border-radius: 0 0 8px 8px; }
    .project-name { font-size: 18px; font-weight: bold; color: #4f46e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">Soft Showcase</h1>
    </div>
    <div class="content">
      <h2>Inquiry Received ✓</h2>
      <p>Hi <strong>{{customerName}}</strong>,</p>
      <p>
        Thank you for your interest in:
      </p>
      <p class="project-name">{{projectTitle}}</p>
      <p>
        Your inquiry has been forwarded to the project provider.
        They will contact you using the information you provided.
      </p>
      <p>
        If you have additional questions, feel free to submit another inquiry
        or explore more projects on Soft Showcase.
      </p>
    </div>
    <div class="footer">
      <p>© Soft Showcase. This is an automated confirmation email.</p>
    </div>
  </div>
</body>
</html>
```

---

## Template 3: Admin Notification (Custom Project Request)

**File:** `lib/email/templates/admin-notification.ts`

**Trigger:** Customer submits custom project request form

**Recipient:** `ADMIN_EMAIL` (from environment variables)

**Subject:**
```
New Custom Project Request — Soft Showcase
```

**Full HTML Template:**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #1a1a2e; color: white; padding: 24px; border-radius: 8px 8px 0 0; }
    .content { background: #fff; padding: 24px; border: 1px solid #e5e7eb; }
    .footer { background: #f9fafb; padding: 16px; font-size: 12px; color: #6b7280; }
    .section-title { font-weight: bold; color: #374151; margin-top: 20px; }
    .info-box { background: #f3f4f6; padding: 12px 16px; border-radius: 6px; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0; font-size: 20px;">Soft Showcase</h1>
      <p style="margin: 8px 0 0; opacity: 0.8;">New Custom Project Request</p>
    </div>
    <div class="content">
      <p class="section-title">Requester</p>
      <div class="info-box">
        <strong>{{name}}</strong><br>
        <a href="mailto:{{email}}">{{email}}</a><br>
        WhatsApp: {{whatsapp}}
      </div>

      <p class="section-title">Project Details</p>
      <div class="info-box">
        <strong>Title:</strong> {{projectTitle}}<br>
        <strong>Category:</strong> {{category}}<br>
        <strong>Technologies:</strong> {{technologies}}<br>
        <strong>Budget:</strong> {{budget}}<br>
        <strong>Deadline:</strong> {{deadline}}
      </div>

      <p class="section-title">Description</p>
      <div class="info-box">{{description}}</div>

      <p class="section-title">Required Features</p>
      <div class="info-box">{{requiredFeatures}}</div>

      {{#if additionalRequirements}}
      <p class="section-title">Additional Requirements</p>
      <div class="info-box">{{additionalRequirements}}</div>
      {{/if}}

      <p style="margin-top: 24px;">
        <a href="{{adminUrl}}/admin/custom-requests">View in Admin Dashboard</a>
      </p>
    </div>
    <div class="footer">
      <p>Received via Soft Showcase custom project request form.</p>
    </div>
  </div>
</body>
</html>
```

---

## Template Variables Reference

| Template | Variable | Source |
|---|---|---|
| Provider Inquiry | `{{providerName}}` | `provider.displayName` from DB |
| Provider Inquiry | `{{projectTitle}}` | `project.title` from DB |
| Provider Inquiry | `{{customerName}}` | Customer form input |
| Provider Inquiry | `{{customerEmail}}` | Customer form input |
| Provider Inquiry | `{{customerWhatsapp}}` | Customer form input (optional) |
| Provider Inquiry | `{{message}}` | Customer form input |
| Customer Confirmation | `{{customerName}}` | Customer form input |
| Customer Confirmation | `{{projectTitle}}` | `project.title` from DB |
| Admin Notification | All customer fields | Custom request form inputs |

> **Security Note:** All template variables are HTML-escaped before insertion to prevent XSS.
