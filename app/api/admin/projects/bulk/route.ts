// app/api/admin/projects/bulk/route.ts
// Admin bulk project update endpoint (Phase 3).
// Enforces assertAdminCanUpdate on every targeted project before writing;
// bulk tools cannot touch partner-owned content fields.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import {
  isPartnerOwnedProject,
  assertAdminCanUpdate,
  ProjectOwnershipError,
} from "@/lib/auth/project-permissions";
import { writeAuditLog, createAuditLogTx } from "@/lib/db/audit";

const MAX_BULK_PROJECTS = 100;

const BULK_STATUS_MAP: Record<string, "PUBLISHED" | "DRAFT" | "ARCHIVED"> = {
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
  DRAFT: "DRAFT",
  UNPUBLISHED: "DRAFT",
  REJECTED: "DRAFT",
};

/**
 * Strict allow-list for bulk patches. Unknown keys are rejected (never copied into
 * Prisma), so the bulk endpoint can only ever touch these moderation/display fields.
 */
const BulkProjectPatchSchema = z
  .object({
    featured: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    featuredOrder: z.number().int().min(0).max(100000).optional(),
    displayOrder: z.number().int().min(0).max(100000).optional(),
    categoryId: z.string().trim().min(1).max(100).optional(),
    status: z
      .string()
      .transform((v) => v.trim().toUpperCase())
      .refine((v) => v in BULK_STATUS_MAP, "Unsupported status")
      .optional(),
    moderationNote: z.string().trim().max(1000).optional().nullable(),
    reason: z.string().trim().max(1000).optional().nullable(),
  })
  .strict();

