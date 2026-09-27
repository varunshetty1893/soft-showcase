// lib/db/queries/inquiries.ts
// Database query helpers for inquiries.

import { db } from "@/lib/db/client";
import type { InquiryStatus } from "@prisma/client";
import { ADMIN_PAGE_SIZE } from "@/config/constants";

/**
 * Create a new inquiry record.
 * The providerId MUST be resolved server-side — never from client input.
 */
export async function createInquiry(data: {
  projectId: string;
  providerId: string; // Always resolved server-side
  customerId?: string;
  name: string;
  email: string;
  whatsapp?: string | null;
  message: string;
  contactMethod: "EMAIL" | "WHATSAPP";
}) {
  return db.inquiry.create({ data });
}

/**
 * Get inquiries for admin listing with pagination.
 */
export async function getAdminInquiries(options: {
  page?: number;
  status?: InquiryStatus;
}) {
  const { page = 1, status } = options;
  const skip = (page - 1) * ADMIN_PAGE_SIZE;

  const where = status ? { status } : {};

  const [inquiries, total] = await Promise.all([
    db.inquiry.findMany({
      where,
      skip,
      take: ADMIN_PAGE_SIZE,
      orderBy: { createdAt: "desc" },
      include: {
        project: { select: { id: true, title: true, slug: true } },
        provider: { select: { id: true, displayName: true, email: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
    }),
    db.inquiry.count({ where }),
  ]);

  return { inquiries, total, totalPages: Math.ceil(total / ADMIN_PAGE_SIZE) };
}

/**
 * Get inquiries for a specific customer (by their userId).
 */
export async function getCustomerInquiries(customerId: string) {
  return db.inquiry.findMany({
    where: { customerId },
    orderBy: { createdAt: "desc" },
    include: {
      project: { select: { id: true, title: true, slug: true } },
      provider: { select: { id: true, displayName: true } },
    },
  });
}

/**
 * Update inquiry notification status (called after email attempt).
 */
export async function updateInquiryNotificationStatus(
  inquiryId: string,
  status: "SENT" | "FAILED"
) {
  return db.inquiry.update({
    where: { id: inquiryId },
    data: { notificationStatus: status },
  });
}

/**
 * Fetch a single inquiry by ID for admin detail view.
 */
export async function getAdminInquiryById(id: string) {
  return db.inquiry.findUnique({
    where: { id },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          images: { where: { isPrimary: true }, take: 1, select: { url: true } },
        },
      },
      provider: true,
      customer: { select: { id: true, name: true, email: true } },
    },
  });
}

/**
 * Update status and admin notes on an inquiry.
 */
export async function updateAdminInquiry(
  id: string,
  data: {
    status?: InquiryStatus;
    adminNotes?: string | null;
  }
) {
  return db.inquiry.update({
    where: { id },
    data,
  });
}
