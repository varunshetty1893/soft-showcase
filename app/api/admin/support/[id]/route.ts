// app/api/admin/support/[id]/route.ts
// Admin ticket status management and resolution.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { Prisma } from "@prisma/client";
import { createAuditLogTx } from "@/lib/db/audit";
import { UpdateTicketStatusSchema } from "@/lib/validation/support.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const parsed = UpdateTicketStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { status, adminNotes, assignedAdminId } = parsed.data;

    // Verify ticket exists before any further work.
    const existing = await db.supportTicket.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        adminNotes: true,
        assignedAdminId: true,
        resolvedAt: true,
        subject: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    // If a new assignee is supplied, it must be an existing admin user.
    if (assignedAdminId != null && assignedAdminId !== "") {
      const assignee = await db.user.findUnique({
        where: { id: assignedAdminId },
        select: { id: true, isAdmin: true },
      });
      if (!assignee || !assignee.isAdmin) {
        return NextResponse.json(
          { error: "assignedAdminId must refer to an existing administrator." },
          { status: 422 }
        );
      }
    }

    const isResolved = status === "RESOLVED" || status === "CLOSED";
    const wasResolved =
      existing.status === "RESOLVED" || existing.status === "CLOSED";

    // Determine how resolvedAt should change:
    //  - Entering RESOLVED/CLOSED from an open state → stamp now
    //  - Staying within RESOLVED/CLOSED → keep original timestamp
    //  - Leaving RESOLVED/CLOSED (re-open) → clear the timestamp
    let resolvedAtUpdate: { resolvedAt: Date | null } | Record<string, never> = {};
    if (isResolved && !wasResolved) {
      resolvedAtUpdate = { resolvedAt: new Date() };
    } else if (!isResolved && wasResolved) {
      resolvedAtUpdate = { resolvedAt: null };
    }

    // Execute update + audit atomically: no audit row → no change.
    const updated = await db.$transaction(async (tx: Prisma.TransactionClient) => {
      const ticket = await tx.supportTicket.update({
        where: { id },
        data: {
          status,
          ...(adminNotes !== undefined ? { adminNotes } : {}),
          // null explicitly clears the assignment; undefined leaves it untouched.
          ...(assignedAdminId !== undefined ? { assignedAdminId: assignedAdminId || null } : {}),
          ...resolvedAtUpdate,
        },
      });

      await createAuditLogTx(tx, {
        userId: session.user.id,
        action: "SUPPORT_TICKET_UPDATED",
        entityType: "SupportTicket",
        entityId: id,
        details: {
          subject: existing.subject,
          previousStatus: existing.status,
          newStatus: status,
          resolvedAtCleared: !isResolved && wasResolved,
          resolvedAtSet: isResolved && !wasResolved,
          adminNotesChanged: adminNotes !== undefined && adminNotes !== existing.adminNotes,
          assignedAdminIdChanged:
            assignedAdminId !== undefined &&
            (assignedAdminId || null) !== existing.assignedAdminId,
          newAssignedAdminId: assignedAdminId ?? null,
        },
      });

      return ticket;
    });

    return NextResponse.json({ ticket: updated });
  } catch (err) {
    console.error("Failed to update support ticket:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
