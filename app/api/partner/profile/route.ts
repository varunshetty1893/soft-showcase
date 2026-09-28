// app/api/partner/profile/route.ts
// Updates partner studio profile settings.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const body = await req.json();
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
    } = body;

    const updated = await db.projectProvider.update({
      where: { id: partner.id },
      data: {
        ...(displayName ? { displayName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(skills !== undefined ? { skills: Array.isArray(skills) ? skills : skills.split(",").map((s: string) => s.trim()).filter(Boolean) } : {}),
        ...(technologies !== undefined ? { technologies: Array.isArray(technologies) ? technologies : technologies.split(",").map((s: string) => s.trim()).filter(Boolean) } : {}),
        ...(experience !== undefined ? { experience } : {}),
        ...(portfolioUrl !== undefined ? { portfolioUrl } : {}),
        ...(githubUrl !== undefined ? { githubUrl } : {}),
        ...(linkedinUrl !== undefined ? { linkedinUrl } : {}),
        ...(location !== undefined ? { location } : {}),
        ...(showEmail !== undefined ? { showEmail: Boolean(showEmail) } : {}),
        ...(showWhatsapp !== undefined ? { showWhatsapp: Boolean(showWhatsapp) } : {}),
      },
    });

    return NextResponse.json({ partner: updated });
  } catch (err) {
    console.error("Failed to update partner profile:", err);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
