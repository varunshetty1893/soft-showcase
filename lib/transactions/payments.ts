// lib/transactions/payments.ts
// Pure (DB-free) business rules for installment payments, UTR validation and
// receipts. Everything here is unit tested; API routes and UI both import it so
// the rules can never drift apart.

import { fromCents, toCents } from "@/lib/utils/money";

// ── Limits ──────────────────────────────────────────────────────────────────
/** Maximum number of active (non-rejected) payments on one transaction. */
export const MAX_ACTIVE_PAYMENTS = 3;
/** Hard cap on total rows (incl. rejected) so a record can never grow unbounded. */
export const MAX_TOTAL_PAYMENT_ROWS = 10;

// ── Payment methods ─────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
  "UPI",
  "IMPS",
  "NEFT_RTGS",
  "BANK_TRANSFER",
  "CREDIT_DEBIT_CARD",
  "WIRE_TRANSFER",
  "CASH",
  "PAYPAL",
  "STRIPE",
  "OTHER",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Methods offered in the partner UI (PAYPAL/STRIPE stay valid for legacy data). */
export const UI_PAYMENT_METHODS: ReadonlyArray<{ value: PaymentMethod; label: string }> = [
  { value: "UPI", label: "UPI (Google Pay / PhonePe / Paytm)" },
  { value: "IMPS", label: "IMPS Immediate Transfer" },
  { value: "NEFT_RTGS", label: "NEFT / RTGS Bank Transfer" },
  { value: "BANK_TRANSFER", label: "Other Bank Transfer" },
  { value: "CREDIT_DEBIT_CARD", label: "Debit / Credit Card" },
  { value: "WIRE_TRANSFER", label: "International Wire / SWIFT" },
  { value: "CASH", label: "Cash (In-Person)" },
  { value: "OTHER", label: "Other" },
];

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  IMPS: "IMPS",
  NEFT_RTGS: "NEFT / RTGS",
  BANK_TRANSFER: "Bank Transfer",
  CREDIT_DEBIT_CARD: "Card",
  WIRE_TRANSFER: "Wire Transfer",
  CASH: "Cash",
  PAYPAL: "PayPal",
  STRIPE: "Stripe",
  OTHER: "Other",
};

export function paymentMethodLabel(method: string | null | undefined): string {
  if (!method) return "—";
  return PAYMENT_METHOD_LABELS[method] ?? method.replace(/_/g, " ");
}

/** Maps legacy / UI / AI aliases onto the canonical enum (never throws). */
export function normalizePaymentMethod(raw: unknown): string {
  if (typeof raw !== "string") return "UPI";
  const u = raw.trim().toUpperCase().replace(/[\s/-]+/g, "_");
  if (!u) return "UPI";
  if ((PAYMENT_METHODS as readonly string[]).includes(u)) return u;
  if (u === "CARD" || u === "DEBIT_CARD" || u === "CREDIT_CARD") return "CREDIT_DEBIT_CARD";
  if (u === "WIRE" || u === "SWIFT") return "WIRE_TRANSFER";
  if (u === "NEFT" || u === "RTGS") return "NEFT_RTGS";
  if (u.includes("UPI") || u.includes("GPAY") || u.includes("PHONEPE") || u.includes("PAYTM") || u === "BHIM") return "UPI";
  if (u.includes("CASH")) return "CASH";
  return "OTHER";
}

export function isCashMethod(method: string | null | undefined): boolean {
  return method === "CASH";
}

// ── UTR / reference validation ──────────────────────────────────────────────
export function normalizeUtr(raw: string | null | undefined): string {
  return (raw ?? "").trim().replace(/\s+/g, "").toUpperCase();
}

const TWELVE_DIGITS = /^\d{12}$/;
const GENERIC_REFERENCE = /^[A-Z0-9][A-Z0-9\-_./]{5,34}$/;

/** True when the method's reference must be a 12-digit number (UPI / IMPS). */
export function requiresTwelveDigitUtr(method: string): boolean {
  return method === "UPI" || method === "IMPS";
}

export type UtrCheck = { ok: true; utr: string | null } | { ok: false; error: string };

/**
 * Validates the UTR for a given payment method.
 *  - CASH: no UTR is asked or stored (any value is discarded).
 *  - UPI / IMPS: exactly 12 digits.
 *  - everything else: 6-35 chars, letters / digits / - _ . /
 */
export function validateUtrForMethod(method: string, rawUtr: string | null | undefined): UtrCheck {
  if (isCashMethod(method)) return { ok: true, utr: null };
  const utr = normalizeUtr(rawUtr);
  if (!utr) return { ok: false, error: "UTR / reference number is required for non-cash payments" };
  if (requiresTwelveDigitUtr(method)) {
    if (!TWELVE_DIGITS.test(utr)) {
      return { ok: false, error: "UPI / IMPS UTR must be exactly 12 digits" };
    }
    return { ok: true, utr };
  }
  if (!GENERIC_REFERENCE.test(utr)) {
    return { ok: false, error: "Reference number must be 6-35 characters (letters, digits, - _ . /)" };
  }
  return { ok: true, utr };
}

// ── Payment rows & totals ───────────────────────────────────────────────────
export type PaymentEntryStatus = "PENDING_REVIEW" | "VERIFIED" | "REJECTED";

export interface PaymentLike {
  id?: string;
  sequence: number;
  amount: number | string | { toString(): string };
  status: string;
}

export interface PaymentTotals {
  /** Non-rejected payments (pending + verified): counts against the agreed amount. */
  submittedTotal: number;
  /** Only verified payments: drives receipts, balance and delivery. */
  verifiedTotal: number;
  /** Agreed amount - submittedTotal: what the customer can still be asked to pay. */
  remainingToSubmit: number;
  /** Agreed amount - verifiedTotal: unverified/unpaid balance. */
  balance: number;
  activeCount: number;
  pendingCount: number;
  isFullyPaid: boolean; // verifiedTotal >= agreed
}

