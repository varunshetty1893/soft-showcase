// app/api/auth/verify-otp/route.ts
// Verify email using 6-digit OTP or token with attempt limiting and hashed secret verification.

import { db } from "@/lib/db/client";
import { VerifyOtpSchema } from "@/lib/validation/auth.schema";
import { hashSecretToken, verifySecretToken } from "@/lib/utils/crypto";
import { otpVerifyLimiter, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const result = VerifyOtpSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Invalid input";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limit and maximum attempt limits per email and IP (Issue 17 & 22)
    const emailAttemptCheck = otpVerifyLimiter.check(`email:${normalizedEmail}`);
    const ipAttemptCheck = otpVerifyLimiter.check(`ip:${ip}`);

    if (!emailAttemptCheck.success || !ipAttemptCheck.success) {
      // Invalidate the token after too many failed attempts to prevent brute force
      await db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });
      return Response.json(
        {
          error:
            "Maximum verification attempts exceeded. Your previous code has been invalidated for security. Please request a new code.",
        },
        { status: 429 }
      );
    }

    // Find token matching either the SHA-256 hash or legacy plaintext token (Issue 19)
    const tokenRecords = await db.verificationToken.findMany({
      where: {
        identifier: normalizedEmail,
      },
    });

    const validRecord = tokenRecords.find((rec) =>
      verifySecretToken(otp, rec.token)
    );

    if (!validRecord) {
      const remaining = emailAttemptCheck.remaining;
      return Response.json(
        {
          error: `Invalid verification code. ${remaining} attempt${
            remaining === 1 ? "" : "s"
          } remaining before the code expires.`,
        },
        { status: 400 }
      );
    }

    if (new Date() > validRecord.expires) {
      await db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      });
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

    // Delete tokens and reset attempt limit on successful verification
    await db.verificationToken.deleteMany({
      where: {
        identifier: normalizedEmail,
      },
    });
    otpVerifyLimiter.reset(`email:${normalizedEmail}`);

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
