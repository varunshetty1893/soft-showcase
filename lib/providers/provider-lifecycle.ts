// lib/providers/provider-lifecycle.ts
// Server-side business logic for Provider Management (Phase 2A & 2B):
// - State-aware toggle button resolution
// - Compare-and-set Activate / Deactivate with self-lockout protection and audit logging
// - Soft Remove Provider (removedAt, removedById, removalReason, session invalidation, optional escaped email)
// - Restore Provider (clears soft removal fields, audit PROVIDER_RESTORED)
// - Permanent Delete Provider (only when removed and zero inquiries/transactions/tickets, atomic transaction, snapshot audit PROVIDER_DELETED)

import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { writeAuditLog, createAuditLogTx } from "@/lib/db/audit";
import { sendPartnerRemovedEmail } from "@/lib/email/email-service";
export {
  getProviderStatusButtonSpec,
  type ProviderLifecycleState,
  type ProviderStatusButtonSpec,
  type ProviderLikeForState,
} from "@/lib/providers/provider-state";

/**
 * Compare-and-set toggle between Active & Approved and Inactive (Phase 2A).
 * Re-checks the expected current state inside updateMany so double-clicks or two admins
 * cannot flip it twice.
 */
export async function toggleProviderActiveState(params: {
  providerId: string;
  targetActive: boolean;
  reason?: string;
  actorId: string;
}): Promise<{
  ok: boolean;
  conflict?: boolean;
  selfBlocked?: boolean;
  notFound?: boolean;
  message: string;
  provider?: any;
}> {
  await ensureAdditiveSchema();
  const { providerId, targetActive, reason, actorId } = params;
  const trimmedReason = reason?.trim().slice(0, 300) || undefined;

  const existing = await db.projectProvider.findUnique({
    where: { id: providerId },
  });

  if (!existing) {
    return { ok: false, notFound: true, message: "Provider not found." };
  }

  if (existing.userId && existing.userId === actorId) {
    return {
      ok: false,
      selfBlocked: true,
      message: "You cannot deactivate or toggle the provider linked to your own admin account.",
    };
  }

  if ((existing as any).removedAt) {
    return {
      ok: false,
      conflict: true,
      message: `Provider "${existing.displayName}" was removed. Refreshing list.`,
    };
  }

  // Expected state check (compare-and-set)
  if (targetActive) {
    // Expect currently inactive
    if (existing.isActive === true && existing.applicationStatus === "approved") {
      return {
        ok: false,
        conflict: true,
        message: `Provider "${existing.displayName}" is already active. State was updated by another request.`,
      };
    }

    const casResult = await db.projectProvider.updateMany({
      where: {
        id: providerId,
        isActive: existing.isActive,
        applicationStatus: existing.applicationStatus,
        removedAt: null,
      },
      data: {
        isActive: true,
        applicationStatus: "approved",
        verificationStatus: "verified",
      },
    });

    if (casResult.count === 0) {
      return {
        ok: false,
        conflict: true,
        message: `Provider "${existing.displayName}" state already changed. Please refresh.`,
      };
    }

    if (existing.userId) {
      await db.user
        .update({
          where: { id: existing.userId },
          data: { role: "solution_partner", emailVerified: new Date() },
        })
        .catch(() => null);
    }

    const updated = await db.projectProvider.findUnique({ where: { id: providerId } });

    await writeAuditLog({
      actorId,
      action: "PARTNER_ACTIVATED",
      entityType: "ProjectProvider",
      entityId: providerId,
      metadata: {
        displayName: existing.displayName,
        previousState: {
          isActive: existing.isActive,
          applicationStatus: existing.applicationStatus,
        },
        newState: { isActive: true, applicationStatus: "approved" },
        reason: trimmedReason ?? null,
      },
    });

    return {
      ok: true,
      message: `Partner "${existing.displayName}" has been activated.`,
      provider: updated,
    };
  } else {
    // Deactivating: expect currently active & approved
    if (existing.isActive === false || existing.applicationStatus === "deactivated") {
      return {
        ok: false,
        conflict: true,
        message: `Provider "${existing.displayName}" is already inactive. State was updated by another request.`,
      };
    }

    const casResult = await db.projectProvider.updateMany({
      where: {
        id: providerId,
        isActive: true,
        applicationStatus: existing.applicationStatus,
        removedAt: null,
      },
      data: {
        isActive: false,
        applicationStatus: "deactivated",
      },
    });

    if (casResult.count === 0) {
      return {
        ok: false,
        conflict: true,
        message: `Provider "${existing.displayName}" state already changed. Please refresh.`,
      };
    }

    const updated = await db.projectProvider.findUnique({ where: { id: providerId } });

    await writeAuditLog({
      actorId,
      action: "PARTNER_DEACTIVATED",
      entityType: "ProjectProvider",
      entityId: providerId,
      metadata: {
        displayName: existing.displayName,
        previousState: {
          isActive: existing.isActive,
          applicationStatus: existing.applicationStatus,
        },
        newState: { isActive: false, applicationStatus: "deactivated" },
        reason: trimmedReason ?? null,
      },
    });

    return {
      ok: true,
      message: `Partner "${existing.displayName}" has been deactivated.`,
      provider: updated,
    };
  }
}

