// app/api/admin/transactions/[id]/route.ts
// Administrative verification and status management for partner transactions.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import {
  updateTransactionStatusWithPayments,
  PaymentRuleError,
} from "@/lib/db/queries/transaction-payments";
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
        payments: { orderBy: { sequence: "asc" } },
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

    // Totals, verification stamps, delivery gating (balance must be 0) and the audit record are
    // all handled inside one locked database transaction.
    const updated = await updateTransactionStatusWithPayments({
      transactionId: id,
      adminId: session.user.id,
      paymentStatus,
      deliveryStatus,
      adminNotes,
    });

    if (!updated) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    return NextResponse.json({ transaction: updated });
  } catch (err: unknown) {
    if (err instanceof PaymentRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to update transaction status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
