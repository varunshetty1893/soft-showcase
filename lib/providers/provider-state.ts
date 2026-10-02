// lib/providers/provider-state.ts
// Pure, client-safe state resolver for Provider Management (Phase 2A & 2B).
// Contains no Node.js / Prisma / Nodemailer imports so it can be safely imported in Client Components.

export type ProviderLifecycleState =
  | "ACTIVE_APPROVED"
  | "INACTIVE"
  | "PENDING"
  | "REJECTED"
  | "REMOVED";

export interface ProviderStatusButtonSpec {
  state: ProviderLifecycleState;
  label: "Deactivate" | "Activate" | "Approve / Reject" | "Re-approve" | "Restore";
  style: "outline-danger" | "solid-success" | "pending-actions" | "reapprove" | "outline";
  disabled: boolean;
  disabledReason?: string;
  canRemove: boolean;
  canPermanentDelete: boolean;
  permanentDeleteDisabledReason?: string;
}

export interface ProviderLikeForState {
  id: string;
  displayName: string;
  email: string;
  userId?: string | null;
  isActive: boolean;
  applicationStatus: string;
  removedAt?: Date | string | null;
  _count?: {
    projects?: number;
    inquiries?: number;
    transactions?: number;
    supportTickets?: number;
  };
}

/**
 * Determine the exact state and single status button specification for a provider row (Phase 2A & 2B).
 */
export function getProviderStatusButtonSpec(
  provider: ProviderLikeForState,
  actingAdminUserId?: string | null
): ProviderStatusButtonSpec {
  const isSelfLinked = Boolean(
    actingAdminUserId &&
      (provider.userId === actingAdminUserId || provider.id === `admin-${actingAdminUserId}`)
  );

  const inquiries = provider._count?.inquiries ?? 0;
  const transactions = provider._count?.transactions ?? 0;
  const supportTickets = provider._count?.supportTickets ?? 0;
  const hasProtectedRecords = inquiries > 0 || transactions > 0 || supportTickets > 0;

  let permanentDeleteDisabledReason: string | undefined;
  if (isSelfLinked) {
    permanentDeleteDisabledReason = "Cannot delete a provider linked to your own admin account.";
  } else if (!provider.removedAt) {
    permanentDeleteDisabledReason = "Provider must be removed first before permanent deletion.";
  } else if (hasProtectedRecords) {
    const parts: string[] = [];
    if (inquiries > 0) parts.push(`${inquiries} inquir${inquiries === 1 ? "y" : "ies"}`);
    if (transactions > 0) parts.push(`${transactions} transaction${transactions === 1 ? "" : "s"}`);
    if (supportTickets > 0) parts.push(`${supportTickets} support ticket${supportTickets === 1 ? "" : "s"}`);
    permanentDeleteDisabledReason = `Cannot permanently delete: provider has ${parts.join(", ")}.`;
  }

  if (provider.removedAt) {
    return {
      state: "REMOVED",
      label: "Restore",
      style: "outline",
      disabled: false,
      canRemove: false,
      canPermanentDelete: !hasProtectedRecords && !isSelfLinked,
      permanentDeleteDisabledReason,
    };
  }

  if (provider.applicationStatus === "pending") {
    return {
      state: "PENDING",
      label: "Approve / Reject",
      style: "pending-actions",
      disabled: false,
      canRemove: !isSelfLinked,
      canPermanentDelete: false,
      permanentDeleteDisabledReason,
    };
  }

  if (provider.applicationStatus === "rejected") {
    return {
      state: "REJECTED",
      label: "Re-approve",
      style: "reapprove",
      disabled: false,
      canRemove: !isSelfLinked,
      canPermanentDelete: false,
      permanentDeleteDisabledReason,
    };
  }

  const isActiveAndApproved =
    provider.isActive === true && provider.applicationStatus === "approved";

  if (isActiveAndApproved) {
    return {
      state: "ACTIVE_APPROVED",
      label: "Deactivate",
      style: "outline-danger",
      disabled: isSelfLinked,
      disabledReason: isSelfLinked
        ? "Cannot deactivate the provider linked to your own admin account."
        : undefined,
      canRemove: !isSelfLinked,
      canPermanentDelete: false,
      permanentDeleteDisabledReason,
    };
  }

  return {
    state: "INACTIVE",
    label: "Activate",
    style: "solid-success",
    disabled: isSelfLinked,
    disabledReason: isSelfLinked
      ? "Cannot modify the provider linked to your own admin account."
      : undefined,
    canRemove: !isSelfLinked,
    canPermanentDelete: false,
    permanentDeleteDisabledReason,
  };
}
