// lib/db/queries/transaction-payments.ts
// Server-side write path for installment payments.
//
// Every mutation runs inside ONE database transaction that first takes a row lock on the
// parent transaction (SELECT ... FOR UPDATE). That serialises concurrent requests, so two
// payments submitted at the same moment can never push the total past the agreed amount or
// past the 3-payment limit. UTR uniqueness is guarded by a per-UTR advisory lock.
//
// The browser is never trusted for totals, balance, status or receipt state: everything is
// recomputed here from the payment rows.

import { db } from "@/lib/db/client";
import { createAuditLogTx } from "@/lib/db/audit";
import { sumMoney, toCents, fromCents } from "@/lib/utils/money";
import {
  STICKY_PAYMENT_STATUSES,
  checkCanAddPayments,
  computeTotals,
  derivePaymentStatus,
  canMarkDelivered,
  normalizeUtr,
} from "@/lib/transactions/payments";
import type { PaymentInput } from "@/lib/validation/transaction.schema";

const TX_OPTIONS = { maxWait: 10_000, timeout: 20_000 } as const;

export class PaymentRuleError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = "PaymentRuleError";
    this.status = status;
  }
}

type Tx = any;

async function lockTransactionRow(tx: Tx, transactionId: string) {
  await tx.$queryRaw`SELECT "id" FROM "transactions" WHERE "id" = ${transactionId} FOR UPDATE`;
}

