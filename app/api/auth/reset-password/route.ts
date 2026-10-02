// app/api/auth/reset-password/route.ts
// Request or fulfill a password reset with 6-digit verification code, atomic attempts (N6),
// two-key rate limiting (N9), HTML-escaped template (N10), and consistent error handling (N14).

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { sendEmail } from "@/lib/email/email-service";
import { renderPasswordResetEmail } from "@/lib/email/templates/password-reset";
import { z } from "zod";
import { generateSecureOtp, hashSecretToken, verifySecretToken } from "@/lib/utils/crypto";
import {
  passwordResetRequestLimiter,
  passwordResetVerifyLimiter,
  getRequestIp,
} from "@/lib/utils/rate-limit";

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
    const ip = await getRequestIp(req);
    const body = await req.json();

    if (body.action === "request") {
      const parsed = RequestResetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message || "Invalid input" },
          { status: 400 }
        );
      }

      const { email } = parsed.data;

      // Two-key rate limit on password reset requests (N9 & N14): IP (15/15m) + Email (3/15m)
      const [ipCheck, emailCheck] = await Promise.all([
        passwordResetRequestLimiter.check(`ip:${ip}`),
        passwordResetRequestLimiter.check(`email:${email}`),
      ]);

      if (!ipCheck.success || !emailCheck.success) {
        if (ipCheck.error || emailCheck.error) {
          return NextResponse.json(
            { error: "Password reset service temporarily unavailable. Please try again later." },
            { status: 503 }
          );
        }
        const resetTime = Math.max(ipCheck.reset, emailCheck.reset);
        const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Too many password reset requests. Please wait 15 minutes before trying again." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }

      const user = await db.user.findUnique({
        where: { email },
      });

      // Avoid account enumeration: always return identical generic response
      if (!user) {
        return NextResponse.json({
          success: true,
          message: "If an account exists with this email, a 6-digit reset code has been sent.",
        });
      }

      // Generate cryptographically secure reset code
      const resetCode = generateSecureOtp();
      const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      // Clean existing reset tokens for this email
      await db.verificationToken.deleteMany({
        where: { identifier: `reset:${email}` },
      });

      // Store hashed reset token
      await db.verificationToken.create({
        data: {
          identifier: `reset:${email}`,
          token: hashSecretToken(resetCode),
          expires,
          attempts: 0,
        },
      });

      // Render escaped password-reset email template (N10)
      const { subject, html, text } = renderPasswordResetEmail({
        userName: user.name,
        resetCode,
        expiresInMinutes: 15,
      });

      sendEmail({
        to: email,
        subject,
        html,
        text,
      }).catch((emailErr) => {
        console.error("[Reset Password] Background email error:", emailErr);
      });

      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, a 6-digit reset code has been sent.",
      });
    }

    if (body.action === "reset") {
      const parsed = VerifyAndResetSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message || "Invalid input" },
          { status: 400 }
        );
      }

      const { email, code, newPassword } = parsed.data;

      // Two-key rate limit reset verification attempts (N9 & N14): Email (5/15m) + IP ceiling (40/15m)
      const [verifyCheck, ipCheck] = await Promise.all([
        passwordResetVerifyLimiter.check(`verify:${email}`),
        passwordResetVerifyLimiter.check(`ip:${ip}`),
      ]);

      if (!verifyCheck.success || !ipCheck.success) {
        if (verifyCheck.error || ipCheck.error) {
          return NextResponse.json(
            { error: "Password reset service temporarily unavailable. Please try again later." },
            { status: 503 }
          );
        }
        // Do NOT delete tokens on rate limit hit (M5)
        const resetTime = Math.max(verifyCheck.reset, ipCheck.reset);
        const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
        return NextResponse.json(
          { error: "Too many failed reset attempts. Please wait before trying again." },
          { status: 429, headers: { "Retry-After": String(retryAfter) } }
        );
      }

      const now = new Date();
      const resetIdentifier = `reset:${email}`;

      // N6: Consume the attempt first, atomically, before comparing the code
      const claimed = await db.verificationToken.updateMany({
        where: {
          identifier: resetIdentifier,
          expires: { gt: now },
          attempts: { lt: 5 },
        },
        data: {
          attempts: { increment: 1 },
        },
      });

      if (claimed.count === 0) {
        const existingTokens = await db.verificationToken.findMany({
          where: { identifier: resetIdentifier },
        });

        if (existingTokens.some((rec) => rec.attempts >= 5)) {
          await db.verificationToken
            .deleteMany({ where: { identifier: resetIdentifier } })
            .catch(() => null);
          return NextResponse.json(
            {
              error:
                "Too many failed attempts. This reset code has been invalidated. Please request a new code.",
            },
            { status: 400 }
          );
        }

        return NextResponse.json(
          { error: "Reset code has expired or was not found. Please request a new code." },
          { status: 400 }
        );
      }

      const tokenRecords = await db.verificationToken.findMany({
        where: { identifier: resetIdentifier },
      });

      const activeRecord = tokenRecords.find((rec) => now <= rec.expires);

      if (!activeRecord) {
        return NextResponse.json(
          { error: "Reset code has expired or was not found. Please request a new code." },
          { status: 400 }
        );
      }

      const isValid = verifySecretToken(code, activeRecord.token);

      if (!isValid) {
        const remaining = Math.max(0, 5 - activeRecord.attempts);
        return NextResponse.json(
          {
            error: `Invalid reset code. ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } remaining.`,
          },
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

      await db.$transaction(async (tx) => {
        await tx.user.update({
          where: { email },
          data: {
            passwordHash,
            tokenVersion: { increment: 1 },
            emailVerified: user.emailVerified || new Date(),
          },
        });

        // Revoke all active sessions (M6)
        await tx.session.deleteMany({
          where: { userId: user.id },
        });

        // Clear reset tokens
        await tx.verificationToken.deleteMany({
          where: { identifier: resetIdentifier },
        });

        await tx.auditLog
          .create({
            data: {
              userId: user.id,
              action: "PASSWORD_RESET_COMPLETED",
              entityType: "User",
              entityId: user.id,
              details: { email },
            },
          })
          .catch(() => null);
      });

      // N7: Reset ONLY the email-scoped key on success, never the IP key
      await passwordResetVerifyLimiter.reset(`verify:${email}`);

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
