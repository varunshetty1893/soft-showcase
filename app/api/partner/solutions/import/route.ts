// app/api/partner/solutions/import/route.ts
// Solution Partner API endpoint for validating, previewing, and importing project JSON.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { PartnerSolutionImportSchema } from "@/lib/validation/project-import.schema";
import { slugify, generateUniqueSlug } from "@/lib/utils/slug";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const partner = await resolvePartnerForUser(session.user);

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved. Please contact support." },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const isPreview = Boolean(
      body.previewOnly || request.nextUrl.searchParams.get("action") === "preview"
    );

    // 1. Zod schema validation
    const parseResult = PartnerSolutionImportSchema.safeParse(body.project || body);
    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed. Please verify the JSON fields.",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parseResult.data;

    // 2. Normalize category
    const categoryName = (data.category || data.categorySlug || "").trim();
    const categorySlug = data.categorySlug ? slugify(data.categorySlug) : slugify(categoryName);

    // 3. Normalize technologies
    const rawTechs = [...(data.technologies || []), ...(data.technologySlugs || [])]
      .map((t) => t.trim())
      .filter(Boolean);
    const techNames = Array.from(new Set(rawTechs));

    // 4. Normalize features
    let normalizedFeatures: Array<{ feature: string; sortOrder: number }> = [];
    if (Array.isArray(data.features)) {
      normalizedFeatures = data.features.map((item, idx) => {
        if (typeof item === "string") {
          return { feature: item.trim(), sortOrder: idx + 1 };
        }
        return { feature: item.feature.trim(), sortOrder: item.sortOrder ?? idx + 1 };
      });
    }

    // 5. Normalize specifications
    let normalizedSpecs: Array<{ key: string; value: string; sortOrder: number }> = [];
    if (data.specifications && !Array.isArray(data.specifications)) {
      normalizedSpecs = Object.entries(data.specifications).map(([key, value], idx) => ({
        key: key.trim(),
        value: String(value).trim(),
        sortOrder: idx + 1,
      }));
    } else if (Array.isArray(data.specifications)) {
      normalizedSpecs = (
        data.specifications as Array<{ key: string; value: string; sortOrder?: number }>
      ).map((item, idx) => ({
        key: String(item.key).trim(),
        value: String(item.value).trim(),
        sortOrder: item.sortOrder ?? idx + 1,
      }));
    }

    // 6. Normalize FAQs
    const rawFaqs = data.faq && data.faq.length > 0 ? data.faq : data.faqs || [];
    const normalizedFaqs = rawFaqs.map((f, idx) => ({
      question: f.question.trim(),
      answer: f.answer.trim(),
      sortOrder: f.sortOrder ?? idx + 1,
    }));

    // 7. Normalize images (mainImage + images)
    const normalizedImages: Array<{ url: string; altText: string; isPrimary: boolean; sortOrder: number }> = [];
    if (data.mainImage && data.mainImage.trim()) {
      normalizedImages.push({
        url: data.mainImage.trim(),
        altText: `${data.title} Cover`,
        isPrimary: true,
        sortOrder: 1,
      });
    }
    if (Array.isArray(data.images)) {
      data.images.forEach((img, idx) => {
        const url = typeof img === "string" ? img.trim() : (img as any)?.url?.trim();
        const alt = typeof img === "object" && (img as any)?.altText ? (img as any).altText.trim() : `${data.title} Screenshot ${idx + 1}`;
        if (url && url !== data.mainImage?.trim()) {
          normalizedImages.push({
            url,
            altText: alt,
            isPrimary: normalizedImages.length === 0,
            sortOrder: normalizedImages.length + 1,
          });
        }
      });
    }

    // 8. Generate prospective slug
    const targetSlug = slugify(data.title);

    // 8. Check existing database entities
    const existingCategory = await db.category.findFirst({
      where: {
        OR: [
          { slug: categorySlug },
          { name: { equals: categoryName, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    const existingTechnologies = techNames.length > 0
      ? await db.technology.findMany({
          where: {
            OR: techNames.map((name) => ({
              name: { equals: name, mode: "insensitive" },
            })),
          },
          select: { id: true, name: true, slug: true },
        })
      : [];

    const existingTechNamesLower = new Set(existingTechnologies.map((t) => t.name.toLowerCase()));
    const newTechNames = techNames.filter((t) => !existingTechNamesLower.has(t.toLowerCase()));

    // ── Preview Mode ────────────────────────────────────────────────────────
    if (isPreview) {
      return NextResponse.json({
        preview: true,
        project: {
          title: data.title,
          slug: targetSlug,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          projectType: data.projectType || null,
          demoUrl: data.demoUrl || null,
          priceMode: data.priceMode,
          price: data.price ?? null,
          status: data.status || "DRAFT",
          // Featured placement is an administrator-only decision.
          featured: false,
          whatsIncluded: data.whatsIncluded || [],
          featuresCount: normalizedFeatures.length,
          specsCount: normalizedSpecs.length,
          faqsCount: normalizedFaqs.length,
          features: normalizedFeatures,
          specifications: normalizedSpecs,
          faqs: normalizedFaqs,
        },
        category: {
          name: categoryName,
          slug: categorySlug,
          exists: Boolean(existingCategory),
          id: existingCategory?.id ?? null,
        },
        partner: {
          name: partner.displayName,
          email: partner.email,
        },
        technologies: {
          total: techNames.length,
          existing: existingTechnologies.map((t) => t.name),
          unrecognized: newTechNames,
        },
      });
    }

    // Partners may only use the administrator-curated category and technology
    // catalogue. Importing JSON must not be a side door for creating global
    // taxonomy records.
    if (!existingCategory) {
      return NextResponse.json(
        { error: "Choose an existing category from the catalogue before importing." },
        { status: 400 }
      );
    }

    if (newTechNames.length > 0) {
      return NextResponse.json(
        {
          error: "Choose only existing technologies from the catalogue before importing.",
          unrecognizedTechnologies: newTechNames,
        },
        { status: 400 }
      );
    }

    // ── Execute Import ──────────────────────────────────────────────────────
    // Imports follow the same safe default as the normal partner form.
    // The schema permits an explicit publish request, but it must pass the same
    // active/approved partner gate used by normal creation.
    const requestedStatus = data.status || "DRAFT";
    if (requestedStatus === "PUBLISHED" && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Your partner account must be active and approved before publishing a solution." },
        { status: 403 }
      );
    }
    const finalSlug = await generateUniqueSlug(data.title, async (s) => {
      const found = await db.project.findUnique({ where: { slug: s } });
      return Boolean(found);
    });

    // 1. Use the administrator-curated category and technologies.
    const categoryId = existingCategory.id;
    const techIds: string[] = existingTechnologies.map((t) => t.id);

    const validOriginalPrice =
      data.priceMode === "FIXED" &&
      data.originalPrice != null &&
      data.price != null &&
      Number(data.originalPrice) > Number(data.price)
        ? Number(data.originalPrice)
        : null;

    // 2. Create Project with native Prisma nested writes
    const imported = await db.project.create({
      data: {
        title: data.title,
        slug: finalSlug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        projectType: data.projectType || null,
        demoUrl: data.demoUrl || null,
        priceMode: data.priceMode,
        price: data.price ?? null,
        originalPrice: validOriginalPrice,
        status: requestedStatus,
        featured: false,
        whatsIncluded: data.whatsIncluded || [],
        categoryId,
        providerId: partner.id,
        features: {
          create: normalizedFeatures.map((f) => ({
            feature: f.feature,
            sortOrder: f.sortOrder,
          })),
        },
        specifications: {
          create: normalizedSpecs.map((s) => ({
            key: s.key,
            value: s.value,
            sortOrder: s.sortOrder,
          })),
        },
        faqs: {
          create: normalizedFaqs.map((faq) => ({
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
          })),
        },
        technologies: {
          create: techIds.map((tId) => ({
            technologyId: tId,
          })),
        },
        images: {
          create: normalizedImages.map((img) => ({
            url: img.url,
            storageKey: `import-img-${Date.now()}-${img.sortOrder}`,
            altText: img.altText,
            isPrimary: img.isPrimary,
            sortOrder: img.sortOrder,
          })),
        },
      },
    });

    // 4. Log audit trail
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PARTNER_SOLUTION_IMPORTED",
        entityType: "Project",
        entityId: imported.id,
        details: {
          title: imported.title,
          slug: imported.slug,
          partnerId: partner.id,
          status: imported.status,
          source: "AI_JSON_IMPORT",
        },
      },
    }).catch(() => null);

    // Revalidate paths
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${imported.slug}`);
    revalidatePath("/partner/solutions");

    return NextResponse.json({
      success: true,
      project: {
        id: imported.id,
        slug: imported.slug,
        title: imported.title,
        status: imported.status,
      },
    });
  } catch (error: any) {
    console.error("Partner solution import error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process solution import" },
      { status: 500 }
    );
  }
}
