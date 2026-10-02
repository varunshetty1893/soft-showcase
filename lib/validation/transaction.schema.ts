// lib/validation/transaction.schema.ts
// Zod schemas for recording transactions, submitting payment evidence, and admin verification.

import { z } from "zod";
import { isValidPhone, normalizeToE164 } from "@/lib/utils/phone";

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
  amount: z.coerce
    .number()
    .positive("Amount must be greater than zero")
    .min(1, "Amount must be at least 1")
    .max(50_000_000, "Amount exceeds system limit"),
  currency: z.enum(["INR", "USD", "EUR", "GBP", "AED", "SGD"]).default("INR"),
  paymentMethod: z
    .enum(["UPI", "BANK_TRANSFER", "NEFT_RTGS", "IMPS", "CREDIT_DEBIT_CARD", "PAYPAL", "STRIPE", "OTHER"])
    .default("UPI"),
  utrNumber: z
    .string()
    .trim()
    .min(4, "UTR / Transaction ID must be at least 4 characters")
    .max(64, "UTR cannot exceed 64 characters")
    .regex(/^[A-Za-z0-9_\-\.\/]+$/, "UTR contains invalid characters"),
  paymentEvidenceUrl: z
    .string()
    .trim()
    .url("Please provide a valid URL")
    .max(1000)
    .refine((val) => val.startsWith("https://"), "Payment evidence URL must use secure HTTPS")
    .optional()
    .nullable()
    .or(z.literal("")),
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
