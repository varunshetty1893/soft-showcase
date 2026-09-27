// lib/email/templates/customer-confirmation.ts
// Confirmation email sent to customer after submitting an inquiry.
// Source of truth: docs/18-email-architecture.md

export interface CustomerConfirmationTemplateData {
  customerName: string;
  projectTitle: string;
  projectUrl: string;
  providerName: string;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderCustomerConfirmationEmail(data: CustomerConfirmationTemplateData) {
  const customerName = escapeHtml(data.customerName);
  const projectTitle = escapeHtml(data.projectTitle);
  const projectUrl = escapeHtml(data.projectUrl);
  const providerName = escapeHtml(data.providerName);

  const subject = `Your Inquiry Has Been Received — Soft Showcase`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; }
    h2 { color: #111827; margin-top: 0; font-size: 22px; }
    .project-box { background: #f3f4f6; padding: 14px 16px; border-radius: 8px; font-weight: 600; color: #1f2937; margin: 16px 0; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 13px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Inquiry Received</h2>
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Thank you for your interest in <a href="${projectUrl}" style="color: #4f46e5; text-decoration: none;"><strong>${projectTitle}</strong></a>.</p>
    <p>Your inquiry has been successfully forwarded to the verified provider (<strong>${providerName}</strong>). They will contact you shortly using the contact details you provided.</p>

    <div class="footer">
      <p>— The Soft Showcase Team</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Inquiry Received

Hi ${data.customerName},

Thank you for your interest in "${data.projectTitle}" (${data.projectUrl}).

Your inquiry has been forwarded to ${data.providerName}. They will contact you using the details you provided.

— The Soft Showcase Team
  `.trim();

  return { subject, html, text };
}
