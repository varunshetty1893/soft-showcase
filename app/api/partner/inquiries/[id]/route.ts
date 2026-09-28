// app/api/partner/inquiries/[id]/route.ts
// Updates status and notes for a partner-assigned customer inquiry.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";

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
