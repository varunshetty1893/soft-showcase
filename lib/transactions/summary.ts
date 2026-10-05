// lib/transactions/summary.ts
// Turns a transaction + its payment rows into plain, serialisable data for the UI
// (lists, detail pages, receipts). No DB access, safe to import from server components.

import { buildReceipts, computeTotals, MAX_ACTIVE_PAYMENTS } from "@/lib/transactions/payments";

export interface PaymentView {
  id: string;
  sequence: number;
  amount: number;
  paymentMethod: string;
  utrNumber: string | null;
  evidenceUrl: string | null;
  status: string;
  paidAt: string;
  rejectionReason: string | null;
  receiptNumber: string | null;
  isFinalReceipt: boolean;
}

export interface TransactionSummary {
  agreedAmount: number;
  verifiedTotal: number;
  submittedTotal: number;
  balance: number;
  remainingToSubmit: number;
  activeCount: number;
  slotsLeft: number;
  isFullyPaid: boolean;
  payments: PaymentView[];
}

const iso = (d: unknown): string =>
  d instanceof Date ? d.toISOString() : typeof d === "string" ? d : new Date().toISOString();

export function summarizeTransaction(tx: {
  transactionNumber: string;
  amount: { toString(): string } | number | string;
  agreedAmount?: { toString(): string } | number | string | null;
  payments?: any[] | null;
}): TransactionSummary {
  const payments = (tx.payments ?? []) as any[];
  const agreed = tx.agreedAmount ?? tx.amount;
  const totals = computeTotals(payments, agreed);
  const receipts = buildReceipts(tx.transactionNumber, payments, agreed);
  const receiptByPayment = new Map(receipts.map((r) => [r.paymentId, r]));

  return {
    agreedAmount: Number(agreed.toString()),
    verifiedTotal: totals.verifiedTotal,
    submittedTotal: totals.submittedTotal,
    balance: totals.balance,
    remainingToSubmit: totals.remainingToSubmit,
    activeCount: totals.activeCount,
    slotsLeft: Math.max(0, MAX_ACTIVE_PAYMENTS - totals.activeCount),
    isFullyPaid: totals.isFullyPaid,
    payments: payments
      .slice()
      .sort((a, b) => a.sequence - b.sequence)
      .map((p) => {
        const r = receiptByPayment.get(p.id);
        return {
          id: p.id,
          sequence: p.sequence,
          amount: Number(p.amount.toString()),
          paymentMethod: p.paymentMethod,
          utrNumber: p.utrNumber ?? null,
          evidenceUrl: p.evidenceUrl ?? null,
          status: p.status,
          paidAt: iso(p.paidAt),
          rejectionReason: p.rejectionReason ?? null,
          receiptNumber: r?.receiptNumber ?? null,
          isFinalReceipt: r?.isFinal ?? false,
        };
      }),
  };
}
