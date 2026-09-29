// app/api/partner/inquiries/[id]/route.ts
// Updates status and notes for a partner-assigned customer inquiry.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (inquiry.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your inquiry" }, { status: 403 });
    }

    return NextResponse.json({ inquiry });
  } catch (err) {
    console.error("Failed to get inquiry:", err);
    return NextResponse.json({ error: "Failed to get inquiry" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const existing = await db.inquiry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (existing.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your inquiry" }, { status: 403 });
    }

    const body = await req.json();
    const { status, partnerNotes } = body;

    const updated = await db.inquiry.update({
      where: { id },
      data: {
        ...(status ? { status } : {}),
        ...(partnerNotes !== undefined ? { adminNotes: partnerNotes } : {}),
      },
    });

    return NextResponse.json({ inquiry: updated });
  } catch (err) {
    console.error("Failed to update inquiry:", err);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