/**
 * Soft-remove a provider (Phase 2B).
 * - Sets removedAt, removedById, removalReason, isActive = false
 * - Increments User.tokenVersion to invalidate sessions, sets User.role = "customer" (never touches User.isAdmin)
 * - Optionally sends escaped email notification
 * - Logs PROVIDER_REMOVED with reason and impact counts
 */
export async function removeProvider(params: {
  providerId: string;
  reason: string;
  confirmName: string;
  notifyPartner?: boolean;
  actorId: string;
}): Promise<{
  ok: boolean;
  status: number;
  message: string;
  provider?: any;
}> {
  await ensureAdditiveSchema();
  const { providerId, reason, confirmName, notifyPartner = false, actorId } = params;

  const cleanReason = (reason || "").trim() || "Removed by administrator";

  const existing = await db.projectProvider.findUnique({
    where: { id: providerId },
    include: {
      _count: {
        select: {
          projects: true,
          inquiries: true,
          transactions: true,
        },
      },
    },
  });

  if (!existing) {
    return { ok: false, status: 404, message: "Provider not found." };
  }

  if (existing.userId && existing.userId === actorId) {
    return {
      ok: false,
      status: 403,
      message: "Cannot remove a provider linked to your own admin user account.",
    };
  }

  if ((existing as any).removedAt) {
    return {
      ok: false,
      status: 409,
      message: `Provider "${existing.displayName}" has already been removed.`,
    };
  }

  // Confirmation name is optional; if provided, validate case-insensitively against name or email
  if (confirmName && confirmName.trim()) {
    const typedLower = confirmName.trim().toLowerCase();
    const nameLower = existing.displayName.trim().toLowerCase();
    const emailLower = (existing.email || "").trim().toLowerCase();

    if (typedLower !== nameLower && (!emailLower || typedLower !== emailLower)) {
      return {
        ok: false,
        status: 400,
        message: `Confirmation must match provider name "${existing.displayName}" or email "${existing.email}".`,
      };
    }
  }

  let supportTicketsCount = 0;
  if (existing.userId) {
    try {
      supportTicketsCount = await db.supportTicket.count({
        where: { requesterId: existing.userId },
      });
    } catch {
      supportTicketsCount = 0;
    }
  }

  const impactCounts = {
    projects: existing._count?.projects ?? 0,
    inquiries: existing._count?.inquiries ?? 0,
    transactions: existing._count?.transactions ?? 0,
    supportTickets: supportTicketsCount,
  };

  const now = new Date();

  // Atomically: soft-remove the provider, move every published solution to DRAFT and
  // record the audit entry. Drafting (not just hiding) matters: otherwise restoring the
  // provider would silently re-publish every previously live solution without review.
  const { updated, draftedProjectIds } = await db.$transaction(async (tx) => {
    const publishedProjects = await tx.project.findMany({
      where: { providerId, status: "PUBLISHED" },
      select: { id: true },
    });
    const draftedIds = publishedProjects.map((p: { id: string }) => p.id);

    const provider = await tx.projectProvider.update({
      where: { id: providerId },
      data: {
        isActive: false,
        removedAt: now,
        removedById: actorId,
        removalReason: cleanReason.slice(0, 500),
      },
    });

    if (draftedIds.length > 0) {
      await tx.project.updateMany({
        where: { id: { in: draftedIds } },
        data: { status: "DRAFT" },
      });
    }

    await createAuditLogTx(tx, {
      userId: actorId,
      action: "PROVIDER_REMOVED",
      entityType: "ProjectProvider",
      entityId: providerId,
      details: {
        displayName: existing.displayName,
        email: existing.email,
        reason: cleanReason,
        notifyPartner,
        impactCounts,
        draftedProjectIds: draftedIds,
      },
    });

    return { updated: provider, draftedProjectIds: draftedIds };
  });

  // Invalidate partner sessions by incrementing tokenVersion and revert role to customer.
  // CRITICAL: Never touch User.isAdmin!
  if (existing.userId) {
    await db.user
      .update({
        where: { id: existing.userId },
        data: {
          role: "customer",
          tokenVersion: { increment: 1 },
        },
      })
      .catch(() => null);

    await db.session
      .deleteMany({
        where: { userId: existing.userId },
      })
      .catch(() => null);
  }

  if (notifyPartner && existing.email) {
    await sendPartnerRemovedEmail({
      to: existing.email,
      partnerName: existing.displayName,
      reason: cleanReason,
    }).catch((err) => console.error("[removeProvider] Email notification error:", err));
  }

  return {
    ok: true,
    status: 200,
    message:
      draftedProjectIds.length > 0
        ? `Provider "${existing.displayName}" has been removed. ${draftedProjectIds.length} published solution(s) were moved to draft.`
        : `Provider "${existing.displayName}" has been removed.`,
    provider: updated,
  };
}

