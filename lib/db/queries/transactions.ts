// lib/db/queries/transactions.ts
// Database queries for transactions and payment evidence.import { Prisma, TransactionPaymentStatus } from "@prisma/client";
import { Prisma, TransactionPaymentStatus } from "@prisma/client";

import { db } from "@/lib/db/client";

type AdminTransactionFilters = {
  page?: number;
  pageSize?: number;
  search?: string;
  paymentStatus?: string;
};

export async function getAdminTransactionsPaginated(filters: AdminTransactionFilters = {}) {
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const pageSize = Math.min(100, Math.max(1, Math.floor(filters.pageSize ?? 25)));
  const search = filters.search?.trim();
  const where: Prisma.TransactionWhereInput = {};

  if (
    filters.paymentStatus &&
    filters.paymentStatus !== "ALL" &&
    Object.values(TransactionPaymentStatus).includes(filters.paymentStatus as TransactionPaymentStatus)
  ) {
    where.paymentStatus = filters.paymentStatus as TransactionPaymentStatus;
  }

  if (search) {
    where.OR = [
      { transactionNumber: { contains: search, mode: "insensitive" } },
      { utrNumber: { contains: search, mode: "insensitive" } },
      { customerName: { contains: search, mode: "insensitive" } },
      { customerEmail: { contains: search, mode: "insensitive" } },
      { partner: { is: { OR: [
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ] } } },
      { solution: { is: { title: { contains: search, mode: "insensitive" } } } },
    ];
  }

  const [transactions, total] = await db.$transaction([
    db.transaction.findMany({
      where,
      include: {
        partner: { select: { id: true, displayName: true, email: true, whatsappNumber: true } },
        solution: { select: { id: true, title: true, slug: true, price: true } },
        customer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.transaction.count({ where }),
  ]);

  return { transactions, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}


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
