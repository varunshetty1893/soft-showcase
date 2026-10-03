// lib/db/queries/customer.ts
// Server-side database query helpers for the customer area.
// Server-side only — never import in client components.

import { db } from "@/lib/db/client";

// ─── Verified Record Linking ──────────────────────────────────────────────────

/**
 * Links unlinked past guest inquiries, custom requests, and transactions to a verified customer account.
 * Called explicitly after email verification or registration (not during read queries).
 */
export async function linkVerifiedUserRecords(
  userId: string,
  email: string
): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized || !userId) return;

  await Promise.all([
    db.inquiry.updateMany({
      where: { email: normalized, customerId: null },
      data: { customerId: userId },
    }),
    (db.customProjectRequest as any).updateMany({
      where: { email: { equals: normalized, mode: "insensitive" }, customerId: null },
      data: { customerId: userId, linkedAt: new Date() },
    }),
    db.transaction.updateMany({
      where: { customerEmail: normalized, customerId: null },
      data: { customerId: userId },
    }),
  ]).catch((err) => {
    console.warn("[linkVerifiedUserRecords] Failed to link records:", err);
  });
}

// ─── Inquiries ────────────────────────────────────────────────────────────────

/**
 * Fetch all inquiries submitted by a specific user.
 * Strictly scoped by customerId without read-time auto-linking.
 */
export async function getCustomerInquiries(
  userId: string,
  emailOrOptions?: string | null | { page?: number; pageSize?: number },
  options?: { page?: number; pageSize?: number }
) {
  const opts =
    typeof emailOrOptions === "object" && emailOrOptions !== null
      ? emailOrOptions
      : options;

  const page = opts?.page || 1;
  const pageSize = opts?.pageSize || 50;
  const skip = (page - 1) * pageSize;

  return db.inquiry.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      message: true,
      contactMethod: true,
      status: true,
      createdAt: true,
      project: {
        select: {
          id: true,
          title: true,
          slug: true,
          priceMode: true,
          price: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, altText: true },
          },
        },
      },
      provider: {
        select: {
          id: true,
          displayName: true,
        },
      },
    },
  });
}

// ─── Custom Project Requests ──────────────────────────────────────────────────

/**
 * Fetch custom project requests for a customer with pagination.
 * Scoped by customerId (or email if an email address is provided).
 */
export interface CustomerProjectRequestItem {
  id: string;
  projectTitle: string;
  category: string | null;
  technologyPreferences: string[];
  description: string;
  requiredFeatures: string;
  status: any;
  budget: string | null;
  deadline: string | null;
  createdAt: Date;
}

export async function getCustomerRequests(
  identifier: string,
  options?: { page?: number; pageSize?: number }
): Promise<CustomerProjectRequestItem[]> {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const isEmail = identifier.includes("@");
  const where = isEmail
    ? { email: { equals: identifier.trim().toLowerCase(), mode: "insensitive" as const } }
    : { customerId: identifier };

  return (db.customProjectRequest as any).findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    select: {
      id: true,
      projectTitle: true,
      category: true,
      technologyPreferences: true,
      description: true,
      requiredFeatures: true,
      status: true,
      budget: true,
      deadline: true,
      createdAt: true,
    },
  }) as Promise<CustomerProjectRequestItem[]>;
}

// ─── Customer Profile & Stats ─────────────────────────────────────────────────

/**
 * Fetch user details for the customer profile page.
 */
export async function getCustomerProfile(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      whatsapp: true,
      contactEmail: true,
      image: true,
      isAdmin: true,
      createdAt: true,
    },
  });
}

/**
 * Get summary counts for the customer area badges and profile overview.
 */
export async function getCustomerStats(userId: string, email: string) {
  const [inquiryCount, requestCount] = await Promise.all([
    db.inquiry.count({
      where: {
        OR: [{ customerId: userId }, { email: email.toLowerCase() }],
      },
    }),
    db.customProjectRequest.count({
      where: { email: { equals: email, mode: "insensitive" } },
    }),
  ]);

  return { inquiryCount, requestCount };
}
