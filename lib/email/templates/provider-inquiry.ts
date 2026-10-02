// lib/email/templates/provider-inquiry.ts
// Email notification sent to provider when a customer submits an inquiry.
// Source of truth: docs/18-email-architecture.md & docs/27-security.md

import { escapeHtml } from "@/lib/email/escape";

export interface ProviderInquiryTemplateData {
  providerName: string;
  projectTitle: string;
  projectUrl: string;
  customerName: string;
  customerEmail: string;
  customerWhatsapp?: string | null;
  message: string;
}

export function renderProviderInquiryEmail(data: ProviderInquiryTemplateData) {
  const providerName = escapeHtml(data.providerName);
  const projectTitle = escapeHtml(data.projectTitle);
  const customerName = escapeHtml(data.customerName);
  const customerEmail = escapeHtml(data.customerEmail);
  const customerWhatsapp = data.customerWhatsapp
    ? escapeHtml(data.customerWhatsapp)
    : "Not provided";
  const message = escapeHtml(data.message).replace(/\n/g, "<br>");
  const projectUrl = escapeHtml(data.projectUrl);

  const subject = `New Inquiry for ${data.projectTitle} — Soft Showcase`;
  const safeSubject = escapeHtml(subject);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; }
    h2 { color: #111827; margin-top: 0; font-size: 22px; }
    h3 { color: #374151; font-size: 16px; margin-top: 24px; margin-bottom: 8px; border-bottom: 1px solid #f3f4f6; padding-bottom: 6px; }
    .project-box { background: #f3f4f6; padding: 14px 16px; border-radius: 8px; font-weight: 600; color: #1f2937; margin: 12px 0; }
    .details-list { list-style: none; padding: 0; margin: 0; }
    .details-list li { margin-bottom: 8px; font-size: 14px; }
    .message-box { background: #f8fafc; border-left: 4px solid #4f46e5; padding: 14px 16px; border-radius: 0 8px 8px 0; font-size: 14px; color: #334155; margin: 16px 0; white-space: pre-wrap; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h2>New Project Inquiry</h2>
    <p>Hello <strong>${providerName}</strong>,</p>
    <p>You have received a new inquiry about your project listed on Soft Showcase.</p>

    <h3>Project</h3>
    <div class="project-box">
      <a href="${projectUrl}" style="color: #4f46e5; text-decoration: none;">${projectTitle}</a>
    </div>

    <h3>Customer Details</h3>
    <ul class="details-list">
      <li><strong>Name:</strong> ${customerName}</li>
      <li><strong>Email:</strong> <a href="mailto:${customerEmail}" style="color: #4f46e5;">${customerEmail}</a></li>
      <li><strong>WhatsApp:</strong> ${customerWhatsapp}</li>
    </ul>

    <h3>Customer Message</h3>
    <div class="message-box">${message}</div>

    <p style="font-size: 14px; margin-top: 20px;">
      👉 Please reply directly to the customer by emailing <a href="mailto:${customerEmail}" style="color: #4f46e5; font-weight: 600;">${customerEmail}</a>.
    </p>

    <div class="footer">
      <p>This message was sent via Soft Showcase direct provider inquiry system.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
New Project Inquiry

Hello ${data.providerName},

You have received a new inquiry about your project on Soft Showcase.

Project: ${data.projectTitle} (${data.projectUrl})

Customer Details:
- Name: ${data.customerName}
- Email: ${data.customerEmail}
- WhatsApp: ${data.customerWhatsapp || "Not provided"}

Message:
${data.message}

Please reply directly to ${data.customerEmail}.

— Soft Showcase
  `.trim();

  return { subject, html, text };
}
