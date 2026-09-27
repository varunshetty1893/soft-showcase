// lib/email/templates/verification-otp.ts
// Verification email template containing 6-digit OTP and 1-click verification link.
// Source of truth: docs/18-email-architecture.md

export interface VerificationOtpTemplateData {
  userName: string;
  otp: string;
  verifyUrl: string;
  expiresInMinutes?: number;
}

function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function renderVerificationOtpEmail(data: VerificationOtpTemplateData) {
  const userName = escapeHtml(data.userName);
  const otp = escapeHtml(data.otp);
  const verifyUrl = data.verifyUrl;
  const minutes = data.expiresInMinutes || 15;

  const subject = `${otp} is your Soft Showcase verification code`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 24px; background-color: #f9fafb; }
    .container { max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
    .brand-badge { display: inline-block; background: #4f46e5; color: #ffffff; font-weight: 800; font-size: 14px; border-radius: 8px; padding: 6px 12px; margin-bottom: 20px; }
    h2 { color: #111827; margin: 0 0 16px; font-size: 24px; font-weight: 800; }
    .otp-card { background: #f4f5f9; border: 2px dashed #cbd5e1; border-radius: 12px; text-align: center; padding: 20px; margin: 24px 0; }
    .otp-digits { font-size: 36px; font-weight: 900; letter-spacing: 8px; color: #4f46e5; font-family: monospace; }
    .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 8px; margin: 12px 0 20px; }
    .note { font-size: 13px; color: #6b7280; margin-top: 16px; }
    .footer { margin-top: 32px; border-top: 1px solid #e5e7eb; padding-top: 16px; font-size: 12px; color: #9ca3af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="brand-badge">Soft Showcase</div>
    <h2>Verify your email address</h2>
    <p>Hi <strong>${userName}</strong>,</p>
    <p>Welcome to Soft Showcase! Please use the following 6-digit verification code to complete your registration:</p>

    <div class="otp-card">
      <div style="font-size: 13px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 600; letter-spacing: 1px;">Your Verification Code</div>
      <div class="otp-digits">${otp}</div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">Expires in ${minutes} minutes</div>
    </div>

    <p style="text-align: center; margin: 20px 0 8px;">Or click the button below to verify automatically:</p>
    <div style="text-align: center;">
      <a href="${verifyUrl}" class="btn">Verify Email Address</a>
    </div>

    <p class="note">If you did not create an account on Soft Showcase, you can safely ignore this email.</p>

    <div class="footer">
      <p>© ${new Date().getFullYear()} Soft Showcase. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
  `.trim();

  const text = `
Soft Showcase — Verify Your Email Address

Hi ${data.userName},

Your verification code is: ${data.otp}
(Expires in ${minutes} minutes)

Or verify directly by visiting:
${data.verifyUrl}

If you did not request this, you can safely ignore this email.

— The Soft Showcase Team
  `.trim();

  return { subject, html, text };
}
