// lib/email/templates/admin-notification.ts
// Email sent to ADMIN_EMAIL when a visitor submits a custom project request.
// Source of truth: docs/19-email-templates.md & docs/26-custom-project-system.md

import { APP_URL } from "@/config/constants";
import { escapeHtml } from "@/lib/email/escape";

export interface AdminCustomRequestEmailData {
  name: string;
  email: string;
  whatsapp?: string | null;
  projectTitle: string;
  category?: string | null;
  technologies?: string[] | null;
  budget?: string | null;
  deadline?: string | null;
  description: string;
  requiredFeatures: string;
  additionalRequirements?: string | null;
}

export function renderAdminCustomRequestEmail(data: AdminCustomRequestEmailData) {
  const name = escapeHtml(data.name);
  const email = escapeHtml(data.email);
  const whatsapp = data.whatsapp ? escapeHtml(data.whatsapp) : "Not provided";
  const projectTitle = escapeHtml(data.projectTitle);
  const category = data.category ? escapeHtml(data.category) : "Unspecified";
  const technologies = data.technologies && data.technologies.length > 0
    ? escapeHtml(data.technologies.join(", "))
    : "None specified";
  const budget = data.budget ? escapeHtml(data.budget) : "Not specified";
  const deadline = data.deadline ? escapeHtml(data.deadline) : "Flexible";
  const description = escapeHtml(data.description);
  const requiredFeatures = escapeHtml(data.requiredFeatures);
  const additionalRequirements = data.additionalRequirements
    ? escapeHtml(data.additionalRequirements)
    : null;

  const adminDashboardUrl = escapeHtml(`${APP_URL}/admin/custom-requests`);
  const subject = `New Custom Project Request: ${data.projectTitle} — Soft Showcase`;
  const safeSubject = escapeHtml(subject);

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${safeSubject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 20px; background-color: #f9fafb; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 28px; }
    .header { background: #1a1a2e; color: #ffffff; padding: 20px; border-radius: 8px 8px 0 0; margin: -28px -28px 24px -28px; }
    h1 { margin: 0; font-size: 20px; font-weight: bold; }
    .section-title { font-weight: bold; color: #374151; margin-top: 20px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
    .info-box { background: #f3f4f6; padding: 12px 16px; border-radius: 8px; margin: 8px 0; font-size: 14px; }
    .btn { display: inline-block; background-color: #4f46e5; color: #ffffff !important; padding: 10px 18px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; margin-top: 16px; }
    .footer { margin-top: 28px; border-top: 1px solid #e5e7eb; padding-top: 14px; font-size: 12px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Soft Showcase</h1>
      <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">New Custom Project Request</p>
    </div>

    <p class="section-title">Requester Information</p>
    <div class="info-box">
      <strong>Name:</strong> ${name}<br>
      <strong>Email:</strong> <a href="mailto:${email}" style="color: #4f46e5;">${email}</a><br>
      <strong>WhatsApp:</strong> ${whatsapp}
    </div>

    <p class="section-title">Project Details</p>
    <div class="info-box">
      <strong>Title:</strong> ${projectTitle}<br>
      <strong>Category:</strong> ${category}<br>
      <strong>Preferred Tech:</strong> ${technologies}<br>
      <strong>Budget:</strong> ${budget}<br>
      <strong>Target Deadline:</strong> ${deadline}
    </div>

    <p class="section-title">Description & Scope</p>
    <div class="info-box" style="white-space: pre-wrap;">${description}</div>

    <p class="section-title">Required Features</p>
    <div class="info-box" style="white-space: pre-wrap;">${requiredFeatures}</div>

    ${additionalRequirements ? `
      <p class="section-title">Additional Requirements</p>
      <div class="info-box" style="white-space: pre-wrap;">${additionalRequirements}</div>
    ` : ""}

    <div style="margin-top: 24px;">
      <a href="${adminDashboardUrl}" class="btn">View in Admin Dashboard</a>
    </div>

    <div class="footer">
      <p>Received via Soft Showcase custom software request form.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
New Custom Project Request — Soft Showcase

Requester: ${data.name} (${data.email})
WhatsApp: ${data.whatsapp || "Not provided"}

Project: ${data.projectTitle}
Category: ${data.category || "Unspecified"}
Preferred Tech: ${data.technologies?.join(", ") || "None specified"}
Budget: ${data.budget || "Not specified"}
Target Deadline: ${data.deadline || "Flexible"}

Description:
${data.description}

Required Features:
${data.requiredFeatures}
${data.additionalRequirements ? `\nAdditional Requirements:\n${data.additionalRequirements}` : ""}

Review in Admin Dashboard: ${adminDashboardUrl}
  `.trim();

  return { subject, html, text };
}
