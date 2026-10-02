// lib/email/templates/account-exists.ts
// Notification email sent when a registration attempt is made for an already-verified email.
// Prevents pre-hijacking and account enumeration while guiding legitimate owners.

import { APP_NAME, APP_URL } from "@/config/constants";
import { escapeHtml } from "@/lib/email/escape";

export interface AccountExistsEmailData {
  userName?: string;
  loginUrl?: string;
  resetUrl?: string;
}

export function renderAccountExistsEmail(data: AccountExistsEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const rawLoginUrl = data.loginUrl || `${APP_URL}/login`;
  const rawResetUrl = data.resetUrl || `${APP_URL}/forgot-password`;
  const rawName = data.userName || "there";

  const safeName = escapeHtml(rawName);
  const safeLoginUrl = escapeHtml(rawLoginUrl);
  const safeResetUrl = escapeHtml(rawResetUrl);
  const safeAppName = escapeHtml(APP_NAME);

  const subject = `Account Notification — ${APP_NAME}`;
  const safeSubject = escapeHtml(subject);

  const text = `
Hello ${rawName},

A registration attempt was made on ${APP_NAME} using this email address.

However, an account with this email is already registered and verified.

If this was you, you can sign in directly:
${rawLoginUrl}

Or if you have forgotten your password, you can reset it here:
${rawResetUrl}

If you did not make this request, you can safely ignore this email. Your existing password and account remain secure.

— The ${APP_NAME} Team
`.trim();

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${safeSubject}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFA; color: #102124; margin: 0; padding: 40px 20px;">
  <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border-radius: 16px; border: 1px solid #D9E2E4; padding: 36px; box-shadow: 0 4px 12px rgba(16,33,36,0.03);">
    <div style="margin-bottom: 24px;">
      <h2 style="font-size: 20px; font-weight: 700; color: #102124; margin: 0 0 8px;">Account Notification</h2>
      <p style="font-size: 14px; color: #526267; margin: 0; line-height: 1.5;">Notice regarding your ${safeAppName} account</p>
    </div>
    <div style="font-size: 14px; line-height: 1.6; color: #102124; margin-bottom: 28px;">
      <p>Hello ${safeName},</p>
      <p>A registration attempt was recently made on <strong>${safeAppName}</strong> using this email address.</p>
      <p>Because an account is already registered and verified for this address, no new account was created.</p>
      <p style="margin-top: 24px;">
        <a href="${safeLoginUrl}" style="display: inline-block; background-color: #155761; color: #FFFFFF; text-decoration: none; padding: 12px 24px; font-weight: 600; font-size: 14px; border-radius: 8px;">Sign In to Your Account</a>
      </p>
      <p style="margin-top: 16px; font-size: 13px; color: #526267;">
        Forgot your password? <a href="${safeResetUrl}" style="color: #155761; font-weight: 600; text-decoration: underline;">Reset your password here</a>.
      </p>
    </div>
    <div style="border-top: 1px solid #F3F7F7; padding-top: 20px; font-size: 12px; color: #708186; line-height: 1.5;">
      <p style="margin: 0 0 6px;"><strong>Security notice:</strong> If you did not make this request, someone may have entered your email by mistake. Your account and password remain completely secure and no action is required.</p>
      <p style="margin: 0;">— The ${safeAppName} Security Team</p>
    </div>
  </div>
</body>
</html>
`.trim();

  return { subject, html, text };
}
