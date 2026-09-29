// app/api/auth/verify-otp/route.ts
// Verify email using 6-digit OTP or token.

import { db } from "@/lib/db/client";
import { VerifyOtpSchema } from "@/lib/validation/auth.schema";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = VerifyOtpSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Invalid input";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Find valid token
    const tokenRecord = await db.verificationToken.findFirst({
      where: {
        identifier: normalizedEmail,
        token: otp.trim(),
      },
    });

    if (!tokenRecord) {
      return Response.json(
        { error: "Invalid verification code. Please check and try again." },
        { status: 400 }
      );
    }

    if (new Date() > tokenRecord.expires) {
      return Response.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // Mark user email as verified
    const updatedUser = await db.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    });

    // Delete token
    await db.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
      },
    });

    const isPartner = updatedUser?.role === "solution_partner";

    return Response.json({
      success: true,
      isPartner,
      message: isPartner
        ? "Email verified successfully! Your Partner Application is now confirmed and under review."
        : "Email verified successfully! You can now sign in.",
    });
  } catch (error) {
    console.error("[Verify OTP] Error verifying code:", error);
    return Response.json(
      { error: "Internal server error. Please try again." },
      { status: 500 }
    );
  }
}
