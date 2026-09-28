// lib/validation/transaction.schema.ts
// Zod schemas for recording transactions, submitting payment evidence, and admin verification.

import { z } from "zod";

export const CreateTransactionSchema = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(100),
  customerEmail: z.string().trim().toLowerCase().email("Valid customer email is required"),
  customerWhatsapp: z.string().trim().max(20).optional().nullable().or(z.literal("")),
  solutionId: z.string().trim().optional().nullable().or(z.literal("")),
  enquiryId: z.string().trim().optional().nullable().or(z.literal("")),
  amount: z.coerce.number().positive("Amount must be greater than zero"),
  currency: z.string().trim().min(3).max(5).default("INR"),
  paymentMethod: z.string().trim().min(2, "Payment method is required").default("UPI"),
  utrNumber: z.string().trim().min(4, "UTR / Transaction ID is required").max(100),
  paymentEvidenceUrl: z.union([z.string().url("Please provide a valid URL"), z.literal(""), z.null()]).optional(),
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
