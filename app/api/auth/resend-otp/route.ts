// app/api/auth/resend-otp/route.ts
// Resend a fresh 6-digit OTP code to a user's email with anti-enumeration and rate limiting.
// Supports both PendingRegistration staging and legacy tokens.

import { db } from "@/lib/db/client";
import { ResendOtpSchema } from "@/lib/validation/auth.schema";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";
import { generateSecureOtp, hashSecretToken } from "@/lib/utils/crypto";
import { otpResendLimiter, getRequestIp } from "@/lib/utils/rate-limit";

const GENERIC_RESEND_RESPONSE = {
  success: true,
  message: "If an unverified account exists with this email address, a new verification code has been sent.",
};

export async function POST(req: Request) {
  try {
    const ip = await getRequestIp(req);
    const body = await req.json();
    const result = ResendOtpSchema.safeParse(body);

    if (!result.success) {
      return Response.json(
        { error: "Please provide a valid email address" },
        { status: 400 }
      );
    }

    const { email } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit on resend requests
    const rateCheck = await otpResendLimiter.check(`resend:${normalizedEmail}`);
    const ipCheck = await otpResendLimiter.check(`ip:${ip}`);
    if (!rateCheck.success || !ipCheck.success) {
      if (rateCheck.error || ipCheck.error) {
        return Response.json(
          { error: "Verification service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      const resetTime = Math.max(rateCheck.reset, ipCheck.reset);
      const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
      return Response.json(
        { error: "Too many resend requests. Please wait a few minutes before trying again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // 1. Check PendingRegistration staging first
    const pending = await db.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (pending) {
      const otp = generateSecureOtp();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

      await db.pendingRegistration.update({
        where: { email: normalizedEmail },
        data: {
          codeHash: hashSecretToken(otp),
          attempts: 0,
          expiresAt,
        },
      });

      const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
        normalizedEmail
      )}&token=${otp}`;

      sendVerificationEmail(normalizedEmail, {
        userName: pending.name || "there",
        otp,
        verifyUrl,
        expiresInMinutes: 15,
      }).catch((err) => {
        console.error("[Resend OTP] Background email error:", err);
      });

      return Response.json(GENERIC_RESEND_RESPONSE);
    }

    // 2. Legacy check: unverified User with verificationToken
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user && !user.emailVerified) {
      const otp = generateSecureOtp();
      const expires = new Date(Date.now() + 15 * 60 * 1000);

      await db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }).catch(() => null);

      await db.verificationToken.create({
        data: {
          identifier: normalizedEmail,
          token: hashSecretToken(otp),
          expires,
        },
      });

      const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
        normalizedEmail
      )}&token=${otp}`;

      sendVerificationEmail(normalizedEmail, {
        userName: user.name || "there",
        otp,
        verifyUrl,
        expiresInMinutes: 15,
      }).catch((err) => {
        console.error("[Resend OTP] Background email error:", err);
      });
    }

    // Always return generic response to prevent account enumeration
    return Response.json(GENERIC_RESEND_RESPONSE);
  } catch (error) {
    console.error("[Resend OTP] Error resending code:", error);
    return Response.json(
      { error: "Failed to resend code. Please try again later." },
      { status: 500 }
    );
  }
}
