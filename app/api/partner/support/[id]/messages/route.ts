// app/api/partner/support/[id]/messages/route.ts
// Adds message reply to a support ticket.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CreateMessageSchema } from "@/lib/validation/support.schema";

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
    const ticket = await db.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && ticket.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not your support ticket" }, { status: 403 });
    }

    return NextResponse.json({ messages: ticket.messages, ticket });
  } catch (err: unknown) {
    console.error("Failed to load ticket messages:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const ticket = await db.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && ticket.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden: Not your support ticket" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = CreateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const message = await db.supportMessage.create({
      data: {
        ticketId: id,
        senderId: session.user.id,
        senderName: session.user.name || "User",
        senderRole: session.user.role || (session.user.isAdmin ? "admin" : "solution_partner"),
        message: data.message,
        attachmentUrl: data.attachmentUrl || null,
        attachmentName: data.attachmentName || null,
      },
    });

    // Update ticket status to WAITING_ADMIN if sent by partner/customer, or WAITING_CUSTOMER if sent by admin
    const newStatus = session.user.isAdmin ? "WAITING_CUSTOMER" : "WAITING_ADMIN";
    await db.supportTicket.update({
      where: { id },
      data: {
        status: newStatus as any,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to post message:", err);
    return NextResponse.json({ error: "Failed to post message" }, { status: 500 });
  }
}
