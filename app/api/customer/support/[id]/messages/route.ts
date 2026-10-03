// app/api/customer/support/[id]/messages/route.ts
// Adds message reply to a customer support ticket thread.

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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ messages: ticket.messages, ticket });
  } catch (err) {
    console.error("[CustomerSupport] Failed to load ticket messages:", err);
    return NextResponse.json({ error: "Failed to load messages" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 131072) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const { id } = await params;

  try {
    const ticket = await db.supportTicket.findUnique({ where: { id } });

    if (!ticket) {
      return NextResponse.json({ error: "Support ticket not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && ticket.requesterId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (ticket.status === "CLOSED" || ticket.status === "RESOLVED") {
      return NextResponse.json(
        { error: "Cannot reply to a closed or resolved ticket. Please open a new ticket." },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = CreateMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const senderName = session.user.name || (session.user.isAdmin ? "Support Team" : "Customer");
    const senderRole = session.user.isAdmin ? "admin" : (session.user.role || "customer");

    const message = await db.supportMessage.create({
      data: {
        ticketId: id,
        senderId: session.user.id,
        senderName,
        senderRole,
        message: parsed.data.message,
      },
    });

    // Update ticket updatedAt
    await db.supportTicket.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err: unknown) {
    console.error("[CustomerSupport] Failed to post reply:", err);
    return NextResponse.json({ error: "Failed to send reply" }, { status: 500 });
  }
}
