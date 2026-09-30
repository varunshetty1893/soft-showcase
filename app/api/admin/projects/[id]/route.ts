// app/api/admin/projects/[id]/route.ts
// Admin: get, update, and delete a single project.
// Source of truth: docs/15-api-architecture.md, docs/13-database-design.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
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
    const { id } = await params;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Auto-generate slug from title if title is being changed and slug not supplied
    if (!body.slug && body.title) {
      body.slug = slugify(body.title as string);
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
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("PATCH /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/projects/[id] ─────────────────────────────────────────

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Soft-delete: archive instead of hard delete (preserves inquiry history)
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

    // Revalidate public catalog, homepage, and detail caches (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true, message: "Project archived successfully" });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("DELETE /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to archive project" }, { status: 500 });
  }
}
