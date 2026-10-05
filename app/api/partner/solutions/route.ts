// app/api/partner/solutions/route.ts
// Handles creating and listing solutions for the authenticated partner.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { generateUniqueSlug } from "@/lib/utils/slug";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await ensureAdditiveSchema();
    const partner = await resolvePartnerForUser(session.user);

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

  // Request size limit: allow up to 10MB for inline screenshot fallbacks
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  try {
    await ensureAdditiveSchema();
    const partner = await resolvePartnerForUser(session.user);

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const body = await req.json();

    // Compute unique slug with race condition protection (Issue 53)
    const finalSlug = await generateUniqueSlug(body.title || "solution", async (s) => {
      const found = await db.project.findUnique({ where: { slug: s } });
      return Boolean(found);
    });

    // Normalize price: if CONTACT or FREE, must be null
    let price: number | null = null;
    if (body.priceMode === "FIXED" || body.priceMode === "STARTING_FROM") {
      const num = Number(body.price);
      price = !isNaN(num) && num > 0 ? num : null;
    }

    // Normalize originalPrice: only valid in FIXED mode when strictly greater than price
    let originalPrice: number | null = null;
    if (
      body.priceMode === "FIXED" &&
      body.originalPrice !== "" &&
      body.originalPrice !== null &&
      body.originalPrice !== undefined
    ) {
      const origNum = Number(body.originalPrice);
      if (!isNaN(origNum) && origNum > 0) {
        originalPrice = price !== null && origNum === price ? null : origNum;
      }
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

    // Sanitize features array (safe max 25)
    const sanitizedFeatures = Array.isArray(body.features)
      ? body.features
          .map((f: any) => {
            const text = typeof f === "string" ? f : f?.feature || f?.title || f?.name || "";
            return typeof text === "string" && text.trim().length >= 2 ? { feature: text.trim() } : null;
          })
          .filter(Boolean)
          .slice(0, 25)
      : undefined;

    // Sanitize whatsIncluded array (safe max 20)
    const sanitizedWhatsIncluded = Array.isArray(body.whatsIncluded)
      ? body.whatsIncluded
          .map((w: any) => (typeof w === "string" ? w.trim() : ""))
          .filter(Boolean)
          .slice(0, 20)
      : undefined;

    // Sanitize specifications array (safe max 25)
    const sanitizedSpecs = Array.isArray(body.specifications)
      ? body.specifications
          .filter((s: any) => s && s.key && String(s.key).trim() && s.value && String(s.value).trim())
          .map((s: any, idx: number) => ({
            key: String(s.key).trim(),
            value: String(s.value).trim(),
            sortOrder: idx + 1,
          }))
          .slice(0, 25)
      : undefined;

    // Sanitize faqs array (safe max 20)
    const sanitizedFaqs = Array.isArray(body.faqs)
      ? body.faqs
          .filter((f: any) => f && f.question && String(f.question).trim() && f.answer && String(f.answer).trim())
          .map((f: any, idx: number) => ({
            question: String(f.question).trim(),
            answer: String(f.answer).trim(),
            sortOrder: idx + 1,
          }))
          .slice(0, 20)
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
          .slice(0, 20)
      : undefined;

    const parsed = ProjectSchema.safeParse({
      ...body,
      ...(sanitizedFeatures !== undefined && { features: sanitizedFeatures }),
      ...(sanitizedWhatsIncluded !== undefined && { whatsIncluded: sanitizedWhatsIncluded }),
      ...(sanitizedSpecs !== undefined && { specifications: sanitizedSpecs }),
      ...(sanitizedFaqs !== undefined && { faqs: sanitizedFaqs }),
      ...(sanitizedTechnologies !== undefined && { technologies: sanitizedTechnologies }),
      slug: finalSlug,
      price,
      originalPrice,
      demoUrl,
      providerId: partner.id,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const friendlyFieldNames: Record<string, string> = {
        whatsIncluded: "What's Included",
        features: "Key Features",
        specifications: "Technical Specifications",
        faqs: "FAQs",
        technologies: "Technologies",
        title: "Solution Title",
        shortDescription: "Short Description",
        fullDescription: "Overview Description",
        categoryId: "Category",
        price: "Price",
        originalPrice: "Regular Price (Offer)",
        images: "Screenshots",
        demoUrl: "Demo URL",
      };
      const errorSummary =
        Object.entries(fieldErrors)
          .map(([k, msgs]) => {
            const label = friendlyFieldNames[k] || k;
            return `${label}: ${msgs?.join(", ")}`;
          })
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
      return NextResponse.json(
        { error: "Choose technologies from the administrator-curated list." },
        { status: 400 }
      );
    }

    const rawImages: { url: string; storageKey?: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[] = (
      Array.isArray(body.images) ? body.images : []
    ).slice(0, 15);

    const sanitizedImages = rawImages.filter((img) => img && typeof img.url === "string" && img.url.trim().length > 0);
    const primaryIndex = sanitizedImages.findIndex((img) => img.isPrimary);
    if (sanitizedImages.length > 0) {
      sanitizedImages.forEach((img, index) => {
        img.isPrimary = index === (primaryIndex >= 0 ? primaryIndex : 0);
      });
    }

    const effectiveDealType = data.priceMode === "FIXED" ? (data.dealType ?? "NONE") : "NONE";

    // Atomically create solution and audit log with native Prisma nested writes
    const newProject = await db.project.create({
      data: {
        title: data.title,
        slug: finalSlug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        status: data.status || "DRAFT",
        featured: false,
        priceMode: data.priceMode,
        price: data.priceMode === "CONTACT" || data.priceMode === "FREE" ? null : (data.price ?? null),
        originalPrice: data.priceMode === "FIXED" && data.originalPrice ? data.originalPrice : null,
        priceQualifier: data.priceQualifier ?? "NONE",
        dealType: effectiveDealType,
        dealLabel: effectiveDealType === "CUSTOM" ? (data.dealLabel ?? null) : null,
        dealStartsAt: data.priceMode === "FIXED" && data.dealStartsAt ? data.dealStartsAt : null,
        dealEndsAt: data.priceMode === "FIXED" && data.dealEndsAt ? data.dealEndsAt : null,
        demoUrl: data.demoUrl || null,
        projectType: data.projectType || null,
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

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PARTNER_SOLUTION_CREATED",
        entityType: "Project",
        entityId: newProject.id,
        details: {
          title: newProject.title,
          status: newProject.status,
          partnerId: partner.id,
        },
      },
    }).catch(() => null);

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
