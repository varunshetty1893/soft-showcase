import { describe, it, expect } from "vitest";
import {
  MAX_ACTIVE_PAYMENTS,
  buildReceipts,
  canMarkDelivered,
  checkCanAddPayments,
  computeTotals,
  derivePaymentStatus,
  normalizePaymentMethod,
  validateUtrForMethod,
} from "@/lib/transactions/payments";
import {
  AddPaymentsSchema,
  CreateTransactionSchema,
} from "@/lib/validation/transaction.schema";
import { cleanReceiptExtraction, pickUtr } from "@/lib/transactions/receipt-parse";
import { summarizeTransaction } from "@/lib/transactions/summary";

const pay = (sequence: number, amount: number, status = "PENDING_REVIEW", id = `p${sequence}`) => ({
  id,
  sequence,
  amount,
  status,
});

const baseTx = {
  customerName: "Rahul Sharma",
  customerEmail: "rahul@example.com",
  currency: "INR",
  projectType: "EXISTING_SOLUTION",
  deliveryStatus: "PENDING",
};

describe("max 3 payments", () => {
  it("MAX_ACTIVE_PAYMENTS is 3", () => {
    expect(MAX_ACTIVE_PAYMENTS).toBe(3);
  });

  it("schema accepts 3 payments and rejects 4", () => {
    const mk = (n: number) =>
      Array.from({ length: n }, (_, i) => ({ amount: 100, paymentMethod: "UPI", utrNumber: `66437405816${i}` }));
    expect(CreateTransactionSchema.safeParse({ ...baseTx, payments: mk(3) }).success).toBe(true);
    expect(CreateTransactionSchema.safeParse({ ...baseTx, payments: mk(4) }).success).toBe(false);
    expect(AddPaymentsSchema.safeParse({ payments: mk(4) }).success).toBe(false);
  });

  it("server gate blocks a 4th active payment but ignores rejected ones", () => {
    const three = [pay(1, 100, "VERIFIED"), pay(2, 100), pay(3, 100)];
    expect(checkCanAddPayments(three, 1000, [100]).ok).toBe(false);
    const withRejected = [pay(1, 100, "VERIFIED"), pay(2, 100, "REJECTED"), pay(3, 100)];
    expect(checkCanAddPayments(withRejected, 1000, [100]).ok).toBe(true);
  });

  it("gate counts incoming rows against the limit", () => {
    expect(checkCanAddPayments([pay(1, 100)], 1000, [100, 100, 100]).ok).toBe(false);
    expect(checkCanAddPayments([pay(1, 100)], 1000, [100, 100]).ok).toBe(true);
  });
});

describe("overpayment protection", () => {
  it("blocks payments above the agreed amount", () => {
    expect(checkCanAddPayments([pay(1, 600)], 1000, [500]).ok).toBe(false);
    expect(checkCanAddPayments([pay(1, 600)], 1000, [400]).ok).toBe(true);
  });
  it("a rejected payment frees its amount again", () => {
    expect(checkCanAddPayments([pay(1, 600, "REJECTED")], 1000, [1000]).ok).toBe(true);
  });
  it("handles paise without float drift", () => {
    expect(checkCanAddPayments([pay(1, 0.1)], 0.3, [0.2]).ok).toBe(true);
    expect(checkCanAddPayments([pay(1, 0.1)], 0.3, [0.21]).ok).toBe(false);
  });
});

describe("UTR rules", () => {
  it("cash payments never need (or keep) a UTR", () => {
    expect(validateUtrForMethod("CASH", "")).toEqual({ ok: true, utr: null });
    expect(validateUtrForMethod("CASH", "anything")).toEqual({ ok: true, utr: null });
    const r = AddPaymentsSchema.safeParse({ payments: [{ amount: 500, paymentMethod: "CASH", utrNumber: "123" }] });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.payments[0].utrNumber).toBeNull();
  });
  it("UPI needs exactly 12 digits", () => {
    expect(validateUtrForMethod("UPI", "664374058160").ok).toBe(true);
    expect(validateUtrForMethod("UPI", "6643740581").ok).toBe(false);
    expect(validateUtrForMethod("UPI", "CICAgPiqzsmqDg").ok).toBe(false); // Google transaction ID, not a UTR
    expect(validateUtrForMethod("UPI", "").ok).toBe(false);
  });
  it("bank transfers accept generic references", () => {
    expect(validateUtrForMethod("NEFT_RTGS", "SBIN526123456789").ok).toBe(true);
    expect(validateUtrForMethod("NEFT_RTGS", "ab").ok).toBe(false);
  });
  it("normalises legacy / AI method names", () => {
    expect(normalizePaymentMethod("CARD")).toBe("CREDIT_DEBIT_CARD");
    expect(normalizePaymentMethod("WIRE")).toBe("WIRE_TRANSFER");
    expect(normalizePaymentMethod("gpay")).toBe("UPI");
    expect(normalizePaymentMethod("???")).toBe("OTHER");
  });
  it("non-cash payment without UTR is rejected by the schema", () => {
    expect(AddPaymentsSchema.safeParse({ payments: [{ amount: 500, paymentMethod: "UPI" }] }).success).toBe(false);
  });
});

describe("payment amounts", () => {
  it("rejects zero and negative payment amounts", () => {
    for (const amount of [0, -1, "0", "-100"]) {
      expect(
        AddPaymentsSchema.safeParse({ payments: [{ amount, paymentMethod: "CASH" }] }).success
      ).toBe(false);
    }
  });
  it("rejects zero / negative agreed amount", () => {
    const payments = [{ amount: 100, paymentMethod: "CASH" }];
    expect(CreateTransactionSchema.safeParse({ ...baseTx, agreedAmount: 0, payments }).success).toBe(false);
    expect(CreateTransactionSchema.safeParse({ ...baseTx, agreedAmount: -5, payments }).success).toBe(false);
    expect(CreateTransactionSchema.safeParse({ ...baseTx, agreedAmount: 1000, payments }).success).toBe(true);
  });
});

