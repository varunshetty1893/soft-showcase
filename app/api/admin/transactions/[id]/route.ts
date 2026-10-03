// app/api/admin/transactions/[id]/route.ts
// Administrative verification and status management for partner transactions.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createAuditLogTx } from "@/lib/db/audit";
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
    const parsed = UpdateTransactionStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { paymentStatus, deliveryStatus, adminNotes } = parsed.data;

    const isVerifiedState = (status: string | null | undefined) =>
      status === "VERIFIED" || status === "COMPLETED";
    const willBeVerified = isVerifiedState(paymentStatus);

    const updated = await db.$transaction(async (tx) => {
      const current = await tx.transaction.findUnique({
        where: { id },
        select: { id: true, paymentStatus: true, verifiedAt: true, verifiedBy: true },
      });

      if (!current) return null;

      const wasVerified = isVerifiedState(current.paymentStatus);

      // Verification metadata must always agree with the payment status:
      //  - entering a verified state (from a non-verified one) stamps who/when
      //  - moving VERIFIED <-> COMPLETED keeps the original verifier/timestamp
      //  - leaving a verified state clears both, so audit data never contradicts itself
      let verificationData: { verifiedAt?: Date | null; verifiedBy?: string | null } = {};
      if (willBeVerified && !wasVerified) {
        verificationData = { verifiedAt: new Date(), verifiedBy: session.user.id };
      } else if (willBeVerified && wasVerified && !current.verifiedAt) {
        verificationData = { verifiedAt: new Date(), verifiedBy: session.user.id };
      } else if (!willBeVerified) {
        verificationData = { verifiedAt: null, verifiedBy: null };
      }

      const txUpdated = await tx.transaction.update({
        where: { id },
        data: {
          paymentStatus,
          ...(deliveryStatus ? { deliveryStatus } : {}),
          ...(adminNotes !== undefined ? { adminNotes } : {}),
          ...verificationData,
        },
      });

      // Not swallowed: a status change is never committed without its audit record.
      await createAuditLogTx(tx, {
        userId: session.user.id,
        action: `TRANSACTION_${paymentStatus}`,
        entityType: "Transaction",
        entityId: id,
        details: {
          transactionNumber: txUpdated.transactionNumber,
          previousPaymentStatus: current.paymentStatus,
          paymentStatus,
          verificationCleared: wasVerified && !willBeVerified,
          adminNotes: adminNotes ?? null,
        },
      });

      return txUpdated;
    });

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: updated });
  } catch (err: unknown) {
    console.error("Failed to update transaction status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
