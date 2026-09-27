// lib/email/templates/custom-request-customer.ts
// Confirmation email sent to customer after submitting a custom project request.
// Source of truth: docs/26-custom-project-system.md & docs/19-email-templates.md

export interface CustomerCustomRequestConfirmationData {
  customerName: string;
  projectTitle: string;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderCustomerCustomRequestConfirmationEmail(
  data: CustomerCustomRequestConfirmationData
) {
  const customerName = escapeHtml(data.customerName);
  const projectTitle = escapeHtml(data.projectTitle);

  const subject = `Your Custom Project Request Has Been Received — Soft Showcase`;

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
    <h2>Custom Project Request Received ✓</h2>
    <p>Hi <strong>${customerName}</strong>,</p>
    <p>Thank you for submitting your custom project request for:</p>
    <div class="project-box">${projectTitle}</div>
    <p>
      Our architectural review team will evaluate your scope, verify technical requirements, and get in touch with you via the contact details you provided.
    </p>
    <p>
      You can track the review status of your proposal at any time in your customer portal under <strong>My Custom Requests</strong>.
    </p>

    <div class="footer">
      <p>© Soft Showcase Team. This is an automated confirmation email.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Custom Project Request Received

Hi ${data.customerName},

Thank you for submitting your custom project request for:
${data.projectTitle}

Our team will review your requirements and get in touch via the contact details you provided.
You can track the status in your customer portal under My Custom Requests.

Best regards,
Soft Showcase Team
  `.trim();

  return { subject, html, text };
}