export function computeTotals(
  payments: PaymentLike[],
  agreedAmount: number | string | { toString(): string }
): PaymentTotals {
  const agreedCents = toCents(agreedAmount);
  let submitted = 0;
  let verified = 0;
  let active = 0;
  let pending = 0;
  for (const p of payments) {
    if (p.status === "REJECTED") continue;
    const c = toCents(p.amount);
    submitted += c;
    active += 1;
    if (p.status === "VERIFIED") verified += c;
    else pending += 1;
  }
  return {
    submittedTotal: fromCents(submitted),
    verifiedTotal: fromCents(verified),
    remainingToSubmit: fromCents(Math.max(0, agreedCents - submitted)),
    balance: fromCents(Math.max(0, agreedCents - verified)),
    activeCount: active,
    pendingCount: pending,
    isFullyPaid: agreedCents > 0 && verified >= agreedCents,
  };
}

export type AddPaymentsCheck = { ok: true } | { ok: false; error: string };

/**
 * Server-side gate for adding new payment rows to a transaction.
 * `existing` must be the rows as read INSIDE the locked DB transaction.
 */
export function checkCanAddPayments(
  existing: PaymentLike[],
  agreedAmount: number | string | { toString(): string },
  incomingAmounts: number[]
): AddPaymentsCheck {
  if (incomingAmounts.length === 0) {
    return { ok: false, error: "At least one payment is required" };
  }
  if (existing.length + incomingAmounts.length > MAX_TOTAL_PAYMENT_ROWS) {
    return { ok: false, error: "This transaction has reached the maximum number of payment entries" };
  }
  const totals = computeTotals(existing, agreedAmount);
  if (totals.activeCount + incomingAmounts.length > MAX_ACTIVE_PAYMENTS) {
    const left = Math.max(0, MAX_ACTIVE_PAYMENTS - totals.activeCount);
    return {
      ok: false,
      error:
        left === 0
          ? `A transaction can have at most ${MAX_ACTIVE_PAYMENTS} payments. No more payments can be added.`
          : `A transaction can have at most ${MAX_ACTIVE_PAYMENTS} payments. You can add ${left} more.`,
    };
  }
  const incomingCents = incomingAmounts.reduce((s, a) => s + toCents(a), 0);
  if (incomingCents > toCents(totals.remainingToSubmit)) {
    return {
      ok: false,
      error: `Payments exceed the agreed total. Only ${totals.remainingToSubmit} is still outstanding.`,
    };
  }
  return { ok: true };
}

// ── Receipts ────────────────────────────────────────────────────────────────
export interface ReceiptMeta {
  paymentId: string;
  receiptNumber: string;
  sequence: number;
  isFinal: boolean;
  paidTotalAfter: number;
  balanceAfter: number;
}

export function buildReceiptNumber(transactionNumber: string, sequence: number): string {
  return `${transactionNumber}-R${sequence}`;
}

/**
 * Receipts exist only for VERIFIED payments. A receipt is the "Paid in Full"
 * (final) receipt when the running verified total reaches the agreed amount.
 */
export function buildReceipts(
  transactionNumber: string,
  payments: Array<PaymentLike & { id: string }>,
  agreedAmount: number | string | { toString(): string }
): ReceiptMeta[] {
  const agreedCents = toCents(agreedAmount);
  const verified = payments
    .filter((p) => p.status === "VERIFIED")
    .sort((a, b) => a.sequence - b.sequence);
  let running = 0;
  let finalIssued = false;
  return verified.map((p) => {
    running += toCents(p.amount);
    const isFinal = !finalIssued && running >= agreedCents;
    if (isFinal) finalIssued = true;
    return {
      paymentId: p.id,
      receiptNumber: buildReceiptNumber(transactionNumber, p.sequence),
      sequence: p.sequence,
      isFinal,
      paidTotalAfter: fromCents(running),
      balanceAfter: fromCents(Math.max(0, agreedCents - running)),
    };
  });
}

// ── Parent status derivation ────────────────────────────────────────────────
/** Admin-set terminal states that automatic derivation must never overwrite. */
export const STICKY_PAYMENT_STATUSES = ["REFUNDED", "DISPUTED", "COMPLETED"] as const;

export type DerivedPaymentStatus =
  | "PENDING"
  | "EVIDENCE_SUBMITTED"
  | "VERIFIED"
  | "REJECTED";

/**
 * Parent `paymentStatus` as a function of its payment rows.
 *  - all rows rejected (and at least one)          -> REJECTED
 *  - fully paid & verified                         -> VERIFIED
 *  - any row awaiting review                       -> EVIDENCE_SUBMITTED
 *  - otherwise (partially verified, waiting for money) -> PENDING
 */
export function derivePaymentStatus(
  payments: PaymentLike[],
  agreedAmount: number | string | { toString(): string }
): DerivedPaymentStatus {
  if (payments.length > 0 && payments.every((p) => p.status === "REJECTED")) return "REJECTED";
  const totals = computeTotals(payments, agreedAmount);
  if (totals.isFullyPaid && totals.pendingCount === 0) return "VERIFIED";
  if (totals.pendingCount > 0) return "EVIDENCE_SUBMITTED";
  return "PENDING";
}

/** Delivered / Completed delivery is only allowed once the balance is fully verified. */
export function canMarkDelivered(
  payments: PaymentLike[],
  agreedAmount: number | string | { toString(): string }
): boolean {
  return computeTotals(payments, agreedAmount).isFullyPaid;
}
