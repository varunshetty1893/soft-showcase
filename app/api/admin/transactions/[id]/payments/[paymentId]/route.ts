// app/api/admin/transactions/[id]/payments/[paymentId]/route.ts
// Admin verifies or rejects a single installment payment.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { ReviewPaymentSchema } from "@/lib/validation/transaction.schema";
import { firstValidationMessage } from "@/lib/transactions/errors";
import { reviewPayment, PaymentRuleError } from "@/lib/db/queries/transaction-payments";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, paymentId } = await params;

  try {
    const body = await req.json().catch(() => null);
    const parsed = ReviewPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstValidationMessage(parsed.error), details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const transaction = await reviewPayment({
      transactionId: id,
      paymentId,
      action: parsed.data.action,
      reason: parsed.data.reason ?? null,
      adminId: session.user.id,
    });

    return NextResponse.json({ transaction });
  } catch (err: unknown) {
    if (err instanceof PaymentRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to review payment:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
