// lib/auth/project-permissions.ts
// Enforces ownership boundaries between Platform Administrators and Solution Partners (Phase 3).
//
// Core Rules:
// 1. A project is partner-owned when its provider is linked to a user whose role is "solution_partner"
//    (and not belonging to the acting admin's own user / admin account).
// 2. All other projects (admin-created, imported, or belonging to an admin's own provider)
//    are "admin-managed" and retain full admin editing.
// 3. On partner-owned projects, Admin may ONLY update whitelisted moderation fields:
//    featured (isFeatured), featuredOrder (displayOrder), status (moderationStatus),
//    categoryId (category), moderationNote (reason), requestChanges.
//    Reason (moderationNote) is required when unpublishing (DRAFT) or rejecting (REJECTED).
// 4. Attempting to update any other field (title, descriptions, price, originalPrice, deals/offers,
//    priceMode, technologies, features, demoUrl, images, etc.) throws a 403 ProjectOwnershipError
//    listing the disallowed fields — never silently ignored.
// 5. If an admin placed a moderation hold (moderatedAt != null && status !== "PUBLISHED"),
//    the partner can still edit content, but cannot flip status to PUBLISHED until an admin lifts it.

export type ProjectOwnership = "partner_owned" | "admin_managed";

export interface ProjectOwnershipContext {
  id?: string;
  status?: string | null;
  moderatedAt?: Date | string | null;
  moderatedById?: string | null;
  moderationNote?: string | null;
  providerId?: string | null;
  provider?: {
    id?: string;
    userId?: string | null;
    user?: {
      id?: string;
      role?: string | null;
      isAdmin?: boolean | null;
    } | null;
  } | null;
}

export const ADMIN_EDITABLE_FIELDS_PARTNER_OWNED = new Set<string>([
  "featured",
  "isFeatured",
  "featuredOrder",
  "displayOrder",
  "status",
  "moderationStatus",
  "categoryId",
  "category",
  "moderationNote",
  "reason",
  "requestChanges",
]);

// Backward-compatible alias
export const ADMIN_PARTNER_PROJECT_ALLOWED_FIELDS = ADMIN_EDITABLE_FIELDS_PARTNER_OWNED;

/**
 * Derive project ownership from provider -> user link.
 * Returns "partner_owned" when the project's provider is linked to a non-admin user
 * whose role is "solution_partner"; otherwise "admin_managed".
 */
export function getProjectOwnership(
  project: ProjectOwnershipContext | null | undefined,
  actingAdminUserId?: string | null
): ProjectOwnership {
  if (!project?.provider) return "admin_managed";

  const providerUserId = project.provider.userId || project.provider.user?.id || null;
  if (!providerUserId) return "admin_managed";

  // If the provider belongs to the acting admin themselves, it is admin-managed
  if (actingAdminUserId && providerUserId === actingAdminUserId) {
    return "admin_managed";
  }

  // If the linked user is a platform admin, it is admin-managed
  if (project.provider.user?.isAdmin === true) {
    return "admin_managed";
  }

  // If linked user role is explicitly provided, check role === "solution_partner"
  if (project.provider.user && project.provider.user.role !== undefined) {
    return project.provider.user.role === "solution_partner"
      ? "partner_owned"
      : "admin_managed";
  }

  // Fallback when provider.userId is set and not an admin
  return "partner_owned";
}

/**
 * Boolean helper: true when getProjectOwnership(project) === "partner_owned".
 */
export function isPartnerOwnedProject(
  project: ProjectOwnershipContext | null | undefined,
  actingAdminUserId?: string | null
): boolean {
  return getProjectOwnership(project, actingAdminUserId) === "partner_owned";
}

/**
 * Return the list of disallowed fields in `payload` when an admin updates a partner-owned project.
 */
export function getForbiddenPartnerProjectFields(
  payload: Record<string, unknown>
): string[] {
  if (!payload || typeof payload !== "object") return [];
  const disallowed: string[] = [];

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) continue;
    if (!ADMIN_EDITABLE_FIELDS_PARTNER_OWNED.has(key)) {
      disallowed.push(key);
    }
  }

  return disallowed;
}

