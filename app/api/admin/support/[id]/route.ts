// app/api/admin/support/[id]/route.ts
// Admin ticket status management and resolution.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { UpdateTicketStatusSchema } from "@/lib/validation/support.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = UpdateTicketStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, adminNotes, assignedAdminId } = parsed.data;

    const isResolved = status === "RESOLVED" || status === "CLOSED";

    const updated = await db.supportTicket.update({
      where: { id },
      data: {
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(assignedAdminId !== undefined ? { assignedAdminId } : {}),
        ...(isResolved ? { resolvedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ ticket: updated });
  } catch (err) {
    console.error("Failed to update support ticket:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
