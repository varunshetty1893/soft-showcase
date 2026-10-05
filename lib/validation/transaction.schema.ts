// lib/validation/transaction.schema.ts
// Zod schemas for recording transactions, submitting payment evidence, and admin verification.

import { z } from "zod";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";
import { moneySchema, optionalMoneySchema } from "@/lib/utils/money";
import {
  MAX_ACTIVE_PAYMENTS,
  PAYMENT_METHODS,
  normalizePaymentMethod,
  validateUtrForMethod,
} from "@/lib/transactions/payments";

// One customer payment (installment). Cash payments never carry a UTR.
export const PaymentInputSchema = z
  .object({
    amount: moneySchema("Payment amount"),
    paymentMethod: z.preprocess(
      (v) => (v === undefined || v === null || v === "" ? "UPI" : normalizePaymentMethod(v)),
      z.enum(PAYMENT_METHODS)
    ),
    utrNumber: z.string().trim().max(100, "UTR is too long").optional().nullable().or(z.literal("")),
    evidenceUrl: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  })
  .superRefine((val, ctx) => {
    const check = validateUtrForMethod(val.paymentMethod, val.utrNumber);
    if (!check.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: check.error, path: ["utrNumber"] });
    }
  })
  .transform((val) => {
    const check = validateUtrForMethod(val.paymentMethod, val.utrNumber);
    return {
      amount: val.amount,
      paymentMethod: val.paymentMethod,
      utrNumber: check.ok ? check.utr : null,
      evidenceUrl: val.evidenceUrl ? val.evidenceUrl : null,
    };
  });

export type PaymentInput = z.infer<typeof PaymentInputSchema>;

export const CreateTransactionSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(100),
  customerEmail: z.string().trim().toLowerCase().email("Valid customer email is required"),
  customerWhatsapp: z
    .string()
    .trim()
    .max(25)
    .refine(
      (val) => !val || isValidPhone(val),
      "Please provide a valid phone number with country code"
    )
    .transform((val) => (val ? normalizeToE164(val) ?? val : val))
    .optional()
    .nullable()
    .or(z.literal("")),
  solutionId: z.string().trim().optional().nullable().or(z.literal("")),
  enquiryId: z.string().trim().optional().nullable().or(z.literal("")),
  // Total deal amount. Optional: when omitted the deal is treated as fully paid by the
  // payments submitted. When present, payments may add up to less (installments).
  agreedAmount: optionalMoneySchema("Total deal amount"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD"]).default("INR"),
  payments: z
    .array(PaymentInputSchema)
    .min(1, "Add at least one payment")
    .max(MAX_ACTIVE_PAYMENTS, `A transaction can have at most ${MAX_ACTIVE_PAYMENTS} payments`),
  paymentEvidenceNotes: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  projectType: z.enum([
    "EXISTING_SOLUTION",
    "CUSTOMIZED_EXISTING_SOLUTION",
    "NEW_SOLUTION_FOR_CUSTOMER",
  ]).default("EXISTING_SOLUTION"),
  description: z.string().trim().max(1000).optional().nullable().or(z.literal("")),
  deliveryStatus: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "DELIVERED",
    "COMPLETED",
  ]).default("PENDING"),
});

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>;

// Adding more payments to an existing transaction
export const AddPaymentsSchema = z.object({
  payments: z
    .array(PaymentInputSchema)
    .min(1, "Add at least one payment")
    .max(MAX_ACTIVE_PAYMENTS, `A transaction can have at most ${MAX_ACTIVE_PAYMENTS} payments`),
});

export type AddPaymentsInput = z.infer<typeof AddPaymentsSchema>;

// Admin verifies / rejects a single payment
export const ReviewPaymentSchema = z.object({
  action: z.enum(["VERIFY", "REJECT"]),
  reason: z.string().trim().max(500).optional().nullable(),
});

export type ReviewPaymentInput = z.infer<typeof ReviewPaymentSchema>;

export const UpdateTransactionStatusSchema = z.object({
  paymentStatus: z.enum([
    "PENDING",
    "EVIDENCE_SUBMITTED",
    "UNDER_REVIEW",
    "VERIFIED",
    "REJECTED",
    "REFUNDED",
    "DISPUTED",
    "COMPLETED",
  ]),
  deliveryStatus: z.enum([
    "PENDING",
    "IN_PROGRESS",
    "DELIVERED",
    "COMPLETED",
  ]).optional(),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
});

export type UpdateTransactionStatusInput = z.infer<typeof UpdateTransactionStatusSchema>;
