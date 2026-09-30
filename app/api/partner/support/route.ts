// app/api/partner/support/route.ts
// Handles partner support tickets.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CreateTicketSchema } from "@/lib/validation/support.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner && !session.user.isAdmin) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && partner && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const tickets = await db.supportTicket.findMany({
      where: { requesterId: session.user.id },
      include: {
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ tickets });
  } catch (err) {
    console.error("Failed to list partner tickets:", err);
    return NextResponse.json({ error: "Failed to load tickets" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Request size limit: reject payloads > 128KB (Issue 46)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 131072) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner && !session.user.isAdmin) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && partner && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

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

    // Create ticket and initial message atomically
    const ticket = await db.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: {
          ticketNumber,
          requesterId: session.user.id,
          requesterRole: session.user.role || "solution_partner",
          subject: data.subject,
          category: data.category,
          priority: data.priority,
          description: data.description,
          status: "OPEN",
          messages: {
            create: {
              senderId: session.user.id,
              senderName: session.user.name || "Partner",
              senderRole: session.user.role || "solution_partner",
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
          },
        },
      }).catch(() => null);

      return created;
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create partner ticket:", err);
    return NextResponse.json({ error: "Failed to create support ticket" }, { status: 500 });
  }
}
