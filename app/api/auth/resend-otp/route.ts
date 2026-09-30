// app/api/auth/resend-otp/route.ts
// Resend a fresh 6-digit OTP code to a user's email with anti-enumeration and rate limiting.

import { db } from "@/lib/db/client";
import { ResendOtpSchema } from "@/lib/validation/auth.schema";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";
import { generateSecureOtp, hashSecretToken } from "@/lib/utils/crypto";
import { otpResendLimiter, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
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

    // Check rate limit on resend requests (Issue 22)
    const rateCheck = await otpResendLimiter.check(`resend:${normalizedEmail}`);
    const ipCheck = await otpResendLimiter.check(`ip:${ip}`);
    if (!rateCheck.success || !ipCheck.success) {
      return Response.json(
        { error: "Too many resend requests. Please wait a few minutes before trying again." },
        { status: 429 }
      );
    }

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Issue 18: Prevent account enumeration by returning an identical success response
    // regardless of whether the account exists or is already verified.
    if (!user || user.emailVerified) {
      return Response.json({
        success: true,
        message: "If an unverified account exists with this email address, a new verification code has been sent.",
      });
    }

    // Generate fresh cryptographically secure OTP (Issue 16)
    const otp = generateSecureOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Delete existing tokens
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Save hashed token to protect secret authentication credentials (Issue 19)
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

    // Send email asynchronously without blocking the response (Issue 24)
    sendVerificationEmail(normalizedEmail, {
      userName: user.name || "there",
      otp,
      verifyUrl,
      expiresInMinutes: 15,
    }).catch((err) => {
      console.error("[Resend OTP] Background email error:", err);
    });

    return Response.json({
      success: true,
      message: "If an unverified account exists with this email address, a new verification code has been sent.",
    });
  } catch (error) {
    console.error("[Resend OTP] Error resending code:", error);
    return Response.json(
      { error: "Failed to resend code. Please try again later." },
      { status: 500 }
    );
  }
}
