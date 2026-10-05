// app/api/partner/solutions/[id]/route.ts
// Updates or deletes a partner's own solution.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth/auth";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { slugify } from "@/lib/utils/slug";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";
import { canPublishForProvider, providerPublicationError } from "@/lib/providers/publication-eligibility";
import {
  assertPartnerCanChangeStatus,
  ProjectOwnershipError,
} from "@/lib/auth/project-permissions";

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
    const partner = await resolvePartnerForUser(session.user);

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

  // Request size limit: allow up to 10MB for inline screenshot fallbacks
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const { id } = await params;

  try {
    await ensureAdditiveSchema();
    const partner = await resolvePartnerForUser(session.user);

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
      slug,
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

    // Phase 3: Partner cannot flip status to PUBLISHED if an admin placed a moderation hold
    if (!session.user.isAdmin) {
      try {
        assertPartnerCanChangeStatus(existing as any, data.status);
      } catch (err) {
        if (err instanceof ProjectOwnershipError) {
          return NextResponse.json({ error: err.message }, { status: err.status });
        }
        throw err;
      }
    }

    if (data.status === "PUBLISHED") {
      const publishingProvider = await db.projectProvider.findUnique({
        where: { id: existing.providerId },
        select: {
          isActive: true,
          applicationStatus: true,
          providerConsentConfirmed: true,
          removedAt: true,
        },
      });
      if (!canPublishForProvider(publishingProvider)) {
        return NextResponse.json({ error: providerPublicationError }, { status: 403 });
      }
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

    const rawTechIds: string[] = Array.isArray(body.technologyIds) ? body.technologyIds : [];
    const rawTechNames: string[] = Array.isArray(body.technologies) ? body.technologies : [];
    const rawTechList: string[] = (
      rawTechIds.length > 0 ? rawTechIds : rawTechNames
    ).slice(0, 20);

    const resolvedTechIdSet = new Set<string>();
    for (let idx = 0; idx < rawTechList.length; idx++) {
      const item = rawTechList[idx];
      if (!item || typeof item !== "string") continue;
      const trimmed = item.trim();
      if (!trimmed) continue;

      const existingById = await db.technology.findUnique({ where: { id: trimmed } }).catch(() => null);
      if (existingById) {
        resolvedTechIdSet.add(existingById.id);
        continue;
      }

      const candidateName =
        typeof rawTechNames[idx] === "string" && rawTechNames[idx].trim()
          ? rawTechNames[idx].trim()
          : trimmed;
      const techSlug = slugify(candidateName) || `tech-${Date.now()}-${idx}`;

      const existingByName = await db.technology
        .findFirst({
          where: {
            OR: [
              { name: { equals: candidateName, mode: "insensitive" } },
              { slug: techSlug },
            ],
          },
        })
        .catch(() => null);

      if (existingByName) {
        resolvedTechIdSet.add(existingByName.id);
      } else {
        const newTech = await db.technology
          .create({
            data: {
              name: candidateName,
              slug: techSlug,
              isActive: true,
            },
          })
          .catch(() => null);
        if (newTech) {
          resolvedTechIdSet.add(newTech.id);
        }
      }
    }
    const resolvedTechIds = Array.from(resolvedTechIdSet);

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

    // Atomically execute updates and audit log with native Prisma nested writes (Issue 48 / P2028 fix)
    const updated = await db.project.update({
      where: { id },
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        status: data.status,
        priceMode: data.priceMode,
        price: data.price,
        originalPrice: data.priceMode === "FIXED" && data.originalPrice ? data.originalPrice : null,
        priceQualifier: data.priceQualifier ?? "NONE",
        dealType: effectiveDealType,
        dealLabel: effectiveDealType === "CUSTOM" ? (data.dealLabel ?? null) : null,
        dealStartsAt: data.priceMode === "FIXED" && data.dealStartsAt ? data.dealStartsAt : null,
        dealEndsAt: data.priceMode === "FIXED" && data.dealEndsAt ? data.dealEndsAt : null,
        demoUrl: data.demoUrl || null,
        projectType: data.projectType,
        whatsIncluded: data.whatsIncluded,
        categoryId: data.categoryId,
        // Homepage promotion is a moderation decision and is admin-controlled.
        featured:
          session.user.isAdmin && typeof body.featured === "boolean"
            ? body.featured
            : existing.featured,
        ...(Array.isArray(body.features) && {
          features: {
            deleteMany: {},
            create: features.map((f, i) => ({
              feature: f.feature,
              sortOrder: f.sortOrder ?? i + 1,
            })),
          },
        }),
        ...(Array.isArray(body.specifications) && {
          specifications: {
            deleteMany: {},
            create: specifications.map((s, i) => ({
              key: s.key,
              value: s.value,
              sortOrder: s.sortOrder ?? i + 1,
            })),
          },
        }),
        ...(Array.isArray(body.faqs) && {
          faqs: {
            deleteMany: {},
            create: faqs.map((faq, i) => ({
              question: faq.question,
              answer: faq.answer,
              sortOrder: faq.sortOrder ?? i + 1,
            })),
          },
        }),
        ...((Array.isArray(body.technologyIds) || Array.isArray(body.technologies)) && {
          technologies: {
            deleteMany: {},
            create: resolvedTechIds.map((techId) => ({
              technologyId: techId,
            })),
          },
        }),
        ...(sanitizedImages.length > 0 && {
          images: {
            deleteMany: {},
            create: sanitizedImages.map((img, i) => ({
              url: img.url.trim(),
              storageKey: img.storageKey || `img-${Date.now()}-${i}`,
              altText: img.altText || data.title,
              isPrimary: img.isPrimary ?? (i === 0),
              sortOrder: img.sortOrder ?? i + 1,
            })),
          },
        }),
      },
    });

    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PARTNER_SOLUTION_UPDATED",
        entityType: "Project",
        entityId: id,
        details: {
          title: updated.title,
          status: updated.status,
          partnerId: partner.id,
        },
      },
    }).catch(() => null);

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
    const partner = await resolvePartnerForUser(session.user);

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
      // 1. Disassociate from transactions so transaction receipts remain intact
      await tx.transaction.updateMany({
        where: { solutionId: id },
        data: { solutionId: null },
      });

      // 2. Delete child inquiries
      await tx.inquiry.deleteMany({
        where: { projectId: id },
      });

      // 3. Delete the project (cascade removes images, features, specs, faqs, technologies)
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

    // Revalidate public catalog, homepage, sitemap, and dashboards
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${existing.slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/partner/solutions");
    revalidatePath("/admin/projects");

    return NextResponse.json({ success: true, message: "Solution deleted successfully" });
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
    const partner = await resolvePartnerForUser(session.user);

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

    // Phase 4: Quick offer actions (Extend / End offer now / Remove offer)
    if (body.offerAction) {
      const action = String(body.offerAction);
      const regularPrice =
        existing.originalPrice != null
          ? Number(existing.originalPrice)
          : existing.price != null
          ? Number(existing.price)
          : null;

      if (action === "end_now" || action === "remove_offer") {
        const updated = await db.project.update({
          where: { id },
          data: {
            price: regularPrice,
            originalPrice: null,
            dealType: "NONE",
            dealLabel: null,
            dealStartsAt: null,
            dealEndsAt: null,
          },
        });
        try {
          revalidatePath("/");
          revalidatePath("/projects");
          revalidatePath(`/projects/${updated.slug}`);
          revalidatePath("/partner/solutions");
        } catch {
          // ignore
        }
        return NextResponse.json({
          project: updated,
          success: true,
          message:
            action === "end_now"
              ? "Offer ended. Price reverted to regular price."
              : "Offer removed.",
        });
      }

      if (action === "extend") {
        const nextEndsAt = body.dealEndsAt ? new Date(body.dealEndsAt) : null;
        if (!nextEndsAt || Number.isNaN(nextEndsAt.getTime()) || nextEndsAt.getTime() <= Date.now()) {
          return NextResponse.json(
            { error: "New offer end date must be in the future." },
            { status: 400 }
          );
        }
        const updated = await db.project.update({
          where: { id },
          data: { dealEndsAt: nextEndsAt },
        });
        try {
          revalidatePath("/");
          revalidatePath("/projects");
          revalidatePath(`/projects/${updated.slug}`);
          revalidatePath("/partner/solutions");
        } catch {
          // ignore
        }
        return NextResponse.json({
          project: updated,
          success: true,
          message: "Offer end date extended.",
        });
      }
    }

    const updateData: { featured?: boolean; status?: "DRAFT" | "PUBLISHED" | "ARCHIVED" } = {};

    if (session.user.isAdmin && typeof body.featured === "boolean") {
      updateData.featured = body.featured;
    }

    if (body.status && ["DRAFT", "PUBLISHED", "ARCHIVED"].includes(body.status)) {
      if (!session.user.isAdmin) {
        try {
          assertPartnerCanChangeStatus(existing as any, body.status);
        } catch (err) {
          if (err instanceof ProjectOwnershipError) {
            return NextResponse.json({ error: err.message }, { status: err.status });
          }
          throw err;
        }
      }

      if (body.status === "PUBLISHED") {
        const publishingProvider = await db.projectProvider.findUnique({
          where: { id: existing.providerId },
          select: {
            isActive: true,
            applicationStatus: true,
            providerConsentConfirmed: true,
            removedAt: true,
          },
        });
        if (!canPublishForProvider(publishingProvider)) {
          return NextResponse.json({ error: providerPublicationError }, { status: 403 });
        }
      }
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
