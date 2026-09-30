// app/api/partner/solutions/route.ts
// Handles creating and listing solutions for the authenticated partner.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { slugify } from "@/lib/utils/slug";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const projects = await db.project.findMany({
      where: { providerId: partner.id },
      include: {
        category: true,
        images: true,
        _count: { select: { inquiries: true, transactions: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ projects });
  } catch (err: unknown) {
    console.error("Failed to list partner projects:", err);
    return NextResponse.json({ error: "Failed to load solutions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Request size limit: reject payloads > 512KB (Issue 46)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 524288) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

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

    const body = await req.json();

    // Compute unique slug with race condition protection (Issue 53)
    const baseSlug = slugify(body.title || "solution");
    let finalSlug = baseSlug;
    let count = 1;
    while (await db.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count}-${Math.random().toString(36).substring(2, 6)}`;
      count++;
      if (count > 5) break;
    }

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
      slug: finalSlug,
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
      .filter((f) => f && typeof f.feature === "string" && f.feature.trim())
      .slice(0, 25);

    const specifications: { key: string; value: string; sortOrder?: number }[] = (
      Array.isArray(body.specifications) ? body.specifications : []
    )
      .filter((s) => s && typeof s.key === "string" && typeof s.value === "string" && s.key.trim())
      .slice(0, 25);

    const faqs: { question: string; answer: string; sortOrder?: number }[] = (
      Array.isArray(body.faqs) ? body.faqs : []
    )
      .filter((f) => f && typeof f.question === "string" && typeof f.answer === "string" && f.question.trim())
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

      const slug = trimmed
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const tech = await db.technology.upsert({
        where: { slug: slug || `tech-${trimmed.toLowerCase()}` },
        update: {},
        create: {
          name: trimmed,
          slug: slug || `tech-${Date.now()}`,
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

    // Atomically create solution and audit log (Issue 45)
    const newProject = await db.$transaction(async (tx) => {
      const created = await tx.project.create({
        data: {
          title: data.title,
          slug: finalSlug,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          status: data.status || "DRAFT",
          featured: false,
          priceMode: data.priceMode,
          price: data.priceMode === "CONTACT" || data.priceMode === "FREE" ? null : (data.price ?? null),
          demoUrl: data.demoUrl || null,
          projectType: data.projectType || "Web Application",
          whatsIncluded: data.whatsIncluded || [],
          categoryId: data.categoryId,
          providerId: partner.id,
          features: {
            create: features.map((f, i) => ({
              feature: f.feature,
              sortOrder: f.sortOrder ?? i + 1,
            })),
          },
          specifications: {
            create: specifications.map((s, i) => ({
              key: s.key,
              value: s.value,
              sortOrder: s.sortOrder ?? i + 1,
            })),
          },
          faqs: {
            create: faqs.map((faq, i) => ({
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder ?? i + 1,
            })),
          },
          technologies: {
            create: resolvedTechIds.map((techId) => ({
              technologyId: techId,
            })),
          },
          images: {
            create: sanitizedImages.map((img, i) => ({
              url: img.url.trim(),
              storageKey: img.storageKey || `img-${Date.now()}-${i}`,
              altText: img.altText || data.title,
              isPrimary: img.isPrimary ?? (i === 0),
              sortOrder: img.sortOrder ?? i + 1,
            })),
          },
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PARTNER_SOLUTION_CREATED",
          entityType: "Project",
          entityId: created.id,
          details: {
            title: created.title,
            status: created.status,
            partnerId: partner.id,
          },
        },
      }).catch(() => null);

      return created;
    });

    // Revalidate public catalog, homepage, and sitemap (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${newProject.slug}`);
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create partner project:", err);
    return NextResponse.json({ error: "Failed to create solution" }, { status: 500 });
  }
}
