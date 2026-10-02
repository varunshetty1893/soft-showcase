// app/api/admin/projects/bulk/route.ts
// Admin bulk project update endpoint (Phase 3).
// Enforces assertAdminCanUpdate on every targeted project before writing;
// bulk tools cannot touch partner-owned content fields.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import {
  isPartnerOwnedProject,
  assertAdminCanUpdate,
  ProjectOwnershipError,
} from "@/lib/auth/project-permissions";
import { writeAuditLog } from "@/lib/db/audit";

export async function executeAdminBulkProjectUpdate(params: {
  projectIds: string[];
  patch: Record<string, unknown>;
  actorId: string;
}): Promise<{
  ok: boolean;
  status: number;
  error?: string;
  disallowedFields?: string[];
  updatedCount?: number;
}> {
  await ensureAdditiveSchema();
  const { projectIds, patch, actorId } = params;

  if (!Array.isArray(projectIds) || projectIds.length === 0) {
    return { ok: false, status: 400, error: "projectIds array is required." };
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

  // 1. Validate policy across all target projects BEFORE writing anything
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

  // 2. Apply updates
  let updatedCount = 0;
  for (const project of projects) {
    const partnerOwned = isPartnerOwnedProject(project, actorId);
    const data: Record<string, unknown> = {};

    if (partnerOwned) {
      if (typeof patch.featured === "boolean") data.featured = patch.featured;
      if (typeof patch.isFeatured === "boolean") data.featured = patch.isFeatured;
      if (typeof patch.featuredOrder === "number") data.featuredOrder = patch.featuredOrder;
      if (typeof patch.displayOrder === "number") data.featuredOrder = patch.displayOrder;
      if (typeof patch.categoryId === "string") data.categoryId = patch.categoryId;
      if (typeof patch.status === "string") {
        const upper = patch.status.toUpperCase();
        data.status =
          upper === "PUBLISHED" ? "PUBLISHED" : upper === "ARCHIVED" ? "ARCHIVED" : "DRAFT";
      }
      if (patch.moderationNote !== undefined || patch.reason !== undefined) {
        data.moderationNote = String(patch.moderationNote ?? patch.reason ?? "").trim() || null;
        data.moderatedAt = new Date();
        data.moderatedById = actorId;
      }
    } else {
      Object.assign(data, patch);
    }

    if (Object.keys(data).length > 0) {
      const updated = await db.project.update({
        where: { id: project.id },
        data,
      });
      updatedCount += 1;

      if (partnerOwned) {
        await writeAuditLog({
          actorId,
          action:
            data.featured !== undefined || data.featuredOrder !== undefined
              ? "PROJECT_FEATURED_CHANGED"
              : "PROJECT_MODERATED",
          entityType: "Project",
          entityId: project.id,
          metadata: {
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
    }
  }

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
        { error: result.error, disallowedFields: result.disallowedFields },
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
