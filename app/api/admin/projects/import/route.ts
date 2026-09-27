// app/api/admin/projects/import/route.ts
// Admin API endpoint for validating, previewing, and importing AI-generated project JSON.
// Source of truth: docs/22-project-import.md, docs/23-project-import-template.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse, getCurrentUser } from "@/lib/auth/session";
import { ProjectImportSchema } from "@/lib/validation/project-import.schema";
import { slugify, generateUniqueSlug } from "@/lib/utils/slug";

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
    const user = await getCurrentUser();

    const body = await request.json();
    const isPreview = Boolean(body.previewOnly || request.nextUrl.searchParams.get("action") === "preview");

    // 1. Zod schema validation
    const parseResult = ProjectImportSchema.safeParse(body.project || body);
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

    // 3. Normalize provider
    const providerEmail = (data.provider?.email || data.providerEmail || "").toLowerCase().trim();
    const providerName = (data.provider?.name || providerEmail.split("@")[0]).trim();
    const providerWhatsapp = data.provider?.whatsapp?.trim() || null;

    // 4. Normalize technologies
    const rawTechs = [...(data.technologies || []), ...(data.technologySlugs || [])]
      .map((t) => t.trim())
      .filter(Boolean);
    const techNames = Array.from(new Set(rawTechs));

    // 5. Normalize features
    let normalizedFeatures: Array<{ feature: string; sortOrder: number }> = [];
    if (Array.isArray(data.features)) {
      normalizedFeatures = data.features.map((item, idx) => {
        if (typeof item === "string") {
          return { feature: item.trim(), sortOrder: idx };
        }
        return { feature: item.feature.trim(), sortOrder: item.sortOrder ?? idx };
      });
    }

    // 6. Normalize specifications
    let normalizedSpecs: Array<{ key: string; value: string; sortOrder: number }> = [];
    if (data.specifications && !Array.isArray(data.specifications)) {
      normalizedSpecs = Object.entries(data.specifications).map(([key, value], idx) => ({
        key: key.trim(),
        value: String(value).trim(),
        sortOrder: idx,
      }));
    } else if (Array.isArray(data.specifications)) {
      normalizedSpecs = (
        data.specifications as Array<{ key: string; value: string; sortOrder?: number }>
      ).map((item, idx) => ({
        key: String(item.key).trim(),
        value: String(item.value).trim(),
        sortOrder: item.sortOrder ?? idx,
      }));
    }

    // 7. Normalize FAQs
    const rawFaqs = data.faq && data.faq.length > 0 ? data.faq : data.faqs || [];
    const normalizedFaqs = rawFaqs.map((f, idx) => ({
      question: f.question.trim(),
      answer: f.answer.trim(),
      sortOrder: f.sortOrder ?? idx,
    }));

    // 8. Generate prospective slug
    const targetSlug = slugify(data.title);

    // 9. Inspect existing database entities
    const existingCategory = await db.category.findFirst({
      where: {
        OR: [
          { slug: categorySlug },
          { name: { equals: categoryName, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, slug: true },
    });

    const existingProvider = await db.projectProvider.findUnique({
      where: { email: providerEmail },
      select: {
        id: true,
        displayName: true,
        email: true,
        isActive: true,
        providerConsentConfirmed: true,
      },
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

    // ── If preview only, return preview breakdown ──
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
        provider: {
          name: providerName,
          email: providerEmail,
          whatsapp: providerWhatsapp,
          exists: Boolean(existingProvider),
          id: existingProvider?.id ?? null,
          consentConfirmed: existingProvider?.providerConsentConfirmed ?? false,
        },
        technologies: {
          total: techNames.length,
          existing: existingTechnologies.map((t) => t.name),
          new: newTechNames,
        },
      });
    }

    // ── Execute Import as DRAFT ──────────────────────────────────────────────

    // Ensure unique slug
    const uniqueSlug = await generateUniqueSlug(data.title, async (s) => {
      const p = await db.project.findUnique({ where: { slug: s } });
      return Boolean(p);
    });

    // Resolve or create category
    let finalCategory = existingCategory;
    if (!finalCategory) {
      finalCategory = await db.category.create({
        data: {
          name: categoryName,
          slug: categorySlug,
        },
        select: { id: true, name: true, slug: true },
      });
    }

    // Resolve or create provider
    let finalProvider = existingProvider;
    let providerCreated = false;
    if (!finalProvider) {
      finalProvider = await db.projectProvider.create({
        data: {
          displayName: providerName,
          email: providerEmail,
          whatsappNumber: providerWhatsapp,
          showWhatsapp: true,
          showEmail: false,
          isActive: true,
          providerConsentConfirmed: false,
          providerConsentConfirmedAt: null,
        },
        select: {
          id: true,
          displayName: true,
          email: true,
          isActive: true,
          providerConsentConfirmed: true,
        },
      });
      providerCreated = true;
    }

    // Resolve or create technologies
    const allTechIds: string[] = existingTechnologies.map((t) => t.id);
    for (const newTechName of newTechNames) {
      const createdTech = await db.technology.create({
        data: {
          name: newTechName,
          slug: slugify(newTechName),
        },
        select: { id: true },
      });
      allTechIds.push(createdTech.id);
    }

    // Create project as DRAFT
    const project = await db.project.create({
      data: {
        title: data.title,
        slug: uniqueSlug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        projectType: data.projectType || null,
        demoUrl: data.demoUrl || null,
        priceMode: data.priceMode,
        price: data.price ?? null,
        whatsIncluded: data.whatsIncluded || [],
        status: "DRAFT",
        categoryId: finalCategory.id,
        providerId: finalProvider.id,
        features: {
          create: normalizedFeatures,
        },
        specifications: {
          create: normalizedSpecs,
        },
        faqs: {
          create: normalizedFaqs,
        },
        technologies: {
          create: allTechIds.map((tId) => ({ technologyId: tId })),
        },
      },
    });

    // Record in audit log
    try {
      await db.auditLog.create({
        data: {
          userId: user?.id ?? null,
          action: "PROJECT_IMPORT",
          entityType: "Project",
          entityId: project.id,
          details: {
            title: project.title,
            slug: project.slug,
            providerId: finalProvider.id,
            providerCreated,
            categoryName: finalCategory.name,
            technologiesCount: allTechIds.length,
          },
        },
      });
    } catch (auditErr) {
      console.warn("Could not write to auditLog:", auditErr);
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: project.id,
          slug: project.slug,
          title: project.title,
          providerCreated,
          providerName: finalProvider.displayName,
          categoryName: finalCategory.name,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("POST /api/admin/projects/import error:", error);
    return NextResponse.json(
      { error: "Failed to import project" },
      { status: 500 }
    );
  }
}
