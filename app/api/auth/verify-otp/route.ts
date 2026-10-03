// app/api/auth/verify-otp/route.ts
// Verifies OTP codes from PendingRegistration staging or legacy verification tokens.
// Implements atomic attempt claiming (N6), verified-user password protection (N5),
// two-key shared-IP rate limiting (N9), and email-only limiter reset (N7).

import { db } from "@/lib/db/client";
import { VerifyOtpSchema } from "@/lib/validation/auth.schema";
import { verifySecretToken } from "@/lib/utils/crypto";
import { otpVerifyLimiter, getRequestIp } from "@/lib/utils/rate-limit";
import { bootstrapAdminOnVerification } from "@/lib/auth/admin-bootstrap";
import { linkVerifiedUserRecords } from "@/lib/db/queries/customer";

interface MaterializeResult {
  alreadyVerified: boolean;
  user: {
    id: string;
    role?: string | null;
  };
}

type PartnerApplication = {
  displayName: string;
  whatsappNumber: string | null;
  bio: string;
  skills: string[];
  technologies: string[];
  experience: string | null;
  portfolioUrl: string | null;
  githubUrl: string | null;
  linkedinUrl: string | null;
  solutionsOffered: string | null;
  expertiseAreas: string | null;
  location: string | null;
};

async function materializePendingUserAtomically(
  normalizedEmail: string,
  pending: { name: string; passwordHash: string; partnerApplication?: unknown | null }
): Promise<MaterializeResult> {
  const runTransaction = async (): Promise<MaterializeResult> => {
    return db.$transaction(async (tx) => {
      const existingUser = await tx.user.findUnique({
        where: { email: normalizedEmail },
      });

      const partnerApplication = pending.partnerApplication as PartnerApplication | null;

      async function createPartnerProfile(userId: string) {
        if (!partnerApplication) return;

        const existingProvider = await tx.projectProvider.findUnique({
          where: { email: normalizedEmail },
        });
        if (existingProvider) {
          throw new Error("A partner application already exists for this email address.");
        }

        await tx.projectProvider.create({
          data: {
            userId,
            email: normalizedEmail,
            displayName: partnerApplication.displayName,
            whatsappNumber: partnerApplication.whatsappNumber,
            bio: partnerApplication.bio,
            isActive: false,
            applicationStatus: "pending",
            verificationStatus: "not_required",
            skills: partnerApplication.skills,
            technologies: partnerApplication.technologies,
            experience: partnerApplication.experience,
            portfolioUrl: partnerApplication.portfolioUrl,
            githubUrl: partnerApplication.githubUrl,
            linkedinUrl: partnerApplication.linkedinUrl,
            solutionsOffered: partnerApplication.solutionsOffered,
            expertiseAreas: partnerApplication.expertiseAreas,
            location: partnerApplication.location,
            showEmail: false,
            showWhatsapp: true,
            providerConsentConfirmed: true,
            providerConsentConfirmedAt: new Date(),
          },
        });
      }

      // N5: If user already has emailVerified set, NEVER overwrite their password or name!
      if (existingUser && existingUser.emailVerified !== null) {
        if (partnerApplication) {
          const updateData: Record<string, any> = {
            role: existingUser.isAdmin ? existingUser.role : "solution_partner",
          };
          if (!existingUser.passwordHash && pending.passwordHash) {
            updateData.passwordHash = pending.passwordHash;
          }
          const upgradedUser = await tx.user.update({
            where: { id: existingUser.id },
            data: updateData,
          });
          await createPartnerProfile(upgradedUser.id);
          await tx.pendingRegistration.delete({ where: { email: normalizedEmail } });
          return { alreadyVerified: false, user: upgradedUser };
        }
        await tx.pendingRegistration
          .delete({ where: { email: normalizedEmail } })
          .catch(() => null);
        return {
          alreadyVerified: true,
          user: existingUser,
        };
      }

      let finalUser;
      if (existingUser) {
        // Only an existing user with emailVerified === null may receive the pending password
        finalUser = await tx.user.update({
          where: { id: existingUser.id },
          data: {
            name: pending.name,
            passwordHash: pending.passwordHash,
            emailVerified: new Date(),
            role: partnerApplication ? "solution_partner" : existingUser.role,
          },
        });
      } else {
        finalUser = await tx.user.create({
          data: {
            name: pending.name,
            email: normalizedEmail,
            passwordHash: pending.passwordHash,
            emailVerified: new Date(),
            role: "customer",
            ...(partnerApplication ? { role: "solution_partner" } : {}),
            isAdmin: false,
          },
        });
      }

      await tx.pendingRegistration
        .delete({ where: { email: normalizedEmail } })
        .catch(() => null);

      await createPartnerProfile(finalUser.id);

      return {
        alreadyVerified: false,
        user: finalUser,
      };
    });
  };

  try {
    return await runTransaction();
  } catch (err: unknown) {
    // Handle unique-violation race (P2002) by retrying as an update with the same N5 rules
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      return await runTransaction();
    }
    throw err;
  }
}

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

    // Two-key rate limiting (N9): email (5/15m) + IP ceiling (40/15m)
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

    const now = new Date();

    // ── Flow 1: Atomic Claim on PendingRegistration Staging (N6) ─────────────
    const claimedPending = await db.pendingRegistration.updateMany({
      where: {
        email: normalizedEmail,
        expiresAt: { gt: now },
        attempts: { lt: 5 },
      },
      data: {
        attempts: { increment: 1 },
      },
    });

    if (claimedPending.count > 0) {
      const pending = await db.pendingRegistration.findUnique({
        where: { email: normalizedEmail },
      });

      if (!pending) {
        return Response.json(
          { error: "Verification code has expired or was not found. Please request a new code." },
          { status: 400 }
        );
      }

      const isValid = verifySecretToken(otp, pending.codeHash);
      if (!isValid) {
        const remaining = Math.max(0, 5 - pending.attempts);
        return Response.json(
          {
            error: `Invalid verification code. ${remaining} attempt${
              remaining === 1 ? "" : "s"
            } remaining.`,
          },
          { status: 400 }
        );
      }

      // Valid OTP: Atomically materialize or preserve User and delete pending row (N5)
      const materialized = await materializePendingUserAtomically(normalizedEmail, pending);

      // N7: Reset ONLY the email-scoped key on success, never the IP key
      await otpVerifyLimiter.reset(`email:${normalizedEmail}`);

      if (materialized.alreadyVerified) {
        return Response.json({
          success: true,
          accountAlreadyExists: true,
          message:
            "An account with this email already exists. Please sign in with your existing password or reset your password if needed.",
        });
      }

      // Run H2 bootstrap hook & B5 guest record linking
      await bootstrapAdminOnVerification(materialized.user.id, normalizedEmail);
      await linkVerifiedUserRecords(materialized.user.id, normalizedEmail);

      const isPartner = materialized.user.role === "solution_partner";
      return Response.json({
        success: true,
        isPartner,
        message: isPartner
          ? "Email verified successfully! Your Partner Application is now confirmed and under review."
          : "Email verified successfully! You can now sign in.",
      });
    }

    // If atomic claim returned 0, check if a pending registration row exists that is locked or expired
    const existingPending = await db.pendingRegistration.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingPending) {
      if (existingPending.attempts >= 5) {
        await db.pendingRegistration
          .delete({ where: { email: normalizedEmail } })
          .catch(() => null);
        return Response.json(
          { error: "Too many failed attempts. Code has been invalidated. Please register again." },
          { status: 400 }
        );
      }

      await db.pendingRegistration
        .delete({ where: { email: normalizedEmail } })
        .catch(() => null);
      return Response.json(
        { error: "Verification code has expired. Please request a new code." },
        { status: 400 }
      );
    }

    // ── Flow 2: Legacy VerificationToken Fallback with Atomic Claim (N6) ─────
    const claimedLegacy = await db.verificationToken.updateMany({
      where: {
        identifier: normalizedEmail,
        expires: { gt: now },
        attempts: { lt: 5 },
      },
      data: {
        attempts: { increment: 1 },
      },
    });

    if (claimedLegacy.count === 0) {
      const legacyRecords = await db.verificationToken.findMany({
        where: { identifier: normalizedEmail },
      });

      if (legacyRecords.some((rec) => rec.attempts >= 5)) {
        await db.verificationToken
          .deleteMany({ where: { identifier: normalizedEmail } })
          .catch(() => null);
        return Response.json(
          { error: "Too many failed attempts. Code has been invalidated. Please request a new code." },
          { status: 400 }
        );
      }

      return Response.json(
        { error: "Verification code has expired or was not found. Please request a new code." },
        { status: 400 }
      );
    }

    const tokenRecords = await db.verificationToken.findMany({
      where: { identifier: normalizedEmail },
    });
    const activeRecord = tokenRecords.find((rec) => now <= rec.expires);

    if (!activeRecord) {
      return Response.json(
        { error: "Verification code has expired or was not found. Please request a new code." },
        { status: 400 }
      );
    }

    const isValidRecord = verifySecretToken(otp, activeRecord.token);

    if (!isValidRecord) {
      const remaining = Math.max(0, 5 - activeRecord.attempts);
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

    await db.verificationToken
      .deleteMany({
        where: { identifier: normalizedEmail },
      })
      .catch(() => null);

    // N7: Reset ONLY email-scoped key
    await otpVerifyLimiter.reset(`email:${normalizedEmail}`);

    // Run H2 bootstrap hook & B5 guest record linking
    await bootstrapAdminOnVerification(updatedUser.id, normalizedEmail);
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
