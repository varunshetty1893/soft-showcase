// app/api/partner/transactions/[id]/payments/route.ts
// Partner adds further installment payments (max 3 per transaction in total).

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";
import { transactionCreateLimiter } from "@/lib/utils/rate-limit";
import { AddPaymentsSchema } from "@/lib/validation/transaction.schema";
import { isValidEvidenceUrl } from "@/lib/transactions/evidence";
import { firstValidationMessage } from "@/lib/transactions/errors";
import { addPaymentsToTransaction, PaymentRuleError } from "@/lib/db/queries/transaction-payments";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 262144) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const rate = await transactionCreateLimiter.check(session.user.id);
  if (!rate.success) {
    return NextResponse.json(
      { error: "Too many payment submissions. Please wait a few moments." },
      { status: 429 }
    );
  }

  const { id } = await params;

  try {
    const partner = await resolvePartnerForUser(session.user);
    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }
    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json({ error: "Partner account is not active or approved" }, { status: 403 });
    }

    const existing = await db.transaction.findUnique({ where: { id }, select: { id: true, partnerId: true } });
    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }
    if (existing.partnerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your transaction" }, { status: 403 });
    }

    const body = await req.json().catch(() => null);
    const parsed = AddPaymentsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstValidationMessage(parsed.error), details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    for (const payment of parsed.data.payments) {
      if (payment.evidenceUrl && !isValidEvidenceUrl(payment.evidenceUrl)) {
        return NextResponse.json(
          { error: "Payment screenshots must be uploaded through the platform storage." },
          { status: 400 }
        );
      }
    }

    const transaction = await addPaymentsToTransaction({
      transactionId: id,
      userId: session.user.id,
      isAdmin: Boolean(session.user.isAdmin),
      partnerId: partner.id,
      payments: parsed.data.payments,
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof PaymentRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to add payments:", err);
    return NextResponse.json({ error: "Failed to add payments" }, { status: 500 });
  }
}
