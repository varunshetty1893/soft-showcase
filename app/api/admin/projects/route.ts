// app/api/admin/projects/route.ts
// Admin: list all projects / create a new project.
// Source of truth: docs/15-api-architecture.md, docs/13-database-design.md

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { getAdminProjects } from "@/lib/db/queries/admin-projects";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { slugify } from "@/lib/utils/slug";

// ─── GET /api/admin/projects ──────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(req.url);
    const page = Number(searchParams.get("page") ?? 1);
    const pageSize = Number(searchParams.get("pageSize") ?? 20);
    const status = searchParams.get("status") as
      | "DRAFT"
      | "PUBLISHED"
      | "ARCHIVED"
      | null;
    const search = searchParams.get("search") ?? undefined;

    const data = await getAdminProjects({
      page,
      pageSize,
      status: status ?? undefined,
      search,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("GET /api/admin/projects error:", error);
    return NextResponse.json({ error: "Failed to fetch projects" }, { status: 500 });
  }
}

// ─── POST /api/admin/projects ─────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdmin();
    await ensureAdditiveSchema();

    // Request size limit: allow up to 10MB for inline screenshot fallbacks
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    // Auto-generate slug from title if not provided
    if (!body.slug && body.title) {
      body.slug = slugify(body.title as string);
    }

    // Normalize price & originalPrice before validation
    if (body.priceMode === "CONTACT" || body.priceMode === "FREE") {
      body.price = null;
      body.originalPrice = null;
    } else if (body.priceMode !== "FIXED") {
      body.originalPrice = null;
    } else if (
      body.originalPrice === "" ||
      body.originalPrice === undefined ||
      body.originalPrice === null ||
      (body.price != null && Number(body.originalPrice) === Number(body.price))
    ) {
      body.originalPrice = null;
    } else {
      body.originalPrice = Number(body.originalPrice);
    }

    const parsed = ProjectSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const {
      title,
      slug,
      shortDescription,
      fullDescription,
      status,
      featured,
      featuredOrder,
      priceMode,
      price,
      originalPrice,
      priceQualifier,
      dealType,
      dealLabel,
      dealStartsAt,
      dealEndsAt,
      demoUrl,
      projectType,
      whatsIncluded,
      categoryId,
      providerId,
    } = parsed.data;

    // Lists are outside ProjectSchema — validate and extract from raw body
    const features: { feature: string; sortOrder?: number }[] = Array.isArray(body.features)
      ? body.features
      : [];
    const specifications: { key: string; value: string; sortOrder?: number }[] = Array.isArray(
      body.specifications
    )
      ? body.specifications
      : [];
    const faqs: { question: string; answer: string; sortOrder?: number }[] = Array.isArray(
      body.faqs
    )
      ? body.faqs
      : [];
    const technologyIds: string[] = Array.isArray(body.technologyIds)
      ? body.technologyIds
      : [];
    const rawImages: { url: string; storageKey?: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[] =
      Array.isArray(body.images)
        ? body.images.filter((img: any) => img && typeof img.url === "string" && img.url.trim()).slice(0, 15)
        : [];
    if (rawImages.length > 0 && !rawImages.some((img) => img.isPrimary)) {
      rawImages[0].isPrimary = true;
    }

    const resolvedTechIds: string[] = [];
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

    // Slug uniqueness check
    const existing = await db.project.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json(
        { error: "A project with this slug already exists" },
        { status: 409 }
      );
    }

    // Publishing must never alter the provider's approval state as a side effect.
    // The provider must already be active, approved, consented, and not removed.
    if (status === "PUBLISHED") {
      const provider = await db.projectProvider.findUnique({
        where: { id: providerId },
        select: {
          id: true,
          isActive: true,
          applicationStatus: true,
          providerConsentConfirmed: true,
          removedAt: true,
        },
      });

      if (!provider) {
        return NextResponse.json({ error: "Select a valid provider before publishing." }, { status: 422 });
      }

      if (
        provider.removedAt ||
        !provider.isActive ||
        provider.applicationStatus !== "approved" ||
        !provider.providerConsentConfirmed
      ) {
        return NextResponse.json(
          {
            error:
              "A project can be published only for an active, approved provider with confirmed consent.",
          },
          { status: 422 }
        );
      }
    }

    const effectiveDealType = priceMode === "FIXED" ? (dealType ?? "NONE") : "NONE";

    const project = await db.project.create({
      data: {
        title,
        slug,
        shortDescription,
        fullDescription,
        status,
        featured,
        featuredOrder: featuredOrder ?? 0,
        priceMode,
        price: priceMode === "CONTACT" || priceMode === "FREE" ? null : (price ?? null),
        originalPrice: priceMode === "FIXED" && originalPrice ? originalPrice : null,
        priceQualifier: priceQualifier ?? "NONE",
        dealType: effectiveDealType,
        dealLabel: effectiveDealType === "CUSTOM" ? (dealLabel ?? null) : null,
        dealStartsAt: priceMode === "FIXED" && dealStartsAt ? dealStartsAt : null,
        dealEndsAt: priceMode === "FIXED" && dealEndsAt ? dealEndsAt : null,
        demoUrl: demoUrl ?? null,
        projectType: projectType ?? null,
        whatsIncluded,
        categoryId,
        providerId,
        features: {
          create: features.map((f, i) => ({
            feature: f.feature,
            sortOrder: f.sortOrder ?? i,
          })),
        },
        specifications: {
          create: specifications.map((s, i) => ({
            key: s.key,
            value: s.value,
            sortOrder: s.sortOrder ?? i,
          })),
        },
        faqs: {
          create: faqs.map((faq, i) => ({
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder ?? i,
          })),
        },
        technologies: {
          create: resolvedTechIds.map((technologyId) => ({ technologyId })),
        },
        ...(rawImages.length > 0 && {
          images: {
            create: rawImages.map((img, i) => ({
              url: img.url.trim(),
              storageKey: img.storageKey || `admin-img-${Date.now()}-${i}`,
              altText: img.altText || title,
              isPrimary: img.isPrimary ?? (i === 0),
              sortOrder: img.sortOrder ?? i,
            })),
          },
        }),
      },
    });

    // Audit log
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PROJECT_CREATED",
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

    return NextResponse.json(
      { success: true, message: "Project created successfully", project },
      { status: 201 }
    );
  } catch (error: any) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error?.code === "P2002" || error?.message?.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A project with this slug already exists" },
        { status: 409 }
      );
    }
    console.error("POST /api/admin/projects error:", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }
}
