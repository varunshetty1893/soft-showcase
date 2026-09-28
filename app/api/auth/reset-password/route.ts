// app/api/auth/reset-password/route.ts
// Request or fulfill a password reset with 6-digit verification code.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/email-service";
import { APP_NAME } from "@/config/constants";
import { z } from "zod";

const RequestResetSchema = z.object({
  action: z.literal("request"),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
});

const VerifyAndResetSchema = z.object({
  action: z.literal("reset"),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address"),
  code: z.string().trim().length(6, "Reset code must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(100, "Password is too long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === "request") {
      const parsed = RequestResetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
      }

      const { email } = parsed.data;
      const user = await db.user.findUnique({
        where: { email },
      });

      // Avoid account enumeration: always return success
      if (!user) {
        return NextResponse.json({
          success: true,
          message: "If an account exists with this email, a 6-digit reset code has been sent.",
        });
      }

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Clean existing reset tokens for this email
      await db.verificationToken.deleteMany({
        where: { identifier: `reset:${email}` },
      });

      await db.verificationToken.create({
        data: {
          identifier: `reset:${email}`,
          token: resetCode,
          expires,
        },
      });

      // Send email
      const appBaseUrl = (
        process.env.NEXT_PUBLIC_APP_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
        "https://softshowcase.vercel.app"
      ).replace(/\/$/, "");
      const logoUrl = `${appBaseUrl}/logo.png`;

      await sendEmail({
        to: email,
        subject: `Your ${APP_NAME} Password Reset Code: ${resetCode}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head><meta charset="utf-8"></head>
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
                              <a href="${appBaseUrl}" target="_blank" style="text-decoration: none; display: inline-block;">
                                <img src="${logoUrl}" alt="Soft Showcase" height="32" style="height: 32px; width: auto; max-width: 170px; display: block; border: 0;" />
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
                          Hello <strong style="color: #102124;">${user.name || "there"}</strong>,
                        </p>
                        <p style="font-size: 15px; line-height: 1.6; color: #526267; margin: 0 0 28px;">
                          We received a request to reset your password for your <strong>${APP_NAME}</strong> account. Use the following 6-digit reset code:
                        </p>
                        <div style="background-color: #F8FAFA; border: 1.5px dashed #155761; border-radius: 16px; padding: 26px 20px; text-align: center; margin: 0 0 28px;">
                          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; color: #526267; margin-bottom: 8px;">
                            Your 6-Digit Reset Code
                          </div>
                          <div style="font-size: 38px; font-family: 'SFMono-Regular', Consolas, Menlo, Monaco, monospace; font-weight: 800; letter-spacing: 10px; color: #155761; padding-left: 10px;">
                            ${resetCode}
                          </div>
                          <div style="font-size: 12px; font-weight: 500; color: #526267; margin-top: 8px;">
                            Expires in <strong style="color: #102124;">15 minutes</strong>
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
        `,
        text: `Your ${APP_NAME} password reset code is: ${resetCode}. Valid for 15 minutes.`,
      });

      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a 6-digit reset code has been sent.",
      });
    }

    if (body.action === "reset") {
      const parsed = VerifyAndResetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.errors[0]?.message || "Invalid input" }, { status: 400 });
      }

      const { email, code, newPassword } = parsed.data;

      const record = await db.verificationToken.findFirst({
        where: {
          identifier: `reset:${email}`,
          token: code,
        },
      });

      if (!record) {
        return NextResponse.json(
          { error: "Invalid reset code. Please check the code and try again." },
          { status: 400 }
        );
      }

      if (new Date() > record.expires) {
        return NextResponse.json(
          { error: "This reset code has expired. Please request a new one." },
          { status: 400 }
        );
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      if (!user) {
        return NextResponse.json({ error: "User account not found." }, { status: 404 });
      }

      const passwordHash = await bcrypt.hash(newPassword, 10);

      await db.user.update({
        where: { email },
        data: {
          passwordHash,
          emailVerified: user.emailVerified || new Date(),
        },
      });

      // Clear tokens
      await db.verificationToken.deleteMany({
        where: { identifier: `reset:${email}` },
      });

      return NextResponse.json({
        success: true,
        message: "Password reset successfully. You can now sign in with your new password.",
      });
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("[Reset Password] Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again later." },
      { status: 500 }
    );
  }
}