async function assertUtrsAreUnique(tx: Tx, utrs: string[], ignorePaymentId?: string) {
  const unique = new Set<string>();
  for (const utr of utrs) {
    if (unique.has(utr)) {
      throw new PaymentRuleError(`UTR ${utr} is entered more than once in this submission`, 409);
    }
    unique.add(utr);
  }
  for (const utr of utrs) {
    // Serialise concurrent submissions of the same UTR
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${"utr:" + utr}))`;
    const clash = await tx.transactionPayment.findFirst({
      where: {
        utrNumber: { equals: utr, mode: "insensitive" },
        status: { not: "REJECTED" },
        ...(ignorePaymentId ? { id: { not: ignorePaymentId } } : {}),
      },
      select: { id: true },
    });
    if (clash) {
      throw new PaymentRuleError(
        `UTR ${utr} has already been used on another payment. Duplicate UTRs are not allowed.`,
        409
      );
    }
  }
}

function mirrorArrays(payments: Array<{ status: string; utrNumber: string | null; evidenceUrl: string | null }>) {
  const active = payments.filter((p) => p.status !== "REJECTED");
  return {
    utrNumbers: active.map((p) => p.utrNumber).filter((u): u is string => Boolean(u)),
    paymentEvidenceUrls: active.map((p) => p.evidenceUrl).filter((u): u is string => Boolean(u)),
  };
}

/**
 * Recomputes the parent transaction (amount, status, mirrors) from its payment rows.
 * Returns the updated parent.
 */
async function syncParent(tx: Tx, transactionId: string, adminUserId?: string | null) {
  const parent = await tx.transaction.findUnique({
    where: { id: transactionId },
    include: { payments: { orderBy: { sequence: "asc" } } },
  });
  if (!parent) throw new PaymentRuleError("Transaction not found", 404);

  const agreed = parent.agreedAmount ?? parent.amount;
  const payments = parent.payments as Array<any>;
  const totals = computeTotals(payments, agreed);
  const amount =
    totals.submittedTotal > 0 ? totals.submittedTotal : sumMoney(payments.map((p) => p.amount));

  const sticky = (STICKY_PAYMENT_STATUSES as readonly string[]).includes(parent.paymentStatus);
  const nextStatus = sticky ? parent.paymentStatus : derivePaymentStatus(payments, agreed);
  const isVerifiedState = nextStatus === "VERIFIED" || nextStatus === "COMPLETED";
  const wasVerifiedState = parent.paymentStatus === "VERIFIED" || parent.paymentStatus === "COMPLETED";

  const mirrors = mirrorArrays(payments);
  const active = payments.filter((p) => p.status !== "REJECTED");
  const first = active[0] ?? payments[0];

  return tx.transaction.update({
    where: { id: transactionId },
    data: {
      amount: amount as any,
      paymentStatus: nextStatus,
      paymentMethod: first?.paymentMethod ?? parent.paymentMethod,
      utrNumber: mirrors.utrNumbers.join(", ") || null,
      utrNumbers: mirrors.utrNumbers,
      paymentEvidenceUrl: mirrors.paymentEvidenceUrls[0] ?? null,
      paymentEvidenceUrls: mirrors.paymentEvidenceUrls,
      ...(isVerifiedState && !wasVerifiedState
        ? { verifiedAt: new Date(), verifiedBy: adminUserId ?? null }
        : !isVerifiedState
        ? { verifiedAt: null, verifiedBy: null }
        : {}),
    },
    include: { payments: { orderBy: { sequence: "asc" } } },
  });
}

// ── Create ──────────────────────────────────────────────────────────────────
export async function createTransactionWithPayments(args: {
  transactionNumber: string;
  partnerId: string;
  customerId: string | null;
  createdById: string;
  data: {
    customerName: string;
    customerEmail: string;
    customerWhatsapp?: string | null;
    solutionId?: string | null;
    enquiryId?: string | null;
    agreedAmount: number | null;
    currency: string;
    payments: PaymentInput[];
    paymentEvidenceNotes?: string | null;
    projectType: "EXISTING_SOLUTION" | "CUSTOMIZED_EXISTING_SOLUTION" | "NEW_SOLUTION_FOR_CUSTOMER";
    description?: string | null;
    deliveryStatus: "PENDING" | "IN_PROGRESS";
  };
}) {
  const { data } = args;
  const amounts = data.payments.map((p) => p.amount);
  const paidTotal = sumMoney(amounts);
  const agreed = data.agreedAmount ?? paidTotal;

  const gate = checkCanAddPayments([], agreed, amounts);
  if (!gate.ok) throw new PaymentRuleError(gate.error, 400);

  return db.$transaction(async (tx: Tx) => {
    await assertUtrsAreUnique(
      tx,
      data.payments.map((p) => p.utrNumber).filter((u): u is string => Boolean(u))
    );

    const mirrors = mirrorArrays(
      data.payments.map((p) => ({ status: "PENDING_REVIEW", utrNumber: p.utrNumber, evidenceUrl: p.evidenceUrl }))
    );

    const created = await tx.transaction.create({
      data: {
        transactionNumber: args.transactionNumber,
        partnerId: args.partnerId,
        customerId: args.customerId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerWhatsapp: data.customerWhatsapp || null,
        solutionId: data.solutionId || null,
        enquiryId: data.enquiryId || null,
        amount: paidTotal as any,
        agreedAmount: agreed as any,
        currency: data.currency || "INR",
        paymentMethod: data.payments[0].paymentMethod,
        utrNumber: mirrors.utrNumbers.join(", ") || null,
        utrNumbers: mirrors.utrNumbers,
        paymentStatus: "EVIDENCE_SUBMITTED",
        paymentEvidenceUrl: mirrors.paymentEvidenceUrls[0] ?? null,
        paymentEvidenceUrls: mirrors.paymentEvidenceUrls,
        paymentEvidenceNotes: data.paymentEvidenceNotes || null,
        projectType: data.projectType,
        description: data.description || null,
        deliveryStatus: data.deliveryStatus,
        verificationSource: "manual_provider_submission",
        payments: {
          create: data.payments.map((p, i) => ({
            sequence: i + 1,
            amount: p.amount as any,
            currency: data.currency || "INR",
            paymentMethod: p.paymentMethod,
            utrNumber: p.utrNumber,
            evidenceUrl: p.evidenceUrl,
            status: "PENDING_REVIEW",
            createdById: args.createdById,
          })),
        },
      },
      include: { payments: { orderBy: { sequence: "asc" } } },
    });

    await createAuditLogTx(tx, {
      userId: args.createdById,
      action: "TRANSACTION_RECORDED",
      entityType: "Transaction",
      entityId: created.id,
      details: {
        transactionNumber: args.transactionNumber,
        agreedAmount: agreed,
        paidTotal,
        paymentCount: data.payments.length,
        currency: data.currency,
        partnerId: args.partnerId,
      },
    });

    return created;
  }, TX_OPTIONS);
}

// ── Add payments to an existing transaction ─────────────────────────────────
export async function addPaymentsToTransaction(args: {
  transactionId: string;
  userId: string;
  isAdmin: boolean;
  partnerId: string | null;
  payments: PaymentInput[];
}) {
  return db.$transaction(async (tx: Tx) => {
    await lockTransactionRow(tx, args.transactionId);

    const parent = await tx.transaction.findUnique({
      where: { id: args.transactionId },
      include: { payments: { orderBy: { sequence: "asc" } } },
    });
    if (!parent) throw new PaymentRuleError("Transaction not found", 404);
    if (!args.isAdmin && parent.partnerId !== args.partnerId) {
      throw new PaymentRuleError("Forbidden: Not your transaction", 403);
    }
    if (["REFUNDED", "DISPUTED", "COMPLETED"].includes(parent.paymentStatus)) {
      throw new PaymentRuleError(
        `Payments cannot be added while the transaction is ${parent.paymentStatus}.`,
        409
      );
    }

    const agreed = parent.agreedAmount ?? parent.amount;
    const gate = checkCanAddPayments(
      parent.payments,
      agreed,
      args.payments.map((p) => p.amount)
    );
    if (!gate.ok) throw new PaymentRuleError(gate.error, 409);

    await assertUtrsAreUnique(
      tx,
      args.payments.map((p) => p.utrNumber).filter((u): u is string => Boolean(u))
    );

    const maxSeq = (parent.payments as Array<{ sequence: number }>).reduce(
      (m, p) => Math.max(m, p.sequence),
      0
    );

    await tx.transactionPayment.createMany({
      data: args.payments.map((p, i) => ({
        transactionId: parent.id,
        sequence: maxSeq + i + 1,
        amount: p.amount as any,
        currency: parent.currency,
        paymentMethod: p.paymentMethod,
        utrNumber: p.utrNumber,
        evidenceUrl: p.evidenceUrl,
        status: "PENDING_REVIEW",
        createdById: args.userId,
      })),
    });

    const updated = await syncParent(tx, parent.id);

    await createAuditLogTx(tx, {
      userId: args.userId,
      action: "TRANSACTION_PAYMENT_ADDED",
      entityType: "Transaction",
      entityId: parent.id,
      details: {
        transactionNumber: parent.transactionNumber,
        added: args.payments.length,
        addedTotal: sumMoney(args.payments.map((p) => p.amount)),
        agreedAmount: Number(agreed.toString()),
      },
    });

    return updated;
  }, TX_OPTIONS);
}

// ── Admin: verify / reject one payment ──────────────────────────────────────
export async function reviewPayment(args: {
  transactionId: string;
  paymentId: string;
  action: "VERIFY" | "REJECT";
  reason?: string | null;
  adminId: string;
}) {
  return db.$transaction(async (tx: Tx) => {
    await lockTransactionRow(tx, args.transactionId);

    const parent = await tx.transaction.findUnique({
      where: { id: args.transactionId },
      include: { payments: { orderBy: { sequence: "asc" } } },
    });
    if (!parent) throw new PaymentRuleError("Transaction not found", 404);

    const payment = (parent.payments as Array<any>).find((p) => p.id === args.paymentId);
    if (!payment) throw new PaymentRuleError("Payment not found on this transaction", 404);

    if (args.action === "VERIFY") {
      if (payment.status === "VERIFIED") throw new PaymentRuleError("Payment is already verified", 409);
      if (payment.status === "REJECTED") {
        throw new PaymentRuleError(
          "A rejected payment cannot be verified. Ask the partner to submit it again.",
          409
        );
      }
    } else {
      if (payment.status === "REJECTED") throw new PaymentRuleError("Payment is already rejected", 409);
      if (
        payment.status === "VERIFIED" &&
        (parent.deliveryStatus === "DELIVERED" || parent.deliveryStatus === "COMPLETED")
      ) {
        throw new PaymentRuleError(
          "A verified payment cannot be rejected after the order is delivered.",
          409
        );
      }
    }

    await tx.transactionPayment.update({
      where: { id: payment.id },
      data:
        args.action === "VERIFY"
          ? { status: "VERIFIED", verifiedAt: new Date(), verifiedBy: args.adminId, rejectionReason: null }
          : {
              status: "REJECTED",
              verifiedAt: null,
              verifiedBy: null,
              rejectionReason: args.reason?.trim() || null,
            },
    });

    const updated = await syncParent(tx, parent.id, args.adminId);

    await createAuditLogTx(tx, {
      userId: args.adminId,
      action: args.action === "VERIFY" ? "TRANSACTION_PAYMENT_VERIFIED" : "TRANSACTION_PAYMENT_REJECTED",
      entityType: "Transaction",
      entityId: parent.id,
      details: {
        transactionNumber: parent.transactionNumber,
        paymentId: payment.id,
        sequence: payment.sequence,
        amount: Number(payment.amount.toString()),
        reason: args.reason ?? null,
        parentPaymentStatus: updated.paymentStatus,
      },
    });

    return updated;
  }, TX_OPTIONS);
}

// ── Admin: parent-level status change (bulk verify / reject / refund / ...) ─
export async function updateTransactionStatusWithPayments(args: {
  transactionId: string;
  adminId: string;
  paymentStatus: string;
  deliveryStatus?: string;
  adminNotes?: string | null;
}) {
  return db.$transaction(async (tx: Tx) => {
    await lockTransactionRow(tx, args.transactionId);

    const parent = await tx.transaction.findUnique({
      where: { id: args.transactionId },
      include: { payments: { orderBy: { sequence: "asc" } } },
    });
    if (!parent) return null;

    const agreed = parent.agreedAmount ?? parent.amount;
    const requested = args.paymentStatus;
    const wantsVerified = requested === "VERIFIED" || requested === "COMPLETED";

    if (wantsVerified) {
      await tx.transactionPayment.updateMany({
        where: { transactionId: parent.id, status: "PENDING_REVIEW" },
        data: { status: "VERIFIED", verifiedAt: new Date(), verifiedBy: args.adminId },
      });
    } else if (requested === "REJECTED") {
      await tx.transactionPayment.updateMany({
        where: { transactionId: parent.id, status: "PENDING_REVIEW" },
        data: { status: "REJECTED", verifiedAt: null, verifiedBy: null },
      });
    }

    const rows = await tx.transactionPayment.findMany({
      where: { transactionId: parent.id },
      orderBy: { sequence: "asc" },
    });
    const totals = computeTotals(rows, agreed);

    if (wantsVerified && !totals.isFullyPaid) {
      // Throwing rolls back the bulk verification above.
      throw new PaymentRuleError(
        `Cannot mark as ${requested}: only ${fromCents(toCents(totals.verifiedTotal))} of ${Number(
          agreed.toString()
        )} is paid. Wait for the remaining payments, or verify each payment individually.`,
        409
      );
    }

    if (
      (args.deliveryStatus === "DELIVERED" || args.deliveryStatus === "COMPLETED") &&
      !canMarkDelivered(rows, agreed)
    ) {
      throw new PaymentRuleError(
        "Delivery cannot be marked Delivered/Completed until the full amount is paid and verified.",
        409
      );
    }

    const sticky = ["REFUNDED", "DISPUTED", "COMPLETED", "UNDER_REVIEW"].includes(requested);
    const derived = derivePaymentStatus(rows, agreed);
    const nextStatus = sticky || wantsVerified ? requested : derived;
    const isVerifiedState = nextStatus === "VERIFIED" || nextStatus === "COMPLETED";
    const wasVerifiedState = parent.paymentStatus === "VERIFIED" || parent.paymentStatus === "COMPLETED";

    const mirrors = mirrorArrays(rows);
    const active = rows.filter((r: any) => r.status !== "REJECTED");

    const updated = await tx.transaction.update({
      where: { id: parent.id },
      data: {
        paymentStatus: nextStatus as any,
        amount: (totals.submittedTotal > 0 ? totals.submittedTotal : sumMoney(rows.map((r: any) => r.amount))) as any,
        utrNumber: mirrors.utrNumbers.join(", ") || null,
        utrNumbers: mirrors.utrNumbers,
        paymentEvidenceUrl: mirrors.paymentEvidenceUrls[0] ?? null,
        paymentEvidenceUrls: mirrors.paymentEvidenceUrls,
        paymentMethod: active[0]?.paymentMethod ?? parent.paymentMethod,
        ...(args.deliveryStatus ? { deliveryStatus: args.deliveryStatus as any } : {}),
        ...(args.adminNotes !== undefined ? { adminNotes: args.adminNotes } : {}),
        ...(isVerifiedState && !wasVerifiedState
          ? { verifiedAt: new Date(), verifiedBy: args.adminId }
          : !isVerifiedState
          ? { verifiedAt: null, verifiedBy: null }
          : {}),
      },
      include: { payments: { orderBy: { sequence: "asc" } } },
    });

    await createAuditLogTx(tx, {
      userId: args.adminId,
      action: `TRANSACTION_${nextStatus}`,
      entityType: "Transaction",
      entityId: parent.id,
      details: {
        transactionNumber: parent.transactionNumber,
        previousPaymentStatus: parent.paymentStatus,
        requestedStatus: requested,
        paymentStatus: nextStatus,
        adminNotes: args.adminNotes ?? null,
      },
    });

    return updated;
  }, TX_OPTIONS);
}

// ── Reads ───────────────────────────────────────────────────────────────────
export async function getPaymentForReceipt(paymentId: string) {
  return db.transactionPayment.findUnique({
    where: { id: paymentId },
    include: {
      transaction: {
        include: {
          payments: { orderBy: { sequence: "asc" } },
          partner: { select: { id: true, displayName: true, email: true, userId: true } },
          solution: { select: { id: true, title: true } },
        },
      },
    },
  });
}

export { normalizeUtr };