/**
 * Restore a soft-removed provider (Phase 2B).
 * Clears removedAt, removedById, removalReason, restores active/approved state, and logs PROVIDER_RESTORED.
 */
export async function restoreProvider(params: {
  providerId: string;
  actorId: string;
}): Promise<{
  ok: boolean;
  status: number;
  message: string;
  provider?: any;
}> {
  await ensureAdditiveSchema();
  const { providerId, actorId } = params;

  const existing = await db.projectProvider.findUnique({
    where: { id: providerId },
  });

  if (!existing) {
    return { ok: false, status: 404, message: "Provider not found." };
  }

  if (!(existing as any).removedAt) {
    return {
      ok: false,
      status: 409,
      message: `Provider "${existing.displayName}" is not in the Removed state.`,
    };
  }

  const updated = await db.projectProvider.update({
    where: { id: providerId },
    data: {
      removedAt: null,
      removedById: null,
      removalReason: null,
      isActive: true,
      applicationStatus: "approved",
    },
  });

  if (existing.userId) {
    await db.user
      .update({
        where: { id: existing.userId },
        data: { role: "solution_partner" },
      })
      .catch(() => null);
  }

  await writeAuditLog({
    actorId,
    action: "PROVIDER_RESTORED",
    entityType: "ProjectProvider",
    entityId: providerId,
    metadata: {
      displayName: existing.displayName,
      email: existing.email,
      previousRemovalReason: (existing as any).removalReason ?? null,
    },
  });

  return {
    ok: true,
    status: 200,
    message: `Provider "${existing.displayName}" has been restored.`,
    provider: updated,
  };
}

