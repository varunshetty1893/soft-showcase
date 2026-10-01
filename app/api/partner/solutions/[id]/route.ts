// app/api/partner/solutions/[id]/route.ts
// Updates or deletes a partner's own solution.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { slugify } from "@/lib/utils/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const project = await db.project.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        features: { orderBy: { sortOrder: "asc" } },
        specifications: { orderBy: { sortOrder: "asc" } },
        faqs: { orderBy: { sortOrder: "asc" } },
        technologies: { include: { technology: true } },
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    if (project.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your solution" }, { status: 403 });
    }

    return NextResponse.json({ project });
  } catch (err) {
    console.error("Failed to get partner project:", err);
    return NextResponse.json({ error: "Failed to get solution" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Request size limit: reject payloads > 512KB (Issue 46)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 524288) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    if (existing.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your solution" }, { status: 403 });
    }

    const body = await req.json();

    // Preserve existing slug or compute from title
    const slug = existing.slug || slugify(body.title || existing.title);

    // Normalize price: if CONTACT or FREE, must be null
    let price: number | null = null;
    if (body.priceMode === "FIXED" || body.priceMode === "STARTING_FROM") {
      const num = Number(body.price);
      price = !isNaN(num) && num > 0 ? num : null;
    }

    // Normalize demoUrl
    let demoUrl: string | null = null;
    if (body.demoUrl && typeof body.demoUrl === "string" && body.demoUrl.trim()) {
      let trimmed = body.demoUrl.trim();
      if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
        trimmed = `https://${trimmed}`;
      }
      demoUrl = trimmed;
    }

    // Sanitize features array
    const sanitizedFeatures = Array.isArray(body.features)
      ? body.features
          .map((f: any) => {
            const text = typeof f === "string" ? f : f?.feature || f?.title || f?.name || "";
            return typeof text === "string" && text.trim().length >= 2 ? { feature: text.trim() } : null;
          })
          .filter(Boolean)
      : undefined;

    // Sanitize technologies array (ensure only non-empty strings, eliminate nulls/objects)
    const sanitizedTechnologies = Array.isArray(body.technologies)
      ? body.technologies
          .map((t: any) => {
            if (typeof t === "string" && t.trim()) return t.trim();
            if (t && typeof t.name === "string" && t.name.trim()) return t.name.trim();
            return null;
          })
          .filter((t: any): t is string => Boolean(t))
      : undefined;

    const parsed = ProjectSchema.safeParse({
      ...body,
      ...(sanitizedFeatures !== undefined && { features: sanitizedFeatures }),
      ...(sanitizedTechnologies !== undefined && { technologies: sanitizedTechnologies }),
      slug,
      price,
      demoUrl,
      providerId: partner.id,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const errorSummary =
        Object.entries(fieldErrors)
          .map(([k, msgs]) => `${k}: ${msgs?.join(", ")}`)
          .join("; ") || "Validation failed";

      return NextResponse.json(
        { error: errorSummary, details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.status === "PUBLISHED" && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        {
          error:
            "Your partner profile is currently inactive or deactivated. You can only save solutions as Draft until an administrator activates your account.",
        },
        { status: 403 }
      );
    }

    // Bounded metadata arrays (Issue 48)
    const features: { feature: string; sortOrder?: number }[] = (
      Array.isArray(body.features) ? body.features : []
    )
      .filter((f: any) => f && typeof f.feature === "string" && f.feature.trim())
      .slice(0, 25);

    const specifications: { key: string; value: string; sortOrder?: number }[] = (
      Array.isArray(body.specifications) ? body.specifications : []
    )
      .filter((s: any) => s && typeof s.key === "string" && typeof s.value === "string" && s.key.trim())
      .slice(0, 25);

    const faqs: { question: string; answer: string; sortOrder?: number }[] = (
      Array.isArray(body.faqs) ? body.faqs : []
    )
      .filter((f: any) => f && typeof f.question === "string" && typeof f.answer === "string" && f.question.trim())
      .slice(0, 20);

    const rawTechList: string[] = (
      Array.isArray(body.technologyIds)
        ? body.technologyIds
        : Array.isArray(body.technologies)
        ? body.technologies
        : []
    ).slice(0, 20);

    const resolvedTechIds: string[] = [];
    for (const item of rawTechList) {
      if (!item || typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed) continue;

      const existingById = await db.technology.findUnique({ where: { id: trimmed } }).catch(() => null);
      if (existingById) {
        resolvedTechIds.push(existingById.id);
        continue;
      }

      const techSlug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const tech = await db.technology.upsert({
        where: { slug: techSlug || `tech-${trimmed.toLowerCase()}` },
        update: {},
        create: {
          name: trimmed,
          slug: techSlug || `tech-${Date.now()}`,
          isActive: true,
        },
      }).catch(() => null);

      if (tech) {
        resolvedTechIds.push(tech.id);
      }
    }

    const rawImages: { url: string; storageKey?: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[] = (
      Array.isArray(body.images) ? body.images : []
    ).slice(0, 15);

    const sanitizedImages = rawImages.filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0);
    const hasPrimary = sanitizedImages.some((img) => img.isPrimary);
    if (!hasPrimary && sanitizedImages.length > 0) {
      sanitizedImages[0].isPrimary = true;
    }

    // Atomically execute updates and audit log (Issue 45)
    const updated = await db.$transaction(async (tx) => {
      const proj = await tx.project.update({
        where: { id },
        data: {
          title: data.title,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          status: data.status,
          priceMode: data.priceMode,
          price: data.price,
          demoUrl: data.demoUrl || null,
          projectType: data.projectType,
          whatsIncluded: data.whatsIncluded,
          categoryId: data.categoryId,
          featured: typeof body.featured === "boolean" ? body.featured : existing.featured,
        },
      });

      // Update relational collections if provided
      if (Array.isArray(body.features)) {
        await tx.projectFeature.deleteMany({ where: { projectId: id } });
        for (let i = 0; i < features.length; i++) {
          await tx.projectFeature.create({
            data: {
              projectId: id,
              feature: features[i].feature,
              sortOrder: features[i].sortOrder ?? i + 1,
            },
          });
        }
      }

      if (Array.isArray(body.specifications)) {
        await tx.projectSpecification.deleteMany({ where: { projectId: id } });
        for (let i = 0; i < specifications.length; i++) {
          await tx.projectSpecification.create({
            data: {
              projectId: id,
              key: specifications[i].key,
              value: specifications[i].value,
              sortOrder: specifications[i].sortOrder ?? i + 1,
            },
          });
        }
      }

      if (Array.isArray(body.faqs)) {
        await tx.projectFaq.deleteMany({ where: { projectId: id } });
        for (let i = 0; i < faqs.length; i++) {
          await tx.projectFaq.create({
            data: {
              projectId: id,
              question: faqs[i].question,
              answer: faqs[i].answer,
              sortOrder: faqs[i].sortOrder ?? i + 1,
            },
          });
        }
      }

      if (Array.isArray(body.technologyIds) || Array.isArray(body.technologies)) {
        await tx.projectTechnology.deleteMany({ where: { projectId: id } });
        for (const techId of resolvedTechIds) {
          await tx.projectTechnology.create({
            data: {
              projectId: id,
              technologyId: techId,
            },
          });
        }
      }

      if (sanitizedImages.length > 0) {
        await tx.projectImage.deleteMany({ where: { projectId: id } });
        for (let i = 0; i < sanitizedImages.length; i++) {
          const img = sanitizedImages[i];
          await tx.projectImage.create({
            data: {
              projectId: id,
              url: img.url.trim(),
              storageKey: img.storageKey || `img-${Date.now()}-${i}`,
              altText: img.altText || data.title,
              isPrimary: img.isPrimary ?? (i === 0),
              sortOrder: img.sortOrder ?? i + 1,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PARTNER_SOLUTION_UPDATED",
          entityType: "Project",
          entityId: id,
          details: {
            title: proj.title,
            status: proj.status,
            partnerId: partner.id,
          },
        },
      }).catch(() => null);

      return proj;
    });

    // Revalidate public catalog, homepage, and sitemap (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${updated.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ project: updated });
  } catch (err) {
    console.error("Failed to update partner project:", err);
    return NextResponse.json({ error: "Failed to update solution" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    if (existing.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.$transaction(async (tx) => {
      await tx.project.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PARTNER_SOLUTION_DELETED",
          entityType: "Project",
          entityId: id,
          details: {
            title: existing.title,
            partnerId: partner.id,
          },
        },
      }).catch(() => null);
    });

    // Revalidate public catalog, homepage, and sitemap (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete partner project:", err);
    return NextResponse.json({ error: "Failed to delete solution" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    if (existing.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your solution" }, { status: 403 });
    }

    const body = await req.json();
    const updateData: { featured?: boolean; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" } = {};

    if (typeof body.featured === "boolean") {
      updateData.featured = body.featured;
    }

    if (body.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(body.status)) {
      updateData.status = body.status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No valid fields provided to update" }, { status: 400 });
    }

    const updated = await db.project.update({
      where: { id },
      data: updateData,
    });

    // Revalidate public catalog and homepage
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${updated.slug}`);
    revalidatePath("/partner/solutions");

    return NextResponse.json({ project: updated, success: true });
  } catch (err) {
    console.error("Failed to patch partner project:", err);
    return NextResponse.json({ error: "Failed to update solution" }, { status: 500 });
  }
}
