// app/api/customer/support/route.ts
// Customer-facing support ticket API: list own tickets and open new ones.
// Customers can open tickets about orders, custom build queries, billing, and technical issues.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CreateTicketSchema } from "@/lib/validation/support.schema";

// GET /api/customer/support  — list all tickets belonging to the current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const tickets = await db.supportTicket.findMany({
      where: { requesterId: session.user.id },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("[CustomerSupport] Failed to list support tickets:", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

// POST /api/customer/support  — open a new support ticket
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Reject payloads > 128 KB
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 131072) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    const body = await req.json();
    const parsed = CreateTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const ticketNumber = `TCK-${Date.now().toString().slice(-6)}`;
    const requesterRole = session.user.role || "customer";
    const senderName = session.user.name || "Customer";

    const ticket = await db.$transaction(async (tx: any) => {
      const created = await tx.supportTicket.create({
        data: {
          ticketNumber,
          requesterId: session.user.id,
          requesterRole,
          subject: data.subject,
          category: data.category,
          priority: data.priority,
          description: data.description,
          status: "OPEN",
          messages: {
            create: {
              senderId: session.user.id,
              senderName,
              senderRole: requesterRole,
              message: data.description,
            },
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "SUPPORT_TICKET_CREATED",
          entityType: "SupportTicket",
          entityId: created.id,
          details: {
            ticketNumber,
            subject: data.subject,
            category: data.category,
            requesterRole,
          },
        },
      }).catch(() => null);

      return created;
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: unknown) {
    console.error("[CustomerSupport] Failed to create ticket:", err);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
