// lib/db/queries/support.ts
// Database queries for Support Tickets and Message Threads.

import { db } from "@/lib/db/client";

export async function getAllSupportTickets(filters?: {
  status?: string;
  requesterRole?: string;
  limit?: number;
}) {
  try {
    const where: Record<string, unknown> = {};
    if (filters?.status && filters.status !== "ALL") {
      where.status = filters.status;
    }
    if (filters?.requesterRole && filters.requesterRole !== "ALL") {
      where.requesterRole = filters.requesterRole;
    }

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
      take: filters?.limit || 100,
    });
  } catch (error) {
    console.warn("Failed to get all support tickets:", error);
    return [];
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

export async function getUserSupportTickets(userId: string) {
  try {
    return await db.supportTicket.findMany({
      where: { requesterId: userId },
      include: {
        _count: {
          select: { messages: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.warn("Failed to get user support tickets:", error);
    return [];
  }
}
