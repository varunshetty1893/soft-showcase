// lib/email/templates/password-reset.ts
// Branded Soft Showcase transactional email template for password reset (N10).

import { APP_NAME, APP_URL } from "@/config/constants";
import { escapeHtml } from "@/lib/email/escape";

export interface PasswordResetEmailData {
  userName?: string | null;
  resetCode: string;
  expiresInMinutes?: number;
  appBaseUrl?: string;
}

export function renderPasswordResetEmail(data: PasswordResetEmailData): {
  subject: string;
  html: string;
  text: string;
} {
  const safeName = escapeHtml(data.userName || "there");
  const safeCode = escapeHtml(data.resetCode);
  const safeAppName = escapeHtml(APP_NAME);
  const minutes = escapeHtml(data.expiresInMinutes ?? 15);

  const rawBaseUrl = (
    data.appBaseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    APP_URL
  ).replace(/\/$/, "");

  const safeBaseUrl = escapeHtml(rawBaseUrl);
  const safeLogoUrl = escapeHtml(`${rawBaseUrl}/logo.png`);

  const subject = `Your ${APP_NAME} Password Reset Code: ${data.resetCode}`;
  const safeSubject = escapeHtml(subject);

  const html = `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${safeSubject}</title></head>
<body style="margin: 0; padding: 0; background-color: #F8FAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #D9E2E4; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 33, 36, 0.04);">
          <tr>
            <td style="padding: 28px 40px 22px; border-bottom: 1px solid #F3F7F7; background: linear-gradient(180deg, #F8FAFA 0%, #FFFFFF 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td valign="middle">
                    <a href="${safeBaseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                      <img src="${safeLogoUrl}" alt="${safeAppName}" height="32" style="height: 32px; width: auto; max-width: 170px; display: block; border: 0;" />
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display: inline-block; background-color: #FEE4E2; color: #D92D20; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 5px 12px; border-radius: 8px;">
                      Security
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 40px 28px;">
              <h1 style="color: #102124; font-size: 22px; font-weight: 800; margin: 0 0 16px;">Password Reset Request</h1>
              <p style="font-size: 15px; line-height: 1.6; color: #526267; margin: 0 0 20px;">
                Hello <strong style="color: #102124;">${safeName}</strong>,
              </p>
              <p style="font-size: 15px; line-height: 1.6; color: #526267; margin: 0 0 28px;">
                We received a request to reset your password for your <strong>${safeAppName}</strong> account. Use the following 6-digit reset code:
              </p>
              <div style="background-color: #F8FAFA; border: 1.5px dashed #155761; border-radius: 16px; padding: 26px 20px; text-align: center; margin: 0 0 28px;">
                <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #526267; margin-bottom: 8px;">
                  Your 6-Digit Reset Code
                </div>
                <div style="font-size: 38px; font-family: 'SFMono-Regular', Consolas, Menlo, Monaco, monospace; font-weight: 800; letter-spacing: 10px; color: #155761; padding-left: 10px;">
                  ${safeCode}
                </div>
                <div style="font-size: 12px; font-weight: 500; color: #526267; margin-top: 8px;">
                  Expires in <strong style="color: #102124;">${minutes} minutes</strong>
                </div>
              </div>
              <p style="font-size: 13px; line-height: 1.5; color: #8A979B; margin: 0;">
                If you did not request a password reset, you can safely ignore this email. Your current password remains completely unchanged.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px; background-color: #F8FAFA; border-top: 1px solid #D9E2E4; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #8A979B;">
                © ${new Date().getFullYear()} ${safeAppName}. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

  const text = `Hello ${data.userName || "there"},\n\nYour ${APP_NAME} password reset code is: ${data.resetCode}. Valid for ${data.expiresInMinutes ?? 15} minutes.`;

  return { subject, html, text };
}
