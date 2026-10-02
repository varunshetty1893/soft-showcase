// app/api/admin/projects/[id]/route.ts
// Admin: get, update, and delete a single project.
// Source of truth: docs/15-api-architecture.md, docs/13-database-design.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { ProjectUpdateSchema } from "@/lib/validation/project.schema";
import { getAdminProjectById } from "@/lib/db/queries/admin-projects";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slug";

type Params = { params: Promise<{ id: string }> };

// ─── GET /api/admin/projects/[id] ────────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;

    const project = await getAdminProjectById(id);
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("GET /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch project" }, { status: 500 });
  }
}

// ─── PATCH /api/admin/projects/[id] ──────────────────────────────────────────

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin();
    await ensureAdditiveSchema();

    // Request size limit: allow up to 10MB for inline screenshot fallbacks
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Auto-generate slug from title if title is being changed and slug not supplied
    if (!body.slug && body.title) {
      body.slug = slugify(body.title as string);
    }

    // Normalize originalPrice when provided
    if (body.priceMode === "CONTACT" || body.priceMode === "FREE") {
      body.price = null;
      body.originalPrice = null;
    } else if (body.priceMode && body.priceMode !== "FIXED") {
      body.originalPrice = null;
    } else if (
      body.originalPrice === "" ||
      Number(body.originalPrice) === 0 ||
      (body.originalPrice != null && body.price != null && Number(body.originalPrice) === Number(body.price))
    ) {
      body.originalPrice = null;
    } else if (body.originalPrice !== undefined && body.originalPrice !== null) {
      body.originalPrice = Number(body.originalPrice);
    }

    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    // Ensure project exists
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Slug uniqueness check (if slug is being changed)
    if (parsed.data.slug && parsed.data.slug !== existing.slug) {
      const slugConflict = await db.project.findUnique({
        where: { slug: parsed.data.slug },
      });
      if (slugConflict) {
        return NextResponse.json(
          { error: "A project with this slug already exists" },
          { status: 409 }
        );
      }
    }

    // Lists from raw body
    const features: { feature: string; sortOrder?: number }[] | undefined =
      Array.isArray(body.features) ? body.features : undefined;
    const specifications: { key: string; value: string; sortOrder?: number }[] | undefined =
      Array.isArray(body.specifications) ? body.specifications : undefined;
    const faqs: { question: string; answer: string; sortOrder?: number }[] | undefined =
      Array.isArray(body.faqs) ? body.faqs : undefined;
    const technologyIds: string[] | undefined = Array.isArray(body.technologyIds)
      ? body.technologyIds
      : undefined;

    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      status,
      featured,
      priceMode,
      price,
      originalPrice,
      demoUrl,
      projectType,
      whatsIncluded,
      categoryId,
      providerId,
    } = parsed.data;

    let resolvedTechIds: string[] | undefined = undefined;
    if (technologyIds !== undefined) {
      resolvedTechIds = [];
      for (const item of technologyIds) {
        if (!item || typeof item !== "string") continue;
        const trimmed = item.trim();
        if (!trimmed) continue;
        const existingById = await db.technology.findUnique({ where: { id: trimmed } }).catch(() => null);
        if (existingById) {
          resolvedTechIds.push(existingById.id);
          continue;
        }
        const techSlug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const existingByName = await db.technology.findFirst({
          where: {
            OR: [{ name: { equals: trimmed, mode: "insensitive" } }, { slug: techSlug }],
          },
        }).catch(() => null);
        if (existingByName) {
          resolvedTechIds.push(existingByName.id);
        } else {
          const newTech = await db.technology.create({
            data: { name: trimmed, slug: techSlug || `tech-${Date.now()}`, isActive: true },
          }).catch(() => null);
          if (newTech) resolvedTechIds.push(newTech.id);
        }
      }
    }

    if ((status ?? existing.status) === "PUBLISHED") {
      const targetProviderId = providerId ?? existing.providerId;
      if (targetProviderId) {
        await db.projectProvider
          .update({
            where: { id: targetProviderId },
            data: { isActive: true, applicationStatus: "approved" },
          })
          .catch(() => null);
      }
    }

    const project = await db.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(fullDescription !== undefined && { fullDescription }),
        ...(status !== undefined && { status }),
        ...(featured !== undefined && { featured }),
        ...(priceMode !== undefined && { priceMode }),
        ...((price !== undefined || priceMode !== undefined) && {
          price:
            (priceMode === "CONTACT" || priceMode === "FREE" || (priceMode === undefined && (existing.priceMode === "CONTACT" || existing.priceMode === "FREE")))
              ? null
              : (price ?? null),
        }),
        ...((originalPrice !== undefined || priceMode !== undefined) && {
          originalPrice:
            (priceMode === "FIXED" || (priceMode === undefined && existing.priceMode === "FIXED"))
              ? (originalPrice ?? null)
              : null,
        }),
        ...(demoUrl !== undefined && { demoUrl: demoUrl ?? null }),
        ...(projectType !== undefined && { projectType: projectType ?? null }),
        ...(whatsIncluded !== undefined && { whatsIncluded }),
        ...(categoryId !== undefined && { categoryId }),
        ...(providerId !== undefined && { providerId }),
        // Replace lists when provided
        ...(features !== undefined && {
          features: {
            deleteMany: {},
            create: features.map((f, i) => ({
              feature: f.feature,
              sortOrder: f.sortOrder ?? i,
            })),
          },
        }),
        ...(specifications !== undefined && {
          specifications: {
            deleteMany: {},
            create: specifications.map((s, i) => ({
              key: s.key,
              value: s.value,
              sortOrder: s.sortOrder ?? i,
            })),
          },
        }),
        ...(faqs !== undefined && {
          faqs: {
            deleteMany: {},
            create: faqs.map((faq, i) => ({
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder ?? i,
            })),
          },
        }),
        ...(resolvedTechIds !== undefined && {
          technologies: {
            deleteMany: {},
            create: resolvedTechIds.map((technologyId) => ({ technologyId })),
          },
        }),
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROJECT_UPDATED",
        entityType: "Project",
        entityId: project.id,
        details: { title: project.title, status: project.status },
      },
    });

    // Revalidate public catalog, homepage, and detail caches (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${project.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true, message: "Project updated successfully", project });
  } catch (error: any) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error?.code === "P2002" || error?.message?.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A project with this slug already exists" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/projects/[id] ─────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl?.searchParams;
    const action = searchParams?.get("action");

    // Soft-delete if explicit archive action requested
    if (action === "archive") {
      const project = await db.project.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      await db.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PROJECT_ARCHIVED",
          entityType: "Project",
          entityId: project.id,
          details: { title: project.title },
        },
      });

      revalidatePath("/");
      revalidatePath("/projects");
      revalidatePath(`/projects/${existing.slug}`);
      revalidatePath("/sitemap.xml");

      return NextResponse.json({ success: true, message: "Project archived successfully" });
    }

    // Permanent delete: atomically remove child records and the project
    await db.$transaction(async (tx) => {
      // 1. Disassociate from transactions so transaction receipts are preserved
      await tx.transaction.updateMany({
        where: { solutionId: id },
        data: { solutionId: null },
      });

      // 2. Delete any inquiries associated with this project
      await tx.inquiry.deleteMany({
        where: { projectId: id },
      });

      // 3. Delete the project (cascade removes images, features, specs, faqs, technologies)
      await tx.project.delete({
        where: { id },
      });

      // 4. Record audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PROJECT_DELETED",
          entityType: "Project",
          entityId: id,
          details: { title: existing.title, slug: existing.slug },
        },
      });
    });

    // Revalidate public catalog, homepage, and detail caches
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/projects");
    revalidatePath("/partner/solutions");

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("DELETE /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