describe("totals, balance and status", () => {
  it("separates submitted from verified totals", () => {
    const t = computeTotals([pay(1, 400, "VERIFIED"), pay(2, 300), pay(3, 200, "REJECTED")], 1000);
    expect(t.verifiedTotal).toBe(400);
    expect(t.submittedTotal).toBe(700);
    expect(t.balance).toBe(600);
    expect(t.remainingToSubmit).toBe(300);
    expect(t.activeCount).toBe(2);
    expect(t.isFullyPaid).toBe(false);
  });
  it("derives parent status from payment rows", () => {
    expect(derivePaymentStatus([pay(1, 1000, "VERIFIED")], 1000)).toBe("VERIFIED");
    expect(derivePaymentStatus([pay(1, 500, "VERIFIED"), pay(2, 500)], 1000)).toBe("EVIDENCE_SUBMITTED");
    expect(derivePaymentStatus([pay(1, 500, "VERIFIED")], 1000)).toBe("PENDING");
    expect(derivePaymentStatus([pay(1, 500, "REJECTED")], 1000)).toBe("REJECTED");
  });
  it("delivery is allowed only when balance is zero", () => {
    expect(canMarkDelivered([pay(1, 500, "VERIFIED")], 1000)).toBe(false);
    expect(canMarkDelivered([pay(1, 500, "VERIFIED"), pay(2, 500)], 1000)).toBe(false);
    expect(canMarkDelivered([pay(1, 500, "VERIFIED"), pay(2, 500, "VERIFIED")], 1000)).toBe(true);
  });
});

describe("receipts", () => {
  it("issues receipts only for verified payments", () => {
    const r = buildReceipts("TXN-1", [pay(1, 400, "VERIFIED"), pay(2, 300), pay(3, 300, "REJECTED")], 1000);
    expect(r).toHaveLength(1);
    expect(r[0].receiptNumber).toBe("TXN-1-R1");
    expect(r[0].isFinal).toBe(false);
    expect(r[0].balanceAfter).toBe(600);
  });
  it("marks exactly the payment that clears the balance as the final receipt", () => {
    const r = buildReceipts(
      "TXN-2",
      [pay(1, 400, "VERIFIED"), pay(2, 300, "VERIFIED"), pay(3, 300, "VERIFIED")],
      1000
    );
    expect(r.map((x) => x.isFinal)).toEqual([false, false, true]);
    expect(r[2].balanceAfter).toBe(0);
    expect(r[2].paidTotalAfter).toBe(1000);
  });
  it("verification order, not entry order, decides the running total", () => {
    const r = buildReceipts("TXN-3", [pay(2, 600, "VERIFIED"), pay(1, 400, "VERIFIED")], 1000);
    expect(r.map((x) => x.sequence)).toEqual([1, 2]);
    expect(r[1].isFinal).toBe(true);
  });
  it("a single full payment gets a Paid in Full receipt", () => {
    const r = buildReceipts("TXN-4", [pay(1, 2500, "VERIFIED")], 2500);
    expect(r[0].isFinal).toBe(true);
  });
});

describe("summary for the UI", () => {
  it("builds payment views with receipt numbers", () => {
    const s = summarizeTransaction({
      transactionNumber: "TXN-9",
      amount: "1000",
      agreedAmount: "1000",
      payments: [
        { id: "a", sequence: 1, amount: "400", status: "VERIFIED", paymentMethod: "UPI", paidAt: new Date() },
        { id: "b", sequence: 2, amount: "600", status: "PENDING_REVIEW", paymentMethod: "CASH", paidAt: new Date() },
      ],
    });
    expect(s.verifiedTotal).toBe(400);
    expect(s.balance).toBe(600);
    expect(s.slotsLeft).toBe(1);
    expect(s.payments[0].receiptNumber).toBe("TXN-9-R1");
    expect(s.payments[1].receiptNumber).toBeNull();
  });
  it("legacy transactions without agreedAmount fall back to amount", () => {
    const s = summarizeTransaction({ transactionNumber: "TXN-L", amount: "750", payments: [] });
    expect(s.agreedAmount).toBe(750);
  });
});

describe("screenshot reading (UTR detection)", () => {
  it("picks the 12-digit UPI transaction ID, never the Google transaction ID", () => {
    const raw = { amount: "2", upiTransactionId: "664374058160", otherReferenceId: "CICAgPiqzsmqDg" };
    const c = cleanReceiptExtraction(raw);
    expect(c.utrNumber).toBe("664374058160");
    expect(c.amount).toBe("2");
    expect(c.confidence).toBe("high");
  });
  it("falls back to a lone 12-digit number in the model text", () => {
    expect(pickUtr({ upiTransactionId: "" }, 'UTR: 664314282450 amount 1')).toBe("664314282450");
  });
  it("does not guess when two 12-digit numbers are present", () => {
    expect(pickUtr({}, "664314282450 and 664374058160")).toBeNull();
  });
  it("warns instead of failing silently when UTR is missing", () => {
    const c = cleanReceiptExtraction({ amount: "1", upiTransactionId: "CICAgPiq9oS9TA" });
    expect(c.utrNumber).toBeUndefined();
    expect(c.warnings.join(" ")).toMatch(/UTR not detected/);
    expect(c.confidence).toBe("medium");
  });
  it("rejects zero amount from the reader", () => {
    expect(cleanReceiptExtraction({ amount: "0", upiTransactionId: "664374058160" }).amount).toBeUndefined();
  });
});
