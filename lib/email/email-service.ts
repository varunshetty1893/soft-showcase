// lib/email/email-service.ts
// Public email service for transactional emails across Soft Showcase.
// Source of truth: docs/18-email-architecture.md

import { createEmailProvider, EmailResult } from "./providers/email-provider";
import { renderProviderInquiryEmail } from "./templates/provider-inquiry";
import { renderCustomerConfirmationEmail } from "./templates/customer-confirmation";
import {
  renderAdminCustomRequestEmail,
  type AdminCustomRequestEmailData,
} from "./templates/admin-notification";
import {
  renderCustomerCustomRequestConfirmationEmail,
  type CustomerCustomRequestConfirmationData,
} from "./templates/custom-request-customer";
import {
  renderVerificationOtpEmail,
  type VerificationOtpTemplateData,
} from "./templates/verification-otp";
import {
  renderAccountExistsEmail,
  type AccountExistsEmailData,
} from "./templates/account-exists";
import { APP_URL } from "@/config/constants";

export interface InquiryEmailData {
  inquiry: {
    name: string;
    email: string;
    whatsapp?: string | null;
    message: string;
  };
  project: {
    title: string;
    id: string;
    slug: string;
  };
  provider: {
    displayName: string;
    email: string;
  };
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  fromName?: string;
};

/**
 * Send a raw transactional email via configured provider.
 */
export async function sendEmail(payload: EmailPayload): Promise<EmailResult> {
  const provider = createEmailProvider();
  return provider.send(payload);
}

/**
 * Send inquiry notification email to the project provider.
 */
export async function sendProviderInquiryEmail(data: InquiryEmailData): Promise<EmailResult> {
  const projectUrl = `${APP_URL}/projects/${data.project.slug}`;
  const { subject, html, text } = renderProviderInquiryEmail({
    providerName: data.provider.displayName,
    projectTitle: data.project.title,
    projectUrl,
    customerName: data.inquiry.name,
    customerEmail: data.inquiry.email,
    customerWhatsapp: data.inquiry.whatsapp,
    message: data.inquiry.message,
  });

  return sendEmail({
    to: data.provider.email,
    subject,
    html,
    text,
  });
}

/**
 * Send confirmation email to the customer who submitted an inquiry.
 */
export async function sendCustomerConfirmationEmail(data: InquiryEmailData): Promise<EmailResult> {
  const projectUrl = `${APP_URL}/projects/${data.project.slug}`;
  const { subject, html, text } = renderCustomerConfirmationEmail({
    customerName: data.inquiry.name,
    projectTitle: data.project.title,
    projectUrl,
    providerName: data.provider.displayName,
  });

  return sendEmail({
    to: data.inquiry.email,
    subject,
    html,
    text,
  });
}

/**
 * Send notification to system administrator.
 */
export async function sendAdminNotification(subject: string, bodyHtml: string): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[Email] ADMIN_EMAIL not configured. Skipping admin notification.");
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  return sendEmail({
    to: adminEmail,
    subject,
    html: bodyHtml,
  });
}

/**
 * Send custom project notification email to system administrator.
 */
export async function sendAdminCustomRequestEmail(
  data: AdminCustomRequestEmailData
): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[Email] ADMIN_EMAIL not configured. Skipping admin custom request notification.");
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const { subject, html, text } = renderAdminCustomRequestEmail(data);
  return sendEmail({
    to: adminEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send confirmation email to the customer who submitted a custom project request.
 */
export async function sendCustomerCustomRequestConfirmationEmail(
  customerEmail: string,
  data: CustomerCustomRequestConfirmationData
): Promise<EmailResult> {
  const { subject, html, text } = renderCustomerCustomRequestConfirmationEmail(data);
  return sendEmail({
    to: customerEmail,
    subject,
    html,
    text,
  });
}

/**
 * Send email verification code (OTP) and 1-click verification link to a registered user.
 */
export async function sendVerificationEmail(
  email: string,
  data: VerificationOtpTemplateData
): Promise<EmailResult> {
  const { subject, html, text } = renderVerificationOtpEmail(data);
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send notification to an existing verified user when a duplicate registration is attempted.
 */
export async function sendAccountExistsEmail(
  email: string,
  data: AccountExistsEmailData
): Promise<EmailResult> {
  const { subject, html, text } = renderAccountExistsEmail(data);
  return sendEmail({
    to: email,
    subject,
    html,
    text,
  });
}

/**
 * Send notification email when a partner account is soft-removed by admin.
 */
export async function sendPartnerRemovedEmail(data: {
  to: string;
  partnerName: string;
  reason: string;
}): Promise<EmailResult> {
  return sendEmail({
    to: data.to,
    subject: "Update Regarding Your Solution Partner Status — Soft Showcase",
    html: `<p>Hello ${data.partnerName},</p><p>Your solution partner account status has been updated. Reason: ${data.reason}</p>`,
    text: `Hello ${data.partnerName},\n\nYour solution partner account status has been updated. Reason: ${data.reason}`,
  });
}



export async function sendPartnerModerationEmail(data: {
  to: string;
  partnerName: string;
  projectTitle: string;
  projectId: string;
  actionLabel: string;
  note: string;
}): Promise<EmailResult> {
  const escape = (value: string) => value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character] || character));
  const projectUrl = APP_URL + "/partner/solutions/" + encodeURIComponent(data.projectId);
  const subject = (data.actionLabel + ": " + data.projectTitle + " — Soft Showcase").replace(/[\r\n]+/g, " ");
  const note = escape(data.note).replace(/\n/g, "<br>");

  return sendEmail({
    to: data.to,
    subject,
        html: '<p>Hello ' + escape(data.partnerName) + ',</p><p>Your project <strong>' + escape(data.projectTitle) + '</strong> has been updated: <strong>' + escape(data.actionLabel) + '</strong>.</p><p><strong>Administrator note:</strong></p><p>' + note + '</p><p><a href=\"' + escape(projectUrl) + '\">Review your project</a></p>',
    text: "Hello " + data.partnerName + "\n\nYour project \"" + data.projectTitle + "\" has been updated: " + data.actionLabel + ".\n\nAdministrator note:\n" + data.note + "\n\nReview your project: " + projectUrl,
  });
}
