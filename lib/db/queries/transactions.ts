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

export async function getAdminTransactionsPaginated(filters?: {
  paymentStatus?: string;
  partnerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const where: any = {};
    if (filters?.paymentStatus && filters.paymentStatus !== "ALL") {
      where.paymentStatus = filters.paymentStatus;
    }
    if (filters?.partnerId) {
      where.partnerId = filters.partnerId;
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { transactionNumber: { contains: q, mode: "insensitive" } },
        { utrNumber: { contains: q, mode: "insensitive" } },
        { customerName: { contains: q, mode: "insensitive" } },
        { customerEmail: { contains: q, mode: "insensitive" } },
        { partner: { displayName: { contains: q, mode: "insensitive" } } },
        { partner: { email: { contains: q, mode: "insensitive" } } },
        { solution: { title: { contains: q, mode: "insensitive" } } },
      ];
    }

    const pageSize = filters?.pageSize || 20;
    const page = filters?.page || 1;
    const skip = (page - 1) * pageSize;

    const [transactions, total] = await Promise.all([
      db.transaction.findMany({
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
      }),
      db.transaction.count({ where }),
    ]);

    return {
      transactions,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.warn("Failed to get admin transactions paginated:", error);
    return { transactions: [], total: 0, totalPages: 1, currentPage: 1 };
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
  _email?: string,
  options?: { page?: number; pageSize?: number }
) {
  try {
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
