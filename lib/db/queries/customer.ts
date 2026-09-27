// lib/db/queries/customer.ts
// Server-side database query helpers for the customer area.
// Server-side only — never import in client components.

import { db } from "@/lib/db/client";

// ─── Inquiries ────────────────────────────────────────────────────────────────

/**
 * Fetch all inquiries submitted by a specific user.
 * Matches by customerId (if logged in at submission) OR by email.
 */
export async function getCustomerInquiries(userId: string, email?: string | null) {
  const whereClause = email
    ? {
        OR: [{ customerId: userId }, { email: email.toLowerCase() }],
      }
    : { customerId: userId };

  return db.inquiry.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
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
 * Fetch all custom project requests submitted with a specific email address.
 * The schema has no userId on CustomProjectRequest, so we match by email.
 */
export async function getCustomerRequests(email: string) {
  return db.customProjectRequest.findMany({
    where: { email: { equals: email, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
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
