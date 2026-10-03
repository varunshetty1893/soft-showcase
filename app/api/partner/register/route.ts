// app/api/partner/register/route.ts
// Handles Solution Partner registration with email OTP verification.
// Sensitive account and provider changes are staged until the applicant proves email ownership.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { PartnerRegisterSchema } from "@/lib/validation/partner.schema";
import { recordAuditLog } from "@/lib/db/audit";
import { sendVerificationEmail } from "@/lib/email/email-service";
import { APP_URL } from "@/config/constants";
import { generateSecureOtp, hashSecretToken } from "@/lib/utils/crypto";
import { partnerRegisterLimiter, getRequestIp } from "@/lib/utils/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const ip = await getRequestIp(req);
    const rateCheck = await partnerRegisterLimiter.check(`ip:${ip}`);
    if (!rateCheck.success) {
      if (rateCheck.error) {
        return NextResponse.json(
          { error: "Registration service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      const retryAfter = Math.max(1, Math.ceil((rateCheck.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
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

    const emailRateCheck = await partnerRegisterLimiter.check(`email:${normalizedEmail}`);
    if (!emailRateCheck.success) {
      if (emailRateCheck.error) {
        return NextResponse.json(
          { error: "Registration service temporarily unavailable. Please try again later." },
          { status: 503 }
        );
      }
      const retryAfter = Math.max(1, Math.ceil((emailRateCheck.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many registration attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Check existing User
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Check existing Provider
    const existingProvider = await db.projectProvider.findUnique({
      where: { email: normalizedEmail },
    });

    // Never overwrite an account or provider profile from an unauthenticated form.
    if (existingProvider) {
      return NextResponse.json(
        { error: "A partner application already exists for this email. Please sign in or contact support." },
        { status: 409 }
      );
    }

    if (existingUser?.emailVerified) {
      if (!existingUser.passwordHash) {
        return NextResponse.json(
          { error: "This email is linked to an existing sign-in method. Sign in first, then contact support to apply as a partner." },
          { status: 409 }
        );
      }

      const isPasswordValid = await bcrypt.compare(password, existingUser.passwordHash);
      if (!isPasswordValid) {
        return NextResponse.json(
          { error: "The supplied account credentials could not be verified." },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const partnerApplication = {
      displayName: displayName.trim(),
      whatsappNumber: whatsappNumber || null,
      bio: bio.trim(),
      skills,
      technologies,
      experience: experience || null,
      portfolioUrl: portfolioUrl || null,
      githubUrl: githubUrl || null,
      linkedinUrl: linkedinUrl || null,
      solutionsOffered: solutionsOffered || null,
      expertiseAreas: expertiseAreas || null,
      location: location || null,
    };

    // Stage the complete application. The User and ProjectProvider records are only
    // created or changed after the valid OTP proves control of this email address.
    const otp = generateSecureOtp();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.pendingRegistration.upsert({
      where: { email: normalizedEmail },
      update: {
        name,
        passwordHash,
        codeHash: hashSecretToken(otp),
        attempts: 0,
        expiresAt: expires,
        partnerApplication,
      },
      create: {
        email: normalizedEmail,
        name,
        passwordHash,
        codeHash: hashSecretToken(otp),
        attempts: 0,
        expiresAt: expires,
        partnerApplication,
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

    // Record audit log
    await recordAuditLog({
      action: "PARTNER_REGISTRATION_SUBMITTED",
      entityType: "PartnerApplication",
      entityId: normalizedEmail,
      details: {
        displayName: partnerApplication.displayName,
        email: normalizedEmail,
      },
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        message:
          "Your Solution Partner application has been received. Please verify your email using the 6-digit code or link sent to your inbox.",
        email: normalizedEmail,
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
