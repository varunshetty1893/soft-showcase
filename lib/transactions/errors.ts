// lib/transactions/errors.ts
import type { ZodError } from "zod";

/** Turns a zod error into one readable, user-facing sentence. */
export function firstValidationMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return "Validation failed";
  const path = issue.path;
  // payments.1.utrNumber -> "Payment 2: ..."
  if (path[0] === "payments" && typeof path[1] === "number") {
    return `Payment ${path[1] + 1}: ${issue.message}`;
  }
  return issue.message;
}
