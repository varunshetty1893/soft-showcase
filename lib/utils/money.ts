// lib/utils/money.ts
// Single shared rule for every money / price / amount field in the platform.
//
//   - must be a finite number
//   - never zero, never negative (minimum 1)
//   - at most 2 decimal places
//   - upper sanity limit
//
// Used by API validation (zod) AND by client forms so both sides agree.
// All arithmetic helpers work in integer paise/cents to avoid float drift
// (e.g. 0.1 + 0.2).

import { z } from "zod";

export const MIN_MONEY_AMOUNT = 1;
export const MAX_MONEY_AMOUNT = 50_000_000;

export type MoneyParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/**
 * Parse a user-entered amount (string or number). Strict: rejects empty, NaN,
 * zero, negatives, more than 2 decimals, and values above the system limit.
 */
export function parseMoney(
  input: unknown,
  label = "Amount"
): MoneyParseResult {
  if (input === null || input === undefined) {
    return { ok: false, error: `${label} is required` };
  }
  const raw = typeof input === "string" ? input.trim().replace(/,/g, "") : input;
  if (raw === "") {
    return { ok: false, error: `${label} is required` };
  }
  if (typeof raw === "string" && !/^-?\d+(\.\d+)?$/.test(raw)) {
    return { ok: false, error: `${label} must be a valid number` };
  }
  const num = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(num)) {
    return { ok: false, error: `${label} must be a valid number` };
  }
  if (num <= 0) {
    return { ok: false, error: `${label} must be greater than zero` };
  }
  if (num < MIN_MONEY_AMOUNT) {
    return { ok: false, error: `${label} must be at least ${MIN_MONEY_AMOUNT}` };
  }
  if (num > MAX_MONEY_AMOUNT) {
    return { ok: false, error: `${label} exceeds the system limit` };
  }
  if (Math.abs(num * 100 - Math.round(num * 100)) > 1e-6) {
    return { ok: false, error: `${label} can have at most 2 decimal places` };
  }
  return { ok: true, value: Math.round(num * 100) / 100 };
}

/** zod schema for a money field that must already be a JSON number (project prices etc.). */
export function moneyNumber(label = "Price") {
  return z
    .number({ invalid_type_error: `${label} must be a number` })
    .superRefine((val, ctx) => {
      const res = parseMoney(val, label);
      if (!res.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: res.error });
    });
}

/** zod schema for a required money field (accepts number or numeric string). */
export function moneySchema(label = "Amount") {
  return z
    .union([z.number(), z.string()])
    .transform((val, ctx) => {
      const res = parseMoney(val, label);
      if (!res.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: res.error });
        return z.NEVER;
      }
      return res.value;
    });
}

/** zod schema for an optional money field (empty / null / undefined => null). */
export function optionalMoneySchema(label = "Amount") {
  return z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val, ctx) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        return null;
      }
      const res = parseMoney(val, label);
      if (!res.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: res.error });
        return z.NEVER;
      }
      return res.value;
    });
}

/**
 * Optional "budget" for custom requests. Must be a positive number when
 * provided. Stored as a normalised numeric string (e.g. "25000" / "499.5").
 */
export function optionalBudgetSchema() {
  return z
    .union([z.number(), z.string(), z.null(), z.undefined()])
    .transform((val, ctx) => {
      if (val === null || val === undefined || (typeof val === "string" && val.trim() === "")) {
        return null;
      }
      const res = parseMoney(val, "Budget");
      if (!res.ok) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: res.error });
        return z.NEVER;
      }
      return String(res.value);
    });
}

// ── Integer-cents arithmetic ────────────────────────────────────────────────

export function toCents(value: number | string | { toString(): string }): number {
  const num = typeof value === "number" ? value : Number(value.toString());
  return Math.round(num * 100);
}

export function fromCents(cents: number): number {
  return Math.round(cents) / 100;
}

export function sumMoney(values: Array<number | string | { toString(): string }>): number {
  return fromCents(values.reduce<number>((acc, v) => acc + toCents(v), 0));
}

/** Format an amount for display; shows paise only when present. */
export function formatMoney(
  value: number | string | { toString(): string } | null | undefined,
  currency = "INR"
): string {
  if (value === null || value === undefined) return "—";
  const num = typeof value === "number" ? value : Number(value.toString());
  if (!Number.isFinite(num)) return "—";
  const hasPaise = Math.abs(num * 100 - Math.round(num) * 100) > 0.5;
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currency} ${num.toFixed(hasPaise ? 2 : 0)}`;
  }
}
