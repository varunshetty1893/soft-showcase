// app/api/auth/register/route.ts
// Registration route with rate limiting, PendingRegistration staging (anti-pre-hijack),
// and strict anti-enumeration guarantees.

import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/lib/validation/auth.schema";
import { sendVerificationEmail, sendAccountExistsEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";
import { generateSecureOtp, hashSecretToken } from "@/lib/utils/crypto";
import { authRegisterLimiter, getRequestIp } from "@/lib/utils/rate-limit";

const GENERIC_SUCCESS_RESPONSE = {
  success: true,
  message: "If you do not have an account, a verification code has been sent to your email.",
};

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const ip = await getRequestIp(req);
    const ipCheck = await authRegisterLimiter.check(`ip:${ip}`);
    if (!ipCheck.success) {
      if (ipCheck.error) {
        return Response.json(
          { error: "Authentication service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      const retryAfter = Math.max(1, Math.ceil((ipCheck.reset - Date.now()) / 1000));
      return Response.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const body = await req.json();
    const result = RegisterSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Invalid input data";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { name, email, password } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    const emailCheck = await authRegisterLimiter.check(`email:${normalizedEmail}`);
    if (!emailCheck.success) {
      if (emailCheck.error) {
        return Response.json(
          { error: "Authentication service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      const retryAfter = Math.max(1, Math.ceil((emailCheck.reset - Date.now()) / 1000));
      return Response.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // 1. Check if an already-verified user exists
    const existingVerifiedUser = await db.user.findFirst({
      where: {
        email: normalizedEmail,
        emailVerified: { not: null },
      },
    });

    if (existingVerifiedUser) {
      // Send "Account already exists / Reset your password" email without exposing status to caller (anti-enumeration)
      try {
        await sendAccountExistsEmail(normalizedEmail, {
          userName: existingVerifiedUser.name || undefined,
          loginUrl: `${APP_URL}/login`,
          resetUrl: `${APP_URL}/forgot-password`,
        });
      } catch (emailErr) {
        console.error("[Register] Account-exists notification error:", emailErr);
      }

      // Return identical generic response to prevent user enumeration
      return Response.json({
        ...GENERIC_SUCCESS_RESPONSE,
        email: normalizedEmail,
      });
    }

    // 2. Stage unverified registrant in PendingRegistration table (never touch User table before verification)
    const passwordHash = await bcrypt.hash(password, 10);
    const otp = generateSecureOtp();
    const codeHash = hashSecretToken(otp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      update: {
        name,
        passwordHash,
        codeHash,
        attempts: 0,
        expiresAt,
      },
      create: {
        email: normalizedEmail,
        name,
        passwordHash,
        codeHash,
        attempts: 0,
        expiresAt,
      },
    });

    // Clean any legacy verification tokens
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    }).catch(() => null);

    // Build direct 1-click verification URL
    const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
      normalizedEmail
    )}&token=${otp}`;

    // Send verification email (await delivery so serverless lambda does not freeze before completion)
    try {
      const emailResult = await sendVerificationEmail(normalizedEmail, {
        userName: name,
        otp,
        verifyUrl,
        expiresInMinutes: 15,
      });
      if (emailResult.success) {
        console.info(`[Register] Verification OTP email successfully sent to ${normalizedEmail} (MessageId: ${emailResult.messageId})`);
      } else {
        console.error(`[Register] Verification email failed for ${normalizedEmail}:`, emailResult.error);
      }
    } catch (emailErr) {
      console.error("[Register] Verification email delivery error:", emailErr);
    }

    return Response.json({
      ...GENERIC_SUCCESS_RESPONSE,
      email: normalizedEmail,
    });
  } catch (error) {
    console.error("[Register] Error during registration:", error);
    return Response.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
