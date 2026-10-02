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
import { escapeHtml } from "./escape";
import { APP_NAME, APP_URL } from "@/config/constants";

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
 * Send notification to a partner when their provider profile is soft-removed by an admin (Phase 2B).
 * Uses strict HTML escaping on all dynamic inputs.
 */
export async function sendPartnerRemovedEmail(data: {
  to: string;
  partnerName: string;
  reason: string;
}): Promise<EmailResult> {
  const safeName = escapeHtml(data.partnerName || "Partner");
  const safeReason = escapeHtml(data.reason || "Administrative policy review");
  const safeAppName = escapeHtml(APP_NAME);

  const subject = `Notice Regarding Your Partner Profile — ${APP_NAME}`;
  const html = `
    <div style="font-family: sans-serif; color: #102124; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #D9E2E4; border-radius: 12px;">
      <h2 style="color: #155761; margin-top: 0;">Partner Profile Removed</h2>
      <p>Hello <strong>${safeName}</strong>,</p>
      <p>Your Solution Partner profile on <strong>${safeAppName}</strong> has been removed from public listings by platform administration.</p>
      <div style="background: #F8FAFA; border-left: 4px solid #E11D48; padding: 12px 16px; margin: 16px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px;"><strong>Reason provided:</strong><br/>${safeReason}</p>
      </div>
      <p style="font-size: 14px; color: #526267;">Your standard customer account remains active, and any historical inquiry or transaction records are preserved. If you believe this action was taken in error, please contact platform support.</p>
    </div>
  `;
  const text = `Hello ${data.partnerName},\n\nYour Solution Partner profile on ${APP_NAME} has been removed from public listings.\n\nReason: ${data.reason}\n\nYour customer account remains active. Please contact support if you have questions.`;

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}

/**
 * Send notification to a partner when an admin moderates or requests changes on their project (Phase 3).
 * Uses strict HTML escaping on all dynamic inputs.
 */
export async function sendPartnerModerationEmail(data: {
  to: string;
  partnerName: string;
  projectTitle: string;
  projectId: string;
  actionLabel: string;
  note: string;
}): Promise<EmailResult> {
  const safeName = escapeHtml(data.partnerName || "Partner");
  const safeTitle = escapeHtml(data.projectTitle);
  const safeAction = escapeHtml(data.actionLabel);
  const safeNote = escapeHtml(data.note);
  const safeUrl = escapeHtml(`${APP_URL}/partner/solutions/${data.projectId}/edit`);

  const subject = `Moderation Update for "${data.projectTitle}" — ${APP_NAME}`;
  const html = `
    <div style="font-family: sans-serif; color: #102124; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #D9E2E4; border-radius: 12px;">
      <h2 style="color: #155761; margin-top: 0;">Project Moderation Notice</h2>
      <p>Hello <strong>${safeName}</strong>,</p>
      <p>A platform administrator has updated the moderation status or requested changes on your project <strong>${safeTitle}</strong> (${safeAction}).</p>
      <div style="background: #FFFBEB; border-left: 4px solid #D97706; padding: 12px 16px; margin: 16px 0; border-radius: 6px;">
        <p style="margin: 0; font-size: 14px;"><strong>Moderator Note:</strong><br/>${safeNote}</p>
      </div>
      <p style="margin-top: 20px;">
        <a href="${safeUrl}" style="background: #155761; color: #ffffff; text-decoration: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; font-size: 14px; display: inline-block;">Review in Partner Dashboard</a>
      </p>
    </div>
  `;
  const text = `Hello ${data.partnerName},\n\nModeration update for "${data.projectTitle}" (${data.actionLabel}):\n\n${data.note}\n\nReview in your Partner Dashboard: ${APP_URL}/partner/solutions/${data.projectId}/edit`;

  return sendEmail({
    to: data.to,
    subject,
    html,
    text,
  });
}


