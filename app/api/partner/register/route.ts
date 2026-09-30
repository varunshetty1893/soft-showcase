// app/api/partner/register/route.ts
// Handles Solution Partner registration with email OTP verification.
// Sets applicationStatus = 'pending' and creates/updates User and ProjectProvider records.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db, memoryStore } from "@/lib/db/client";
import { PartnerRegisterSchema } from "@/lib/validation/partner.schema";
import { recordAuditLog } from "@/lib/db/audit";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";
import { generateSecureOtp, hashSecretToken } from "@/lib/utils/crypto";
import { partnerRegisterLimiter, getClientIp } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rateCheck = await partnerRegisterLimiter.check(ip);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429 }
      );
    }
    const body = await req.json();
    const parsed = PartnerRegisterSchema.safeParse(body);

    if (!parsed.success) {
      const errorMap: Record<string, string> = {};
      parsed.error.errors.forEach((e) => {
        const field = e.path[0]?.toString() || "form";
        errorMap[field] = e.message;
      });
      return NextResponse.json(
        { error: "Validation failed", details: errorMap },
        { status: 400 }
      );
    }

    const {
      name,
      email,
      password,
      whatsappNumber,
      displayName,
      bio,
      skills,
      technologies,
      experience,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      solutionsOffered,
      expertiseAreas,
      location,
    } = parsed.data;

    const normalizedEmail = email.trim().toLowerCase();

    // Check existing User
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check existing Provider
    const existingProvider = await db.projectProvider.findFirst({
      where: { email: normalizedEmail },
    });

    let userId: string;

    if (existingUser) {
      // If user exists and is already verified
      if (existingUser.emailVerified && existingUser.passwordHash) {
        const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
        if (!isPasswordValid) {
          return NextResponse.json(
            {
              error: "An account with this email already exists. Please enter your correct account password to link your partner application.",
            },
            { status: 400 }
          );
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const updatedUser = await db.user.update({
        where: { id: existingUser.id },
        data: {
          name,
          passwordHash,
          role: "solution_partner",
          // Require verification if not already verified
          emailVerified: existingUser.emailVerified || null,
        },
      });
      userId = updatedUser.id;
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      const newUser = await db.user.create({
        data: {
          name,
          email: normalizedEmail,
          passwordHash,
          emailVerified: null, // Email verification required!
          role: "solution_partner",
          isAdmin: false,
        },
      });
      userId = newUser.id;
    }

    // Create or update ProjectProvider
    let partnerRecord;
    const providerData = {
      userId,
      displayName: displayName.trim(),
      email: normalizedEmail,
      whatsappNumber: whatsappNumber || null,
      bio: bio.trim(),
      isActive: false, // inactive until administrative approval
      applicationStatus: "pending",
      verificationStatus: "not_required",
      skills,
      technologies,
      experience: experience || null,
      portfolioUrl: portfolioUrl || null,
      githubUrl: githubUrl || null,
      linkedinUrl: linkedinUrl || null,
      solutionsOffered: solutionsOffered || null,
      expertiseAreas: expertiseAreas || null,
      location: location || null,
      showEmail: false,
      showWhatsapp: true,
      providerConsentConfirmed: true,
      providerConsentConfirmedAt: new Date(),
    };

    if (existingProvider) {
      partnerRecord = await db.projectProvider.update({
        where: { id: existingProvider.id },
        data: providerData,
      });
    } else {
      partnerRecord = await db.projectProvider.create({
        data: providerData,
      });
    }

    // Generate cryptographically secure 6-digit numeric OTP for verification (Issue 16)
    const otp = generateSecureOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete previous verification tokens for this email
    await db.verificationToken.deleteMany({
      where: { identifier: normalizedEmail },
    });

    // Create new verification token with SHA-256 hash (Issue 19)
    await db.verificationToken.create({
      data: {
        identifier: normalizedEmail,
        token: hashSecretToken(otp),
        expires,
      },
    });

    // Direct 1-click verification link
    const verifyUrl = `${APP_URL}/verify-email?email=${encodeURIComponent(
      normalizedEmail
    )}&token=${otp}&role=partner`;

    // Send verification email asynchronously without blocking (Issue 24)
    sendVerificationEmail(normalizedEmail, {
      userName: name,
      otp,
      verifyUrl,
      expiresInMinutes: 15,
    }).catch((err) => {
      console.error("[PartnerRegister] Background email delivery error:", err);
    });

    // Persist memory store to disk
    if (typeof (memoryStore as any)?.saveToDisk === "function") {
      (memoryStore as any).saveToDisk();
    }

    // Record audit log
    await recordAuditLog({
      action: "PARTNER_REGISTRATION_SUBMITTED",
      entityType: "ProjectProvider",
      entityId: partnerRecord.id,
      userId,
      details: {
        partnerId: partnerRecord.id,
        displayName: partnerRecord.displayName,
        email: normalizedEmail,
      },
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        message:
          "Your Solution Partner application has been received. Please verify your email using the 6-digit code or link sent to your inbox.",
        email: normalizedEmail,
        partnerId: partnerRecord.id,
        requiresVerification: true,
        status: "pending",
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    console.error("Partner registration error:", err);
    return NextResponse.json(
      { error: "Failed to process partner registration. Please try again." },
      { status: 500 }
    );
  }
}