/**
 * Permanently delete a soft-removed provider (Phase 2B).
 * Allowed ONLY when:
 * - Provider is currently in the Removed state (removedAt != null)
 * - Provider has 0 inquiries, 0 transactions, and 0 support tickets
 * - Not linked to acting admin's own user
 * - confirmName matches displayName
 * Runs in one transaction (projects, images metadata, provider) and writes PROVIDER_DELETED with snapshot.
 */
export async function permanentlyDeleteProvider(params: {
  providerId: string;
  confirmName: string;
  actorId: string;
}): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  await ensureAdditiveSchema();
  const { providerId, confirmName, actorId } = params;

  const existing = await db.projectProvider.findUnique({
    where: { id: providerId },
    include: {
      projects: { select: { id: true, title: true, slug: true } },
      _count: {
        select: {
          projects: true,
          inquiries: true,
          transactions: true,
        },
      },
    },
  });

  if (!existing) {
    return { ok: false, status: 404, message: "Provider not found." };
  }

  if (existing.userId && existing.userId === actorId) {
    return {
      ok: false,
      status: 403,
      message: "Cannot delete a provider linked to your own admin user account.",
    };
  }

  if (!(existing as any).removedAt) {
    return {
      ok: false,
      status: 400,
      message: "Permanent delete is only available for providers in the Removed tab.",
    };
  }

  // Irreversible action: the admin MUST type the provider name (or email).
  // A blank confirmation is rejected, matching what the UI asks for.
  const typedLower = (confirmName ?? "").trim().toLowerCase();
  const nameLower = existing.displayName.trim().toLowerCase();
  const emailLower = (existing.email || "").trim().toLowerCase();

  if (!typedLower) {
    return {
      ok: false,
      status: 400,
      message: `Type the provider name "${existing.displayName}" to confirm permanent deletion.`,
    };
  }

  if (typedLower !== nameLower && (!emailLower || typedLower !== emailLower)) {
    return {
      ok: false,
      status: 400,
      message: `Confirmation name must match "${existing.displayName}" or "${existing.email}".`,
    };
  }

  const inquiriesCount = existing._count?.inquiries ?? 0;
  const transactionsCount = existing._count?.transactions ?? 0;
  let supportTicketsCount = 0;
  if (existing.userId) {
    try {
      supportTicketsCount = await db.supportTicket.count({
        where: { requesterId: existing.userId },
      });
    } catch {
      supportTicketsCount = 0;
    }
  }

  if (inquiriesCount > 0 || transactionsCount > 0 || supportTicketsCount > 0) {
    const reasons: string[] = [];
    if (inquiriesCount > 0) reasons.push(`${inquiriesCount} inquiries`);
    if (transactionsCount > 0) reasons.push(`${transactionsCount} transactions`);
    if (supportTicketsCount > 0) reasons.push(`${supportTicketsCount} support tickets`);
    return {
      ok: false,
      status: 409,
      message: `Permanent delete blocked: provider has ${reasons.join(", ")}.`,
    };
  }

  const projectIds = (existing.projects || []).map((p: { id: string }) => p.id);
  const snapshot = {
    providerId: existing.id,
    displayName: existing.displayName,
    email: existing.email,
    userId: existing.userId ?? null,
    projectIds,
    projectCount: projectIds.length,
  };

  // Delete + audit snapshot are one atomic unit: if the audit row cannot be written the
  // whole deletion rolls back, so data is never destroyed without a trail.
  await db.$transaction(async (tx) => {
    if (projectIds.length > 0) {
      await tx.projectImage.deleteMany({
        where: { projectId: { in: projectIds } },
      });
      await tx.project.deleteMany({
        where: { providerId },
      });
    }
    await tx.projectProvider.delete({
      where: { id: providerId },
    });

    await createAuditLogTx(tx, {
      userId: actorId,
      action: "PROVIDER_DELETED",
      entityType: "ProjectProvider",
      entityId: providerId,
      details: snapshot,
    });
  });

  return {
    ok: true,
    status: 200,
    message: `Provider "${snapshot.displayName}" has been permanently deleted.`,
  };
}
