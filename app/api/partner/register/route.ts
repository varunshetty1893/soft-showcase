// app/api/partner/register/route.ts
// Handles Solution Partner registration.
// Sets applicationStatus = 'pending' and creates both User and ProjectProvider records.

import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db/client";
import { PartnerRegisterSchema } from "@/lib/validation/partner.schema";
import { recordAuditLog } from "@/lib/db/audit";

export async function POST(req: NextRequest) {
  try {
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

    if (existingUser) {
      return NextResponse.json(
        {
          error: "An account with this email address already exists. Please sign in or use a different email.",
        },
        { status: 409 }
      );
    }

    // Check existing Provider
    const existingProvider = await db.projectProvider.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingProvider) {
      return NextResponse.json(
        {
          error: "A Solution Partner profile with this email address already exists.",
        },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with solution_partner role
    const newUser = await db.user.create({
      data: {
        name,
        email: normalizedEmail,
        passwordHash,
        emailVerified: new Date(),
        role: "solution_partner",
        isAdmin: false,
      },
    });

    // Create ProjectProvider with pending status
    const newPartner = await db.projectProvider.create({
      data: {
        userId: newUser.id,
        displayName: displayName.trim(),
        email: normalizedEmail,
        whatsappNumber: whatsappNumber || null,
        bio: bio.trim(),
        isActive: false, // inactive until approved
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
      },
    });

    // Audit log
    await recordAuditLog({
      action: "PARTNER_REGISTRATION_SUBMITTED",
      entityType: "ProjectProvider",
      entityId: newPartner.id,
      userId: newUser.id,
      details: {
        partnerId: newPartner.id,
        displayName: newPartner.displayName,
        email: normalizedEmail,
      },
    }).catch(() => null);

    return NextResponse.json(
      {
        success: true,
        message:
          "Your Solution Partner application has been submitted and is currently under review.",
        partnerId: newPartner.id,
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
