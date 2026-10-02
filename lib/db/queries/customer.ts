// lib/db/queries/customer.ts
// Server-side database query helpers for the customer area.
// Server-side only — never import in client components.

import { db } from "@/lib/db/client";

// ─── Inquiries ────────────────────────────────────────────────────────────────

/**
 * Fetch all inquiries submitted by a specific user.
 * Scoped strictly by customerId.
 */
export async function getCustomerInquiries(
  userId: string,
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 50;
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
 * Fetch custom project requests for a customer by customerId with pagination.
 * Scoped strictly to authenticated account customerId (Issue B5).
 */
export async function getCustomerRequests(
  userId: string,
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 50;
  const skip = (page - 1) * pageSize;

  return db.customProjectRequest.findMany({
    where: { customerId: userId },
    orderBy: { createdAt: "desc" },
    skip,
    take: pageSize,
    select: {
      id: true,
      customerId: true,
      linkedAt: true,
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
  });
}

// ─── Customer Profile & Stats ─────────────────────────────────────────────────

/**
 * Fetch user details for the customer profile page including DB-persisted contact details.
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
 * Scoped strictly by customerId.
 */
export async function getCustomerStats(userId: string) {
  const [inquiryCount, requestCount] = await Promise.all([
    db.inquiry.count({
      where: { customerId: userId },
    }),
    db.customProjectRequest.count({
      where: { customerId: userId },
    }),
  ]);

  return { inquiryCount, requestCount };
}

/**
 * Link guest inquiries, custom requests, and transactions to a verified user account.
 * Executed strictly once upon verified sign-in.
 */
export async function linkVerifiedUserRecords(userId: string, email: string) {
  if (!userId || !email) return;
  const normalizedEmail = email.toLowerCase().trim();

  await Promise.all([
    db.inquiry.updateMany({
      where: { email: normalizedEmail, customerId: null },
      data: { customerId: userId },
    }).catch((err) => console.error("[Linking] Failed to link guest inquiries:", err)),
    db.customProjectRequest.updateMany({
      where: { email: { equals: normalizedEmail, mode: "insensitive" }, customerId: null },
      data: { customerId: userId, linkedAt: new Date() },
    }).catch((err) => console.error("[Linking] Failed to link guest custom requests:", err)),
    db.transaction.updateMany({
      where: { customerEmail: normalizedEmail, customerId: null },
      data: { customerId: userId },
    }).catch((err) => console.error("[Linking] Failed to link guest transactions:", err)),
  ]);
}
