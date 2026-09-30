// lib/db/queries/transactions.ts
// Database queries for transactions and payment evidence.

import { db } from "@/lib/db/client";

export async function getAllTransactions(filters?: {
  paymentStatus?: string;
  partnerId?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}) {
  try {
    const where: Record<string, unknown> = {};
    if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters?.partnerId) {
      where.partnerId = filters.partnerId;
    }

    const pageSize = filters?.pageSize || filters?.limit || 25;
    const page = filters?.page || 1;
    const skip = (page - 1) * pageSize;

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
      skip,
      take: pageSize,
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

export async function getCustomerTransactions(
  userId: string,
  email: string,
  options?: { page?: number; pageSize?: number }
) {
  try {
    const normalizedEmail = email.toLowerCase().trim();

    // Link any legacy unlinked transactions to the stable user identity (Issue 43)
    if (normalizedEmail) {
      await db.transaction.updateMany({
        where: { customerEmail: normalizedEmail, customerId: null },
        data: { customerId: userId },
      }).catch(() => null);
    }

    const page = options?.page || 1;
    const pageSize = options?.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const transactions = await db.transaction.findMany({
      where: { customerId: userId },
      include: {
        solution: {
          select: { id: true, title: true, slug: true },
        },
        partner: {
          select: {
            id: true,
            displayName: true,
            email: true,
            whatsappNumber: true,
            showEmail: true,
            showWhatsapp: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    });

    return transactions.map((tx: any) => ({
      ...tx,
      partner: tx.partner
        ? {
            ...tx.partner,
            email: tx.partner.showEmail ? tx.partner.email : null,
            whatsappNumber: tx.partner.showWhatsapp ? tx.partner.whatsappNumber : null,
          }
        : null,
    }));
  } catch (error) {
    console.warn("Failed to get customer transactions:", error);
    return [];
  }
}
