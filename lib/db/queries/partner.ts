// lib/db/queries/partner.ts
// Database queries for Solution Partner Portal.

import { db, ensureAdditiveSchema } from "@/lib/db/client";

export async function getPartnerProfileByUserId(userId: string) {
  try {
    await ensureAdditiveSchema();
    return await db.projectProvider.findFirst({
      where: {
        OR: [{ userId }, { id: userId }],
      },
    });
  } catch (error) {
    console.warn("Failed to get partner profile by userId:", error);
    return null;
  }
}

export async function getPartnerProfileById(partnerId: string) {
  try {
    return await db.projectProvider.findUnique({
      where: { id: partnerId },
    });
  } catch (error) {
    console.warn("Failed to get partner profile by id:", error);
    return null;
  }
}

export async function getPartnerDashboardStats(partnerId: string, requesterUserId: string) {
  try {
    await ensureAdditiveSchema();
    const [
      totalSolutions,
      publishedSolutions,
      draftSolutions,
      totalInquiries,
      newInquiries,
      transactions,
      supportTickets,
    ] = await Promise.all([
      db.project.count({ where: { providerId: partnerId } }),
      db.project.count({ where: { providerId: partnerId, status: "PUBLISHED" } }),
      db.project.count({ where: { providerId: partnerId, status: "DRAFT" } }),
      db.inquiry.count({ where: { providerId: partnerId } }),
      db.inquiry.count({ where: { providerId: partnerId, status: "NEW" } }),
      db.transaction.findMany({
        where: { partnerId },
        orderBy: { createdAt: "desc" },
      }),
      db.supportTicket.findMany({
        where: { requesterId: requesterUserId },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const verifiedTransactions = transactions.filter(
      (t) => t.paymentStatus === "VERIFIED" || t.paymentStatus === "COMPLETED"
    );
    const pendingTransactions = transactions.filter(
      (t) => t.paymentStatus === "PENDING" || t.paymentStatus === "EVIDENCE_SUBMITTED" || t.paymentStatus === "UNDER_REVIEW"
    );

    const totalVolume = verifiedTransactions.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    return {
      solutions: {
        total: totalSolutions,
        published: publishedSolutions,
        draft: draftSolutions,
      },
      inquiries: {
        total: totalInquiries,
        new: newInquiries,
      },
      transactions: {
        total: transactions.length,
        verified: verifiedTransactions.length,
        pending: pendingTransactions.length,
        totalVolume,
        recent: transactions.slice(0, 5),
      },
      supportTickets: {
        total: supportTickets.length,
        open: supportTickets.filter((t) => t.status !== "RESOLVED" && t.status !== "CLOSED").length,
        recent: supportTickets.slice(0, 4),
      },
    };
  } catch (error) {
    console.warn("Failed to get partner dashboard stats:", error);
    return {
      solutions: { total: 0, published: 0, draft: 0 },
      inquiries: { total: 0, new: 0 },
      transactions: { total: 0, verified: 0, pending: 0, totalVolume: 0, recent: [] },
      supportTickets: { total: 0, open: 0, recent: [] },
    };
  }
}

export async function getPartnerProjects(partnerId: string) {
  try {
    await ensureAdditiveSchema();
    return await db.project.findMany({
      where: { providerId: partnerId },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" } },
        _count: { select: { inquiries: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("Failed to get partner projects:", error);
    return [];
  }
}

export async function getPartnerInquiries(partnerId: string) {
  try {
    return await db.inquiry.findMany({
      where: { providerId: partnerId },
      include: {
        project: { select: { id: true, title: true, slug: true, price: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("Failed to get partner inquiries:", error);
    return [];
  }
}

export async function getPartnerTransactions(partnerId: string) {
  try {
    return await db.transaction.findMany({
      where: { partnerId },
      include: {
        solution: { select: { id: true, title: true, slug: true } },
        enquiry: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { sequence: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.warn("Failed to get partner transactions:", error);
    return [];
  }
}
