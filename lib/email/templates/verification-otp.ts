// lib/email/templates/verification-otp.ts
// Branded Soft Showcase transactional email template for email verification.

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
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F8FAFA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F8FAFA; padding: 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Container Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #D9E2E4; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 20px rgba(16, 33, 36, 0.04);">
          
          <!-- Header Banner -->
          <tr>
            <td style="padding: 32px 40px 24px; border-bottom: 1px solid #F3F7F7; background: linear-gradient(180deg, #F8FAFA 0%, #FFFFFF 100%);">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <!-- Logo / Brand Title -->
                    <div style="font-size: 24px; font-weight: 800; letter-spacing: -0.5px; color: #102124; text-decoration: none;">
                      <span style="color: #155761;">Soft</span><span style="color: #2F7D78;">Showcase</span>
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #DDF4EC; color: #155761; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 10px; border-radius: 6px;">
                      Verification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 40px 28px;">
              <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 800; color: #102124; line-height: 1.3;">
                Confirm your email address
              </h1>
              
              <p style="margin: 0 0 20px; font-size: 15px; color: #526267; line-height: 1.6;">
                Hi <strong style="color: #102124;">${userName}</strong>,
              </p>
              
              <p style="margin: 0 0 28px; font-size: 15px; color: #526267; line-height: 1.6;">
                Welcome to <strong>Soft Showcase</strong>! Use the 6-digit confirmation code below to activate your account and securely sign in:
              </p>

              <!-- OTP Callout Box -->
              <div style="background-color: #F8FAFA; border: 1.5px dashed #2F7D78; border-radius: 16px; padding: 24px; text-align: center; margin: 0 0 32px;">
                <div style="font-size: 11px; font-weight: 700; color: #526267; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">
                  Your Verification Code
                </div>
                <div style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #155761; font-family: 'SFMono-Regular', Consolas, Menlo, Monaco, monospace; padding-left: 10px;">
                  ${otp}
                </div>
                <div style="font-size: 12px; font-weight: 500; color: #526267; margin-top: 8px;">
                  Expires in <strong style="color: #102124;">${minutes} minutes</strong>
                </div>
              </div>

              <!-- Primary CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 28px;">
                    <a href="${verifyUrl}" target="_blank" style="display: inline-block; background-color: #155761; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 14px 36px; border-radius: 12px; box-shadow: 0 2px 8px rgba(21, 87, 97, 0.25);">
                      Verify Email Address →
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px; font-size: 13px; color: #526267; line-height: 1.5;">
                Or paste this secure link directly in your browser:
              </p>
              <p style="margin: 0 0 24px; font-size: 12px; color: #155761; word-break: break-all; background-color: #F8FAFA; padding: 10px 14px; border-radius: 8px; border: 1px solid #D9E2E4; font-family: monospace;">
                ${verifyUrl}
              </p>

              <hr style="border: none; border-top: 1px solid #F3F7F7; margin: 28px 0;" />

              <p style="margin: 0; font-size: 12px; color: #8A979B; line-height: 1.5;">
                If you did not request this account registration or believe you received this by mistake, no further action is needed — your account will remain unverified.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px; background-color: #F8FAFA; border-top: 1px solid #D9E2E4; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; font-weight: 600; color: #102124;">
                Soft Showcase — Curated Software Discovery & Direct Provider Routing
              </p>
              <p style="margin: 0; font-size: 11px; color: #8A979B;">
                © ${new Date().getFullYear()} Soft Showcase. All rights reserved.
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

  const text = `
Soft Showcase — Confirm Your Email Address

Hi ${data.userName},

Welcome to Soft Showcase! Please use the following 6-digit verification code to complete your registration:

VERIFICATION CODE: ${data.otp}
(Valid for ${minutes} minutes)

Or verify directly by clicking the link below:
${data.verifyUrl}

If you did not create an account on Soft Showcase, you can safely ignore this email.

— The Soft Showcase Team
© ${new Date().getFullYear()} Soft Showcase
  `.trim();

  return { subject, html, text };
}
