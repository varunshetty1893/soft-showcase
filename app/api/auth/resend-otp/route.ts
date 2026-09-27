// app/api/auth/resend-otp/route.ts
// Resend a fresh 6-digit OTP code to a user's email.

import { db } from "@/lib/db/client";
import { ResendOtpSchema } from "@/lib/validation/auth.schema";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";

export async function POST(req: Request) {
  try {
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

    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return Response.json(
        { error: "No account found with this email." },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return Response.json(
        { error: "This email is already verified. Please sign in." },
        { status: 400 }
      );
    }

    // Generate fresh OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000);

    // Delete existing tokens
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Save new token
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: otp,
        expires,
      },
    });

    const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
      normalizedEmail
    )}&token=${otp}`;

    // Send email
    await sendVerificationEmail(normalizedEmail, {
      userName: user.name || "there",
      otp,
      verifyUrl,
      expiresInMinutes: 15,
    });

    return Response.json({
      success: true,
      message: "A new verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("[Resend OTP] Error resending code:", error);
    return Response.json(
      { error: "Failed to resend code. Please try again later." },
      { status: 500 }
    );
  }
}
