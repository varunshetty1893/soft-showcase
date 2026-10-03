// lib/db/queries/users.ts
// Database query helpers for admin user management.
// Covers listing, search, role changes, and suspension.

import { db } from "@/lib/db/client";

export type AdminUserRow = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  isAdmin: boolean;
  whatsapp: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: {
    inquiries: number;
    customProjectRequests: number;
    supportTickets: number;
    transactions: number;
    sessions: number;
  };
  partnerProfile: {
    id: string;
    displayName: string;
    applicationStatus: string;
    isActive: boolean;
    removedAt: Date | null;
  } | null;
};

export async function getAllUsers(options?: {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: string;
}): Promise<{ users: AdminUserRow[]; total: number }> {
  const page = options?.page ?? 1;
  const pageSize = options?.pageSize ?? 50;
  const skip = (page - 1) * pageSize;

  const where: any = {};

  if (options?.q) {
    const q = options.q.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { whatsapp: { contains: q, mode: "insensitive" } },
    ];
  }

  if (options?.role && options.role !== "all") {
    if (options.role === "admin") {
      where.isAdmin = true;
    } else {
      where.role = options.role;
      where.isAdmin = false;
    }
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        isAdmin: true,
        whatsapp: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            inquiries: true,
            customProjectRequests: true,
            supportTickets: true,
            transactions: true,
            sessions: true,
          },
        },
        partnerProfile: {
          select: {
            id: true,
            displayName: true,
            applicationStatus: true,
            isActive: true,
            removedAt: true,
          },
        },
      },
    }),
    db.user.count({ where }),
  ]);

  return { users: users as AdminUserRow[], total };
}

export async function getUserById(id: string): Promise<AdminUserRow | null> {
  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      isAdmin: true,
      whatsapp: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          inquiries: true,
          customProjectRequests: true,
          supportTickets: true,
          transactions: true,
          sessions: true,
        },
      },
      partnerProfile: {
        select: {
          id: true,
          displayName: true,
          applicationStatus: true,
          isActive: true,
          removedAt: true,
        },
      },
    },
  });
  return user as AdminUserRow | null;
}
