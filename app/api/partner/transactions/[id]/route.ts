// app/api/partner/transactions/[id]/route.ts
// Solution Partner transaction detail and delivery status updater.

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

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        partner: true,
        solution: true,
        customer: true,
        enquiry: true,
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
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.partnerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your transaction" }, { status: 403 });
    }

    const body = await req.json();
    const { deliveryStatus, paymentEvidenceUrl, paymentEvidenceNotes } = body;

    const updated = await db.transaction.update({
      where: { id },
      data: {
        ...(deliveryStatus ? { deliveryStatus } : {}),
        ...(paymentEvidenceUrl ? { paymentEvidenceUrl, paymentStatus: "EVIDENCE_SUBMITTED" } : {}),
        ...(paymentEvidenceNotes !== undefined ? { paymentEvidenceNotes } : {}),
      },
    });

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    console.error("Failed to update transaction:", err);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
