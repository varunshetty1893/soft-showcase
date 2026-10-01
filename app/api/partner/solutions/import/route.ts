// app/api/partner/solutions/import/route.ts
// Solution Partner API endpoint for validating, previewing, and importing project JSON.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { auth } from "@/lib/auth/auth";
import { PartnerSolutionImportSchema } from "@/lib/validation/project-import.schema";
import { slugify, generateUniqueSlug } from "@/lib/utils/slug";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    // 7. Generate prospective slug
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
          status: data.status || "PUBLISHED",
          featured: Boolean(data.featured),
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
          new: newTechNames,
        },
      });
    }

    // ── Execute Import ──────────────────────────────────────────────────────
    const finalSlug = await generateUniqueSlug(data.title, async (s) => {
      const found = await db.project.findUnique({ where: { slug: s } });
      return Boolean(found);
    });

    const imported = await db.$transaction(async (tx) => {
      // 1. Resolve Category
      let categoryId = existingCategory?.id;
      if (!categoryId) {
        const newCat = await tx.category.create({
          data: {
            name: categoryName,
            slug: categorySlug || `cat-${Date.now()}`,
            isActive: true,
          },
        });
        categoryId = newCat.id;
      }

      // 2. Resolve & create missing Technologies
      const techIds: string[] = existingTechnologies.map((t) => t.id);
      for (const newName of newTechNames) {
        const createdTech = await tx.technology.create({
          data: {
            name: newName,
            slug: slugify(newName) || `tech-${Date.now()}`,
            isActive: true,
          },
        });
        techIds.push(createdTech.id);
      }

      // 3. Create Project
      const project = await tx.project.create({
        data: {
          title: data.title,
          slug: finalSlug,
          shortDescription: data.shortDescription,
          fullDescription: data.fullDescription,
          projectType: data.projectType || null,
          demoUrl: data.demoUrl || null,
          priceMode: data.priceMode,
          price: data.price ?? null,
          status: data.status || "PUBLISHED",
          featured: Boolean(data.featured),
          whatsIncluded: data.whatsIncluded || [],
          categoryId,
          providerId: partner.id,
        },
      });

      // 4. Create Features
      if (normalizedFeatures.length > 0) {
        await tx.projectFeature.createMany({
          data: normalizedFeatures.map((f) => ({
            projectId: project.id,
            feature: f.feature,
            sortOrder: f.sortOrder,
          })),
        });
      }

      // 5. Create Specifications
      if (normalizedSpecs.length > 0) {
        await tx.projectSpecification.createMany({
          data: normalizedSpecs.map((s) => ({
            projectId: project.id,
            key: s.key,
            value: s.value,
            sortOrder: s.sortOrder,
          })),
        });
      }

      // 6. Create FAQs
      if (normalizedFaqs.length > 0) {
        await tx.projectFaq.createMany({
          data: normalizedFaqs.map((faq) => ({
            projectId: project.id,
            question: faq.question,
            answer: faq.answer,
            sortOrder: faq.sortOrder,
          })),
        });
      }

      // 7. Create Technologies links
      if (techIds.length > 0) {
        await tx.projectTechnology.createMany({
          data: techIds.map((tId) => ({
            projectId: project.id,
            technologyId: tId,
          })),
        });
      }

      // 8. Log audit trail
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PARTNER_SOLUTION_IMPORTED",
          entityType: "Project",
          entityId: project.id,
          details: {
            title: project.title,
            slug: project.slug,
            partnerId: partner.id,
            status: project.status,
            source: "AI_JSON_IMPORT",
          },
        },
      }).catch(() => null);

      return project;
    });

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
