// app/api/admin/transactions/[id]/route.ts
// Administrative verification and status management for partner transactions.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { UpdateTransactionStatusSchema } from "@/lib/validation/transaction.schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
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

    return NextResponse.json({ transaction });
  } catch (err) {
    console.error("Failed to load transaction:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const parsed = UpdateTransactionStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { paymentStatus, deliveryStatus, adminNotes } = parsed.data;

    const isVerified = paymentStatus === "VERIFIED" || paymentStatus === "COMPLETED";

    const updated = await db.transaction.update({
      where: { id },
      data: {
        paymentStatus,
        ...(deliveryStatus ? { deliveryStatus } : {}),
        ...(adminNotes !== undefined ? { adminNotes } : {}),
        ...(isVerified
          ? { verifiedAt: new Date(), verifiedBy: session.user.id }
          : {}),
      },
    });

    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: `TRANSACTION_${paymentStatus}`,
        entityType: "Transaction",
        entityId: id,
        details: {
          transactionNumber: updated.transactionNumber,
          paymentStatus,
          adminNotes,
        },
      },
    }).catch(() => null);

    return NextResponse.json({ transaction: updated });
  } catch (err: unknown) {
    console.error("Failed to update transaction status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
