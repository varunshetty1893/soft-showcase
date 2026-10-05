// app/api/partner/transactions/[id]/route.ts
// Solution Partner transaction detail and delivery status updater.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { canMarkDelivered } from "@/lib/transactions/payments";

// Valid delivery status progression
const VALID_DELIVERY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PENDING", "IN_PROGRESS"],
  IN_PROGRESS: ["IN_PROGRESS", "DELIVERED"],
  DELIVERED: ["DELIVERED", "COMPLETED"],
  COMPLETED: ["COMPLETED"],
};

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

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        partner: true,
        solution: true,
        customer: true,
        enquiry: true,
        payments: { orderBy: { sequence: "asc" } },
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.partnerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your transaction" }, { status: 403 });
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    console.error("Failed to get transaction:", err);
    return NextResponse.json({ error: "Failed to get transaction" }, { status: 500 });
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

    const existing = await db.transaction.findUnique({
      where: { id },
      include: { payments: { orderBy: { sequence: "asc" } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.partnerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your transaction" }, { status: 403 });
    }

    const body = await req.json();
    const { deliveryStatus, paymentEvidenceNotes } = body;

    // Payment screenshots / UTRs are added as individual payments through
    // POST /api/partner/transactions/[id]/payments (max 3 per transaction).
    if (body.paymentEvidenceUrl) {
      return NextResponse.json(
        { error: "Add payment screenshots through the Add Payment form on the transaction page." },
        { status: 400 }
      );
    }

    // Validate delivery status transitions (Issue 26)
    if (deliveryStatus && deliveryStatus !== existing.deliveryStatus) {
      const allowedNextStates = VALID_DELIVERY_TRANSITIONS[existing.deliveryStatus] || [];
      if (!allowedNextStates.includes(deliveryStatus) && !session.user.isAdmin) {
        return NextResponse.json(
          {
            error: `Invalid delivery status transition from ${existing.deliveryStatus} to ${deliveryStatus}. Expected progression: PENDING -> IN_PROGRESS -> DELIVERED -> COMPLETED.`,
          },
          { status: 400 }
        );
      }

      // Delivered / Completed only once the full agreed amount is paid and verified (balance 0)
      if (
        (deliveryStatus === "DELIVERED" || deliveryStatus === "COMPLETED") &&
        !canMarkDelivered(existing.payments, existing.agreedAmount ?? existing.amount)
      ) {
        return NextResponse.json(
          {
            error:
              "Cannot mark delivery as Delivered/Completed until the full amount is paid and verified (balance must be zero).",
          },
          { status: 400 }
        );
      }

      // Cannot advance to DELIVERED or COMPLETED if payment was rejected or refunded
      if (
        (deliveryStatus === "DELIVERED" || deliveryStatus === "COMPLETED") &&
        (existing.paymentStatus === "REJECTED" || existing.paymentStatus === "REFUNDED")
      ) {
        return NextResponse.json(
          {
            error: `Cannot mark delivery as ${deliveryStatus} while payment status is ${existing.paymentStatus}.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        ...(deliveryStatus ? { deliveryStatus } : {}),
        ...(paymentEvidenceNotes !== undefined ? { paymentEvidenceNotes } : {}),
      },
    });

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    console.error("Failed to update transaction:", err);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
