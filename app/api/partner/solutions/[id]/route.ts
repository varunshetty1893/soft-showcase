// app/api/partner/solutions/[id]/route.ts
// Updates or deletes a partner's own solution.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { slugify } from "@/lib/utils/slug";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
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

    const parsed = ProjectSchema.safeParse({
      ...body,
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

    const rawTechList: string[] = Array.isArray(body.technologyIds)
      ? body.technologyIds
      : Array.isArray(body.technologies)
      ? body.technologies
      : [];

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

      const slug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const existingByName = await db.technology.findFirst({
        where: {
          OR: [
            { name: { equals: trimmed, mode: "insensitive" } },
            { slug: slug },
          ],
        },
      }).catch(() => null);

      if (existingByName) {
        resolvedTechIds.push(existingByName.id);
      } else {
        const newTech = await db.technology.create({
          data: {
            name: trimmed,
            slug: slug || `tech-${Date.now()}`,
            isActive: true,
            sortOrder: 99,
          },
        }).catch(() => null);

        if (newTech) {
          resolvedTechIds.push(newTech.id);
        }
      }
    }

    const rawImages: { url: string; storageKey?: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[] = Array.isArray(
      body.images
    )
      ? body.images
      : [];

    const sanitizedImages = rawImages.filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0);
    const hasPrimary = sanitizedImages.some((img) => img.isPrimary);
    if (!hasPrimary && sanitizedImages.length > 0) {
      sanitizedImages[0].isPrimary = true;
    }

    const updated = await db.project.update({
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
      },
    });

    // Update relational collections if provided
    if (Array.isArray(body.features)) {
      await db.projectFeature.deleteMany({ where: { projectId: id } }).catch(() => null);
      for (let i = 0; i < features.length; i++) {
        await db.projectFeature.create({
          data: {
            projectId: id,
            feature: features[i].feature,
            sortOrder: features[i].sortOrder ?? i + 1,
          },
        }).catch(() => null);
      }
    }

    if (Array.isArray(body.specifications)) {
      await db.projectSpecification.deleteMany({ where: { projectId: id } }).catch(() => null);
      for (let i = 0; i < specifications.length; i++) {
        await db.projectSpecification.create({
          data: {
            projectId: id,
            key: specifications[i].key,
            value: specifications[i].value,
            sortOrder: specifications[i].sortOrder ?? i + 1,
          },
        }).catch(() => null);
      }
    }

    if (Array.isArray(body.faqs)) {
      await db.projectFaq.deleteMany({ where: { projectId: id } }).catch(() => null);
      for (let i = 0; i < faqs.length; i++) {
        await db.projectFaq.create({
          data: {
            projectId: id,
            question: faqs[i].question,
            answer: faqs[i].answer,
            sortOrder: faqs[i].sortOrder ?? i + 1,
          },
        }).catch(() => null);
      }
    }

    if (rawTechList.length > 0) {
      await db.projectTechnology.deleteMany({ where: { projectId: id } }).catch(() => null);
      for (const techId of resolvedTechIds) {
        await db.projectTechnology.create({
          data: {
            projectId: id,
            technologyId: techId,
          },
        }).catch(() => null);
      }
    }

    if (sanitizedImages.length > 0) {
      await db.projectImage.deleteMany({ where: { projectId: id } }).catch(() => null);
      for (let i = 0; i < sanitizedImages.length; i++) {
        const img = sanitizedImages[i];
        await db.projectImage.create({
          data: {
            projectId: id,
            url: img.url.trim(),
            storageKey: img.storageKey || `img-${Date.now()}-${i}`,
            altText: img.altText || data.title,
            isPrimary: img.isPrimary ?? (i === 0),
            sortOrder: img.sortOrder ?? i + 1,
          },
        }).catch(() => null);
      }
    }

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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
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
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete partner project:", err);
    return NextResponse.json({ error: "Failed to delete solution" }, { status: 500 });
  }
}
