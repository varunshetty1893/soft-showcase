// lib/db/queries/customer.ts
// Server-side database query helpers for the customer area.
// Server-side only — never import in client components.

import { db } from "@/lib/db/client";

// ─── Inquiries ────────────────────────────────────────────────────────────────

/**
 * Fetch all inquiries submitted by a specific user.
 * Automatically links any unlinked legacy guest inquiries matching the user's email to customerId.
 */
export async function getCustomerInquiries(
  userId: string,
  email?: string | null,
  options?: { page?: number; pageSize?: number }
) {
  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    // Link unlinked past inquiries submitted before account creation (Issue 43)
    await db.inquiry.updateMany({
      where: { email: normalizedEmail, customerId: null },
      data: { customerId: userId },
    }).catch(() => null);
  }

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
 * Fetch custom project requests for a customer with pagination.
 */
export async function getCustomerRequests(
  email: string,
  options?: { page?: number; pageSize?: number }
) {
  const page = options?.page || 1;
  const pageSize = options?.pageSize || 50;
  const skip = (page - 1) * pageSize;

  return db.customProjectRequest.findMany({
    where: { email: { equals: email.trim().toLowerCase(), mode: "insensitive" } },
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
  });
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