export async function executeAdminBulkProjectUpdate(params: {
  projectIds: string[];
  patch: Record<string, unknown>;
  actorId: string;
}): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  disallowedFields?: string[];
  missingProjectIds?: string[];
  updatedCount?: number;
}> {
  await ensureAdditiveSchema();
  const { patch, actorId } = params;

  if (
    !Array.isArray(params.projectIds) ||
    params.projectIds.length === 0 ||
    params.projectIds.some((id) => typeof id !== "string" || !id.trim())
  ) {
    return { ok: false, status: 400, error: "projectIds must be a non-empty array of project ids." };
  }

  // De-duplicate so one project is never updated (or audited) twice in the same request.
  const projectIds = Array.from(new Set(params.projectIds.map((id) => id.trim())));
  if (projectIds.length > MAX_BULK_PROJECTS) {
    return {
      ok: false,
      status: 400,
      error: `Too many projects. A bulk update is limited to ${MAX_BULK_PROJECTS} projects.`,
    };
  }

  const projects = await db.project.findMany({
    where: { id: { in: projectIds } },
    include: {
      provider: {
        include: {
          user: { select: { id: true, role: true, isAdmin: true } },
        },
      },
    },
  });

  // 0. Every requested id must exist. Never report success for ids that matched nothing.
  const foundIds = new Set(projects.map((p) => p.id));
  const missingProjectIds = projectIds.filter((id) => !foundIds.has(id));
  if (missingProjectIds.length > 0) {
    return {
      ok: false,
      status: 404,
      error: `Project(s) not found: ${missingProjectIds.join(", ")}. Nothing was updated.`,
      missingProjectIds,
    };
  }

  // 1. Validate ownership policy across all target projects BEFORE writing anything
  for (const project of projects) {
    if (isPartnerOwnedProject(project, actorId)) {
      try {
        assertAdminCanUpdate(project, patch, actorId);
      } catch (err) {
        if (err instanceof ProjectOwnershipError) {
          if (err.status === 403) {
            await writeAuditLog({
              actorId,
              action: "ADMIN_EDIT_DENIED",
              entityType: "Project",
              entityId: project.id,
              metadata: {
                bulk: true,
                title: project.title,
                disallowedFields: err.disallowedFields,
              },
            });
          }
          return {
            ok: false,
            status: err.status,
            error: err.message,
            disallowedFields: err.disallowedFields,
          };
        }
        throw err;
      }
    }
  }

  // 2. Strictly validate the patch shape (admin-managed projects included).
  const parsed = BulkProjectPatchSchema.safeParse(patch);
  if (!parsed.success) {
    const unknownKeys = parsed.error.issues.flatMap((issue) =>
      issue.code === "unrecognized_keys" ? issue.keys : []
    );
    return {
      ok: false,
      status: 400,
      error:
        unknownKeys.length > 0
          ? `Unsupported bulk fields: ${unknownKeys.join(", ")}.`
          : parsed.error.issues.map((i) => `${i.path.join(".") || "patch"}: ${i.message}`).join("; "),
      disallowedFields: unknownKeys.length > 0 ? unknownKeys : undefined,
    };
  }
  const input = parsed.data;

  const nextFeatured = input.featured ?? input.isFeatured;
  const nextFeaturedOrder = input.featuredOrder ?? input.displayOrder;
  const nextStatus = input.status ? BULK_STATUS_MAP[input.status] : undefined;
  const hasModeration = input.moderationNote !== undefined || input.reason !== undefined;

  if (input.categoryId) {
    const category = await db.category.findUnique({
      where: { id: input.categoryId },
      select: { id: true },
    });
    if (!category) {
      return { ok: false, status: 400, error: "Selected category does not exist." };
    }
  }

  // 3. Publishing is only allowed for an active, approved, consented, non-removed provider.
  if (nextStatus === "PUBLISHED") {
    const blocked = projects.filter((project) => {
      const provider = project.provider as any;
      return (
        !provider ||
        provider.removedAt ||
        !provider.isActive ||
        provider.applicationStatus !== "approved" ||
        !provider.providerConsentConfirmed
      );
    });
    if (blocked.length > 0) {
      return {
        ok: false,
        status: 422,
        error: `Cannot publish: provider is not active, approved and consented for ${blocked
          .map((p) => `"${p.title}"`)
          .join(", ")}. Nothing was updated.`,
      };
    }
  }

  // 4. Apply all updates and their audit records atomically.
  const updatedCount = await db.$transaction(async (tx) => {
    let count = 0;

    for (const project of projects) {
      const partnerOwned = isPartnerOwnedProject(project, actorId);
      const data: Record<string, unknown> = {};

      if (nextFeatured !== undefined) data.featured = nextFeatured;
      if (nextFeaturedOrder !== undefined) data.featuredOrder = nextFeaturedOrder;
      if (input.categoryId) data.categoryId = input.categoryId;
      if (nextStatus) data.status = nextStatus;
      // Moderation metadata only applies to partner-owned content.
      if (partnerOwned && hasModeration) {
        data.moderationNote = String(input.moderationNote ?? input.reason ?? "").trim() || null;
        data.moderatedAt = new Date();
        data.moderatedById = actorId;
      }

      if (Object.keys(data).length === 0) continue;

      const updated = await tx.project.update({
        where: { id: project.id },
        data,
      });
      count += 1;

      await createAuditLogTx(tx, {
        userId: actorId,
        action: partnerOwned
          ? data.featured !== undefined || data.featuredOrder !== undefined
            ? "PROJECT_FEATURED_CHANGED"
            : "PROJECT_MODERATED"
          : "PROJECT_BULK_UPDATED",
        entityType: "Project",
        entityId: project.id,
        details: {
          bulk: true,
          before: {
            featured: project.featured,
            featuredOrder: (project as any).featuredOrder ?? 0,
            status: project.status,
            categoryId: project.categoryId,
          },
          after: {
            featured: updated.featured,
            featuredOrder: (updated as any).featuredOrder ?? 0,
            status: updated.status,
            categoryId: updated.categoryId,
          },
        },
      });
    }

    return count;
  });

  return { ok: true, status: 200, updatedCount };
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const result = await executeAdminBulkProjectUpdate({
      projectIds: Array.isArray(body.projectIds) ? body.projectIds : [],
      patch: (body.patch && typeof body.patch === "object" ? body.patch : {}) as Record<
        string,
        unknown
      >,
      actorId: session.user.id,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          disallowedFields: result.disallowedFields,
          missingProjectIds: result.missingProjectIds,
        },
        { status: result.status }
      );
    }

    try {
      revalidatePath("/");
      revalidatePath("/projects");
      revalidatePath("/admin/projects");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      updatedCount: result.updatedCount,
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("POST /api/admin/projects/bulk error:", error);
    return NextResponse.json({ error: "Bulk update failed" }, { status: 500 });
  }
}
