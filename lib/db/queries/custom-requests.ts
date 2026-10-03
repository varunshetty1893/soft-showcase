// lib/db/queries/custom-requests.ts
// Database query helpers for custom project requests (admin & customer).

import { db } from "@/lib/db/client";
import type { CustomRequestStatus } from "@prisma/client";
import { ADMIN_PAGE_SIZE } from "@/config/constants";

/**
 * Get custom project requests for admin listing with pagination and optional status filter.
 */
export async function getAdminCustomRequests(options: {
  page?: number;
  status?: CustomRequestStatus;
  pageSize?: number;
  search?: string;
}) {
  const { page = 1, status, pageSize = ADMIN_PAGE_SIZE, search } = options;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (status) {
    where.status = status;
  }
  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
      { projectTitle: { contains: q, mode: "insensitive" } },
      { category: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
  }

  const [requests, total] = await Promise.all([
    db.customProjectRequest.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    db.customProjectRequest.count({ where }),
  ]);

  return {
    requests,
    total,
    totalPages: Math.ceil(total / pageSize),
    currentPage: page,
  };
}

/**
 * Fetch a single custom project request by ID for admin detail view.
 */
export async function getAdminCustomRequestById(id: string) {
  return db.customProjectRequest.findUnique({
    where: { id },
  });
}

/**
 * Update status and admin notes on a custom project request.
 */
export async function updateAdminCustomRequest(
  id: string,
  data: {
    status?: CustomRequestStatus;
    adminNotes?: string | null;
  }
) {
  return db.customProjectRequest.update({
    where: { id },
    data,
  });
}
