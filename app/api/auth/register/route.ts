// app/api/auth/register/route.ts
// Registration route with rate limiting, secure OTP generation, hashed token storage, and non-blocking email delivery.

import { db } from "@/lib/db/client";
import bcrypt from "bcryptjs";
import { RegisterSchema } from "@/lib/validation/auth.schema";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";
import { generateSecureOtp, hashSecretToken } from "@/lib/utils/crypto";
import { authRegisterLimiter, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rateCheck = authRegisterLimiter.check(ip);
    if (!rateCheck.success) {
      return Response.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
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

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser && existingUser.emailVerified) {
      return Response.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const isAdmin = Boolean(
      process.env.ADMIN_EMAIL &&
        process.env.ADMIN_EMAIL.toLowerCase() === normalizedEmail
    );

    // Create or update user
    if (existingUser) {
      await db.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
          isAdmin: existingUser.isAdmin || isAdmin,
        },
      });
    } else {
      await db.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          isAdmin,
        },
      });
    }

    // Generate cryptographically secure 6-digit numeric OTP (Issue 16)
    const otp = generateSecureOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing verification tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Save token as SHA-256 hash to protect sensitive secrets (Issue 19)
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: hashSecretToken(otp),
        expires,
      },
    });

    // Build direct 1-click verification URL
    const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
      normalizedEmail
    )}&token=${otp}`;

    // Send verification email asynchronously without blocking the response (Issue 24)
    sendVerificationEmail(normalizedEmail, {
      userName: name,
      otp,
      verifyUrl,
      expiresInMinutes: 15,
    }).catch((emailErr) => {
      console.error("[Register] Background email delivery error:", emailErr);
    });

    return Response.json({
      success: true,
      email: normalizedEmail,
      message: "Verification code sent to your email.",
    });
  } catch (error) {
    console.error("[Register] Error during registration:", error);
    return Response.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
