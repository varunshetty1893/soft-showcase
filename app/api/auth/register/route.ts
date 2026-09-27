// app/api/auth/register/route.ts
// Registration route with input validation, password hashing, and OTP generation.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { RegisterSchema } from "@/lib/validation/auth.schema";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";

export async function POST(req: Request) {
  try {
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
    let user;
    if (existingUser) {
      user = await db.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
          isAdmin: existingUser.isAdmin || isAdmin,
        },
      });
    } else {
      user = await db.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          isAdmin,
        },
      });
    }

    // Generate secure 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Remove any existing verification tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Save new verification token
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: otp,
        expires,
      },
    });

    // Build direct 1-click verification URL
    const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
      normalizedEmail
    )}&token=${otp}`;

    // Send verification email via Gmail SMTP
    const emailResult = await sendVerificationEmail(normalizedEmail, {
      userName: name,
      otp,
      verifyUrl,
      expiresInMinutes: 15,
    });

    if (!emailResult.success) {
      console.error("[Register] Failed to send verification email:", emailResult.error);
    }

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
