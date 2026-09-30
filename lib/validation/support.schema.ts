// lib/validation/support.schema.ts
// Zod schemas for Support Tickets and Ticket Messages

import { z } from "zod";

export const CreateTicketSchema = z.object({
  subject: z.string().trim().min(3, "Subject must be at least 3 characters").max(120),
  category: z.string().trim().min(2, "Please select a valid category").max(50),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
  description: z.string().trim().min(10, "Please describe your question or issue in detail").max(5000),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;

const ALLOWED_ATTACHMENT_HOSTS = [
  "res.cloudinary.com",
  "images.unsplash.com",
  "raw.githubusercontent.com",
  "picsum.photos",
  "avatars.githubusercontent.com",
];

function isValidAttachmentUrl(val: string): boolean {
  if (!val) return true;
  if (val.startsWith("/uploads/")) return true;
  try {
    const url = new URL(val);
    if (url.protocol !== "https:") return false;
    return ALLOWED_ATTACHMENT_HOSTS.some(
      (host) => url.hostname === host || url.hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
}

export const CreateMessageSchema = z.object({
  message: z.string().trim().min(1, "Message cannot be empty").max(5000),
  attachmentUrl: z
    .string()
    .trim()
    .max(1000)
    .refine(isValidAttachmentUrl, "Attachment URL must be a valid secure upload from an approved host")
    .optional()
    .nullable()
    .or(z.literal("")),
  attachmentName: z.string().trim().max(100).optional().nullable().or(z.literal("")),
});

export type CreateMessageInput = z.infer<typeof CreateMessageSchema>;

export const UpdateTicketStatusSchema = z.object({
  status: z.enum([
    "OPEN",
    "IN_PROGRESS",
    "WAITING_CUSTOMER",
    "WAITING_ADMIN",
    "RESOLVED",
    "CLOSED",
  ]),
  adminNotes: z.string().trim().max(2000).optional().nullable(),
  assignedAdminId: z.string().trim().optional().nullable(),
});

export type UpdateTicketStatusInput = z.infer<typeof UpdateTicketStatusSchema>;