export class ProjectOwnershipError extends Error {
  public readonly status: number;
  public readonly code: "FORBIDDEN" | "BAD_REQUEST";
  public readonly disallowedFields: string[];
  public readonly forbiddenFields: string[];

  constructor(
    message: string,
    disallowedFields: string[] = [],
    status: 403 | 400 = 403
  ) {
    super(message);
    this.name = "ProjectOwnershipError";
    this.status = status;
    this.code = status === 403 ? "FORBIDDEN" : "BAD_REQUEST";
    this.disallowedFields = disallowedFields;
    this.forbiddenFields = disallowedFields;
  }
}

/**
 * Enforce Phase 3 policy before any admin project write (edit, bulk, import, featured toggle).
 * - Throws 403 ProjectOwnershipError listing disallowedFields if any non-whitelisted field is present.
 * - Throws 400/403 ProjectOwnershipError if unpublishing (DRAFT) or rejecting (REJECTED) without a reason.
 */
export function assertAdminCanUpdate(
  project: ProjectOwnershipContext | null | undefined,
  patch: Record<string, unknown>,
  actingAdminUserId?: string | null
): void {
  if (!isPartnerOwnedProject(project, actingAdminUserId)) {
    return;
  }

  const disallowed = getForbiddenPartnerProjectFields(patch);
  if (disallowed.length > 0) {
    throw new ProjectOwnershipError(
      `Admin cannot modify partner-owned content fields: ${disallowed.join(", ")}.`,
      disallowed,
      403
    );
  }

  // Check if unpublishing or rejecting requires a reason
  const rawNextStatus = (patch.status ?? patch.moderationStatus) as string | undefined;
  const isRequestingChanges = Boolean(patch.requestChanges);
  const note = String(patch.moderationNote ?? patch.reason ?? "").trim();

  if (rawNextStatus) {
    const normalized = rawNextStatus.toUpperCase();
    const isUnpublishOrReject =
      normalized === "DRAFT" ||
      normalized === "UNPUBLISHED" ||
      normalized === "REJECTED";

    if (isUnpublishOrReject && !note) {
      throw new ProjectOwnershipError(
        "A moderation reason is required when unpublishing or rejecting a partner-owned project.",
        ["moderationNote"],
        400
      );
    }
  }

  if (isRequestingChanges && !note) {
    throw new ProjectOwnershipError(
      "A moderation note is required when requesting changes from a partner.",
      ["moderationNote"],
      400
    );
  }
}

// Backward-compatible alias
export const assertAdminCanModifyProject = assertAdminCanUpdate;

/**
 * Determine whether a project currently has an active admin moderation hold.
 * A moderation hold exists when an admin unpublished/rejected the project
 * (moderatedAt is set and status is not PUBLISHED).
 */
export function hasModerationHold(
  project: ProjectOwnershipContext | null | undefined
): boolean {
  if (!project) return false;
  const hasModeratorAction = Boolean(project.moderatedAt || project.moderatedById);
  const isUnpublishedHold = project.status !== "PUBLISHED";
  return hasModeratorAction && isUnpublishedHold && Boolean(project.moderationNote);
}

/**
 * Verify whether a partner is allowed to set `nextStatus` on their own project.
 * If an admin placed a moderation hold (unpublished/rejected with moderationNote),
 * the partner can still edit content and save as DRAFT, but cannot flip status to PUBLISHED
 * until an admin lifts the hold.
 */
export function assertPartnerCanChangeStatus(
  project: ProjectOwnershipContext | null | undefined,
  nextStatus?: string | null
): void {
  if (!project || !nextStatus) return;
  if (nextStatus.toUpperCase() === "PUBLISHED" && hasModerationHold(project)) {
    throw new ProjectOwnershipError(
      `This project has an active moderation hold ("${project.moderationNote}") and cannot be published until an administrator lifts the hold.`,
      ["status"],
      403
    );
  }
}
