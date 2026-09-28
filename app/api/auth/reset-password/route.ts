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
      await sendEmail({
        to: email,
        subject: `Your ${APP_NAME} Password Reset Code: ${resetCode}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #102124;">
            <div style="margin-bottom: 24px;">
              <h1 style="color: #155761; font-size: 22px; font-weight: bold; margin: 0;">Password Reset Request</h1>
            </div>
            <p style="font-size: 14px; line-height: 24px; color: #526267;">
              Hello ${user.name || "there"},<br/>
              We received a request to reset your password for your <strong>${APP_NAME}</strong> account.
            </p>
            <div style="background-color: #F3F7F7; border: 1px solid #D9E2E4; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
              <div style="font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #526267; margin-bottom: 8px;">
                Your 6-Digit Reset Code
              </div>
              <div style="font-size: 32px; font-family: monospace; font-weight: bold; letter-spacing: 6px; color: #155761;">
                ${resetCode}
              </div>
              <div style="font-size: 12px; color: #526267; margin-top: 8px;">
                Expires in 15 minutes
              </div>
            </div>
            <p style="font-size: 13px; line-height: 20px; color: #526267;">
              If you did not request a password reset, you can safely ignore this email. Your current password remains unchanged.
            </p>
          </div>
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
