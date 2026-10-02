// app/api/partner/profile/route.ts
// Updates partner studio profile settings.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { PartnerProfileUpdateSchema } from "@/lib/validation/partner.schema";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const partner = await resolvePartnerForUser(session.user);

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    return NextResponse.json({ partner });
  } catch (err) {
    console.error("Failed to get partner profile:", err);
    return NextResponse.json({ error: "Failed to load profile" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Request size limit: reject payloads > 256KB (Issue 46)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 262144) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const partner = await resolvePartnerForUser(session.user);

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const body = await req.json();
    const parsed = PartnerProfileUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      displayName,
      bio,
      whatsappNumber,
      avatarUrl,
      skills,
      technologies,
      experience,
      portfolioUrl,
      githubUrl,
      linkedinUrl,
      location,
      showEmail,
      showWhatsapp,
    } = parsed.data;

    const updated = await db.projectProvider.update({
      where: { id: partner.id },
      data: {
        ...(displayName ? { displayName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(skills !== undefined ? { skills } : {}),
        ...(technologies !== undefined ? { technologies } : {}),
        ...(experience !== undefined ? { experience } : {}),
        ...(portfolioUrl !== undefined ? { portfolioUrl } : {}),
        ...(githubUrl !== undefined ? { githubUrl } : {}),
        ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(showEmail !== undefined ? { showEmail } : {}),
        ...(showWhatsapp !== undefined ? { showWhatsapp } : {}),
      },
    });

    return NextResponse.json({ partner: updated });
  } catch (err) {
    console.error("Failed to update partner profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
