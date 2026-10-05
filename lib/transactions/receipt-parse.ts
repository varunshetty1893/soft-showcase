// lib/transactions/receipt-parse.ts
// Pure helpers that clean up what the vision model returned. The model can read a screen
// correctly and still pick the wrong ID (e.g. Google Pay shows BOTH a 12-digit
// "UPI transaction ID" and a "Google transaction ID" like CICAgPiq...), so the final UTR is
// chosen here by rule, not trusted blindly.

import { parseMoney } from "@/lib/utils/money";
import { normalizePaymentMethod } from "@/lib/transactions/payments";

export interface RawReceiptExtraction {
  amount?: unknown;
  currency?: unknown;
  upiTransactionId?: unknown;
  utrNumber?: unknown;
  otherReferenceId?: unknown;
  paymentMethod?: unknown;
  paymentStatus?: unknown;
  transactionDate?: unknown;
}

export interface CleanReceiptExtraction {
  amount?: string;
  currency?: string;
  utrNumber?: string;
  paymentMethod?: string;
  confidence: "high" | "medium" | "low";
  warnings: string[];
}

const TWELVE = /(?<!\d)\d{12}(?!\d)/g;

function asString(v: unknown): string {
  return typeof v === "string" ? v : typeof v === "number" ? String(v) : "";
}

function digitsOnly(v: string): string {
  return v.replace(/[\s\-_.]/g, "");
}

export function pickUtr(raw: RawReceiptExtraction, modelText = ""): string | null {
  const candidates = [asString(raw.upiTransactionId), asString(raw.utrNumber)];
  for (const c of candidates) {
    const d = digitsOnly(c);
    if (/^\d{12}$/.test(d)) return d;
  }
  // Fallback: a 12-digit run inside any candidate (e.g. "UTR: 664374058160")
  for (const c of candidates) {
    const m = c.match(TWELVE);
    if (m && m.length === 1) return m[0];
  }
  // Last resort: exactly one 12-digit number anywhere in the model output
  const all = Array.from(new Set(modelText.match(TWELVE) ?? []));
  if (all.length === 1) return all[0];
  return null;
}

export function cleanReceiptExtraction(raw: RawReceiptExtraction, modelText = ""): CleanReceiptExtraction {
  const warnings: string[] = [];
  const out: CleanReceiptExtraction = { confidence: "low", warnings };

  const amountRes = parseMoney(asString(raw.amount).replace(/[^\d.,-]/g, ""), "Amount");
  if (amountRes.ok) out.amount = String(amountRes.value);
  else if (asString(raw.amount)) warnings.push("The amount on the screenshot could not be read reliably. Please enter it manually.");

  const currency = asString(raw.currency).trim().toUpperCase();
  out.currency = /^[A-Z]{3}$/.test(currency) ? currency : "INR";

  const method = normalizePaymentMethod(asString(raw.paymentMethod) || "UPI");
  out.paymentMethod = method;

  const utr = pickUtr(raw, modelText);
  if (utr) out.utrNumber = utr;
  else warnings.push("UTR not detected. Enter the 12-digit UPI transaction ID manually.");

  const status = asString(raw.paymentStatus).toLowerCase();
  if (status && !/(complete|success|paid|done)/.test(status)) {
    warnings.push("This screenshot does not show a completed payment.");
  }

  out.confidence = out.amount && out.utrNumber ? "high" : out.amount || out.utrNumber ? "medium" : "low";
  return out;
}
