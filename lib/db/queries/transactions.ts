// lib/db/queries/transactions.ts
// Database queries for transactions and payment evidence.

import { db } from "@/lib/db/client";

export async function getAllTransactions(filters?: {
  paymentStatus?: string;
  partnerId?: string;
  limit?: number;
}) {
  try {
    const where: Record<string, unknown> = {};
    if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters?.partnerId) {
      where.partnerId = filters.partnerId;
    }

    return await db.transaction.findMany({
      where,
      include: {
        partner: {
          select: { id: true, displayName: true, email: true, whatsappNumber: true },
        },
        solution: {
          select: { id: true, title: true, slug: true, price: true },
        },
        customer: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: filters?.limit || 100,
    });
  } catch (error) {
    console.warn("Failed to get all transactions:", error);
    return [];
  }
}

export async function getTransactionById(id: string) {
  try {
    return await db.transaction.findUnique({
      where: { id },
      include: {
        partner: true,
        solution: true,
        customer: true,
        enquiry: true,
      },
    });
  } catch (error) {
    console.warn("Failed to get transaction by id:", error);
    return null;
  }
}

export async function getCustomerTransactions(userId: string, email: string) {
  try {
    return await db.transaction.findMany({
      where: {
        OR: [
          { customerId: userId },
          { customerEmail: email.toLowerCase() },
        ],
      },
      include: {
        solution: {
          select: { id: true, title: true, slug: true },
        },
        partner: {
          select: { id: true, displayName: true, email: true, whatsappNumber: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("Failed to get customer transactions:", error);
    return [];
  }
}
