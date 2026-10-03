// lib/db/queries/support.ts
// Database queries for Support Tickets and Message Threads.

import { db } from "@/lib/db/client";

export async function getAllSupportTickets(filters?: {
  status?: string;
  requesterRole?: string;
  limit?: number;
  page?: number;
  pageSize?: number;
}) {
  try {
    const where: Record<string, unknown> = {};
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.requesterRole && filters.requesterRole !== "ALL") {
      where.requesterRole = filters.requesterRole;
    }

    const pageSize = filters?.pageSize || filters?.limit || 50;
    const page = filters?.page || 1;
    const skip = (page - 1) * pageSize;

    return await db.supportTicket.findMany({
      where,
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    });
  } catch (error) {
    console.warn("Failed to get all support tickets:", error);
    return [];
  }
}

export async function getAdminSupportTicketsPaginated(filters?: {
  status?: string;
  requesterRole?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  try {
    const where: any = {};
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.requesterRole && filters.requesterRole !== "ALL") {
      where.requesterRole = filters.requesterRole;
    }
    if (filters?.search && filters.search.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { ticketNumber: { contains: q, mode: "insensitive" } },
        { subject: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { category: { contains: q, mode: "insensitive" } },
        { requester: { name: { contains: q, mode: "insensitive" } } },
        { requester: { email: { contains: q, mode: "insensitive" } } },
      ];
    }

    const pageSize = filters?.pageSize || 20;
    const page = filters?.page || 1;
    const skip = (page - 1) * pageSize;

    const [tickets, total] = await Promise.all([
      db.supportTicket.findMany({
        where,
        include: {
          requester: {
            select: { id: true, name: true, email: true, role: true },
          },
          _count: {
            select: { messages: true },
          },
        },
        orderBy: { updatedAt: "desc" },
        skip,
        take: pageSize,
      }),
      db.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      total,
      totalPages: Math.ceil(total / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.warn("Failed to get admin support tickets paginated:", error);
    return { tickets: [], total: 0, totalPages: 1, currentPage: 1 };
  }
}

export async function getSupportTicketById(id: string) {
  try {
    return await db.supportTicket.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true },
        },
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  } catch (error) {
    console.warn("Failed to get support ticket by id:", error);
    return null;
  }
}

export async function getUserSupportTickets(
  userId: string,
  options?: { page?: number; pageSize?: number }
) {
  try {
    const pageSize = options?.pageSize || 50;
    const page = options?.page || 1;
    const skip = (page - 1) * pageSize;

    return await db.supportTicket.findMany({
      where: { requesterId: userId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: pageSize,
    });
  } catch (error) {
    console.warn("Failed to get user support tickets:", error);
    return [];
  }
}
