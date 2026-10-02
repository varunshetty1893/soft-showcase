// app/api/auth/verify-otp/route.ts
// Verifies OTP codes from PendingRegistration staging or legacy verification tokens.
// Safely creates verified users, triggers H2 admin bootstrap hook, and removes staging rows.

import { db } from "@/lib/db/client";
import { VerifyOtpSchema } from "@/lib/validation/auth.schema";
import { verifySecretToken } from "@/lib/utils/crypto";
import { otpVerifyLimiter, getRequestIp } from "@/lib/utils/rate-limit";
import { bootstrapAdminOnVerification } from "@/lib/auth/admin-bootstrap";
import { linkVerifiedUserRecords } from "@/lib/db/queries/customer";

export async function POST(req: Request) {
  try {
    const ip = await getRequestIp(req);
    const body = await req.json();
    const result = VerifyOtpSchema.safeParse(body);

    if (!result.success) {
      const firstError = result.error.errors[0]?.message || "Invalid input";
      return Response.json({ error: firstError }, { status: 400 });
    }

    const { email, otp } = result.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limiting per email and IP
    const emailAttemptCheck = await otpVerifyLimiter.check(`email:${normalizedEmail}`);
    const ipAttemptCheck = await otpVerifyLimiter.check(`ip:${ip}`);

    if (!emailAttemptCheck.success || !ipAttemptCheck.success) {
      if (emailAttemptCheck.error || ipAttemptCheck.error) {
        return Response.json(
          { error: "Verification service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }

      // Do NOT delete tokens on rate limiting (M5) - prevents attacker lockout abuse
      const resetTime = Math.max(emailAttemptCheck.reset, ipAttemptCheck.reset);
      const retryAfter = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));

      return Response.json(
        {
          error:
            "Too many verification attempts. Please wait before trying again.",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // ── Flow 1: Check PendingRegistration Staging ────────────────────────────
    const pending = await db.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (pending) {
      if (new Date() > pending.expiresAt) {
        await db.pendingRegistration.delete({ where: { email: normalizedEmail } }).catch(() => null);
        return Response.json(
          { error: "Verification code has expired. Please request a new code." },
          { status: 400 }
        );
      }

      if (pending.attempts >= 5) {
        await db.pendingRegistration.delete({ where: { email: normalizedEmail } }).catch(() => null);
        return Response.json(
          { error: "Too many failed attempts. Code has been invalidated. Please register again." },
          { status: 400 }
        );
      }

      const isValid = verifySecretToken(otp, pending.codeHash);
      if (!isValid) {
        await db.pendingRegistration.update({
          where: { email: normalizedEmail },
          data: { attempts: { increment: 1 } },
        }).catch(() => null);

        const remaining = Math.max(0, 4 - pending.attempts);
        return Response.json(
          {
            error: `Invalid verification code. ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } remaining.`,
          },
          { status: 400 }
        );
      }

      // Valid OTP: Atomically materialize User, delete pending row
      const existingUser = await db.user.findUnique({
        where: { email: normalizedEmail },
      });

      let finalUser;
      if (existingUser) {
        finalUser = await db.user.update({
          where: { id: existingUser.id },
          data: {
            name: pending.name,
            passwordHash: pending.passwordHash,
            emailVerified: new Date(),
          },
        });
      } else {
        finalUser = await db.user.create({
          data: {
            name: pending.name,
            email: normalizedEmail,
            passwordHash: pending.passwordHash,
            emailVerified: new Date(),
            role: "customer",
            isAdmin: false,
          },
        });
      }

      // Delete pending registration
      await db.pendingRegistration.delete({
        where: { email: normalizedEmail },
      }).catch(() => null);

      // Reset limiter on success
      await otpVerifyLimiter.reset(`email:${normalizedEmail}`);

      // Run H2 bootstrap hook: check if verified email matches configured ADMIN_EMAILS
      await bootstrapAdminOnVerification(finalUser.id, normalizedEmail);
      // Link any prior guest records to the verified user account (Issue B5)
      await linkVerifiedUserRecords(finalUser.id, normalizedEmail);

      const isPartner = finalUser?.role === "solution_partner";
      return Response.json({
        success: true,
        isPartner,
        message: isPartner
          ? "Email verified successfully! Your Partner Application is now confirmed and under review."
          : "Email verified successfully! You can now sign in.",
      });
    }

    // ── Flow 2: Legacy VerificationToken Fallback ─────────────────────────────
    const tokenRecords = await db.verificationToken.findMany({
      where: { identifier: normalizedEmail },
    });

    const activeRecord = tokenRecords.find((rec) => new Date() <= rec.expires);
    if (!activeRecord) {
      return Response.json(
        { error: "Verification code has expired or was not found. Please request a new code." },
        { status: 400 }
      );
    }

    if (activeRecord.attempts >= 5) {
      await db.verificationToken.deleteMany({
        where: { identifier: normalizedEmail },
      }).catch(() => null);
      return Response.json(
        { error: "Too many failed attempts. Code has been invalidated. Please request a new code." },
        { status: 400 }
      );
    }

    const isValidRecord = verifySecretToken(otp, activeRecord.token);

    if (!isValidRecord) {
      await db.verificationToken.updateMany({
        where: { identifier: normalizedEmail },
        data: { attempts: { increment: 1 } },
      }).catch(() => null);

      const remaining = Math.max(0, 4 - activeRecord.attempts);
      return Response.json(
        {
          error: `Invalid verification code. ${remaining} attempt${
            remaining === 1 ? "" : "s"
          } remaining.`,
        },
        { status: 400 }
      );
    }

    const updatedUser = await db.user.update({
      where: { email: normalizedEmail },
      data: { emailVerified: new Date() },
    });

    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    }).catch(() => null);
    await otpVerifyLimiter.reset(`email:${normalizedEmail}`);

    // Run H2 bootstrap hook
    await bootstrapAdminOnVerification(updatedUser.id, normalizedEmail);
    // Link any prior guest records to the verified user account (Issue B5)
    await linkVerifiedUserRecords(updatedUser.id, normalizedEmail);

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
