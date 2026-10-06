// app/api/admin/projects/[id]/route.ts
// Admin: get, update, moderate, and delete a single project.
// Enforces Phase 3 (Partner-owned project content protection & moderation panel)
// and Phase 4 (Pricing offers & quick offer actions).

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db, ensureAdditiveSchema } from "@/lib/db/client";
import { ProjectUpdateSchema } from "@/lib/validation/project.schema";
import { getAdminProjectById } from "@/lib/db/queries/admin-projects";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import {
  isPartnerOwnedProject,
  assertAdminCanUpdate,
  ProjectOwnershipError,
} from "@/lib/auth/project-permissions";
import { writeAuditLog } from "@/lib/db/audit";
import { sendPartnerModerationEmail } from "@/lib/email/email-service";
import { slugify } from "@/lib/utils/slug";
import { canPublishForProvider, providerPublicationError } from "@/lib/providers/publication-eligibility";

type Params = { params: Promise<{ id: string }> };

function safeRevalidate(slug?: string) {
  try {
    revalidatePath("/");
    revalidatePath("/projects");
    if (slug) revalidatePath(`/projects/${slug}`);
    revalidatePath("/sitemap.xml");
    revalidatePath("/admin/projects");
    revalidatePath("/partner/solutions");
  } catch {
    // Ignore outside Next request context
  }
}

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
    const actorId = session.user.id;
    await ensureAdditiveSchema();

    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const existing = await getAdminProjectById(id);
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const partnerOwned = isPartnerOwnedProject(existing, actorId);

    // ── Phase 3: Enforce strict whitelist on Partner-Owned Projects ──────────
    if (partnerOwned) {
      try {
        assertAdminCanUpdate(existing, body, actorId);
      } catch (err) {
        if (err instanceof ProjectOwnershipError) {
          if (err.status === 403) {
            await writeAuditLog({
              actorId,
              action: "ADMIN_EDIT_DENIED",
              entityType: "Project",
              entityId: id,
              metadata: {
                title: existing.title,
                disallowedFields: err.disallowedFields,
              },
            });
          }
          return NextResponse.json(
            {
              error: err.message,
              disallowedFields: err.disallowedFields,
            },
            { status: err.status }
          );
        }
        throw err;
      }

      const rawNextStatus = (body.status ?? body.moderationStatus) as string | undefined;
      let nextDbStatus: "DRAFT" | "PUBLISHED" | "ARCHIVED" | undefined;
      if (rawNextStatus) {
        const upper = rawNextStatus.toUpperCase();
        if (upper === "PUBLISHED") nextDbStatus = "PUBLISHED";
        else if (upper === "ARCHIVED") nextDbStatus = "ARCHIVED";
        else if (upper === "DRAFT" || upper === "UNPUBLISHED" || upper === "REJECTED") {
          nextDbStatus = "DRAFT";
        }
      }

      const nextFeatured =
        typeof body.featured === "boolean"
          ? body.featured
          : typeof body.isFeatured === "boolean"
          ? body.isFeatured
          : undefined;

      const nextFeaturedOrder =
        typeof body.featuredOrder === "number"
          ? body.featuredOrder
          : typeof body.displayOrder === "number"
          ? body.displayOrder
          : undefined;

      const nextCategoryId =
        typeof body.categoryId === "string" && body.categoryId.trim()
          ? body.categoryId.trim()
          : typeof body.category === "string" && body.category.trim()
          ? body.category.trim()
          : undefined;

      const noteInput =
        body.moderationNote !== undefined
          ? String(body.moderationNote || "").trim()
          : body.reason !== undefined
          ? String(body.reason || "").trim()
          : undefined;

      const isRequestingChanges = Boolean(body.requestChanges);
      const isLiftingHold = nextDbStatus === "PUBLISHED" && !isRequestingChanges;

      const beforeWhitelist = {
        featured: existing.featured,
        featuredOrder: (existing as any).featuredOrder ?? 0,
        status: existing.status,
        categoryId: existing.categoryId,
        moderationNote: (existing as any).moderationNote ?? null,
      };

      const updateData: Record<string, unknown> = {};
      if (nextFeatured !== undefined) updateData.featured = nextFeatured;
      if (nextFeaturedOrder !== undefined) updateData.featuredOrder = nextFeaturedOrder;
      if (nextCategoryId !== undefined) updateData.categoryId = nextCategoryId;
      if (nextDbStatus !== undefined) updateData.status = nextDbStatus;

      if (isRequestingChanges || (nextDbStatus && nextDbStatus !== "PUBLISHED" && noteInput)) {
        updateData.moderationNote = noteInput || (existing as any).moderationNote || null;
        updateData.moderatedAt = new Date();
        updateData.moderatedById = actorId;
      } else if (isLiftingHold) {
        updateData.moderationNote = noteInput || null;
        updateData.moderatedAt = null;
        updateData.moderatedById = null;
      } else if (noteInput !== undefined) {
        updateData.moderationNote = noteInput || null;
        updateData.moderatedAt = noteInput ? new Date() : null;
        updateData.moderatedById = noteInput ? actorId : null;
      }

      const updated = await db.project.update({
        where: { id },
        data: updateData,
      });

      const afterWhitelist = {
        featured: updated.featured,
        featuredOrder: (updated as any).featuredOrder ?? 0,
        status: updated.status,
        categoryId: updated.categoryId,
        moderationNote: (updated as any).moderationNote ?? null,
      };

      const featuredChanged =
        beforeWhitelist.featured !== afterWhitelist.featured ||
        beforeWhitelist.featuredOrder !== afterWhitelist.featuredOrder;

      const moderationChanged =
        beforeWhitelist.status !== afterWhitelist.status ||
        beforeWhitelist.categoryId !== afterWhitelist.categoryId ||
        beforeWhitelist.moderationNote !== afterWhitelist.moderationNote ||
        isRequestingChanges;

      if (featuredChanged) {
        await writeAuditLog({
          actorId,
          action: "PROJECT_FEATURED_CHANGED",
          entityType: "Project",
          entityId: id,
          metadata: {
            before: {
              featured: beforeWhitelist.featured,
              featuredOrder: beforeWhitelist.featuredOrder,
            },
            after: {
              featured: afterWhitelist.featured,
              featuredOrder: afterWhitelist.featuredOrder,
            },
          },
        });
      }

      if (moderationChanged) {
        await writeAuditLog({
          actorId,
          action: "PROJECT_MODERATED",
          entityType: "Project",
          entityId: id,
          metadata: {
            before: beforeWhitelist,
            after: afterWhitelist,
            requestChanges: isRequestingChanges,
          },
        });
      }

      // Send escaped moderation / request-changes email to partner when note is provided
      const partnerEmail = existing.provider?.email;
      const partnerName = existing.provider?.displayName || "Partner";
      const partnerUserId = (existing.provider as any)?.userId as string | undefined;
      if (
        noteInput &&
        (isRequestingChanges || (nextDbStatus && nextDbStatus !== "PUBLISHED"))
      ) {
        const actionLabel = isRequestingChanges
          ? "Changes Requested"
          : rawNextStatus?.toUpperCase() === "REJECTED"
          ? "Rejected"
          : "Unpublished";

        if (partnerEmail) {
          await sendPartnerModerationEmail({
            to: partnerEmail,
            partnerName,
            projectTitle: existing.title,
            projectId: existing.id,
            actionLabel,
            note: noteInput,
          }).catch((e) => console.error("[Moderation Email] Error:", e));
        }

        // Also deliver an in-app Support / Moderation notification thread to the Partner Portal
        if (partnerUserId && (db as any).supportTicket) {
          try {
            const subjectLine = `Moderation Notice (${actionLabel}): ${existing.title}`;
            const existingTicket = await db.supportTicket.findFirst({
              where: {
                requesterId: partnerUserId,
                subject: subjectLine,
                status: { notIn: ["RESOLVED", "CLOSED"] },
              },
              orderBy: { updatedAt: "desc" },
            });

            if (existingTicket) {
              await db.supportMessage.create({
                data: {
                  ticketId: existingTicket.id,
                  senderId: actorId,
                  senderName: "Platform Moderation Team",
                  senderRole: "admin",
                  message: noteInput,
                },
              });
              await db.supportTicket.update({
                where: { id: existingTicket.id },
                data: { status: "WAITING_CUSTOMER", updatedAt: new Date() },
              });
            } else {
              const ticketNumber = `MOD-${Date.now().toString(36).toUpperCase()}-${Math.random()
                .toString(36)
                .slice(2, 5)
                .toUpperCase()}`;
              await db.supportTicket.create({
                data: {
                  ticketNumber,
                  requesterId: partnerUserId,
                  requesterRole: "solution_partner",
                  subject: subjectLine,
                  category: "SOLUTION_MODERATION",
                  description: `Admin moderation update (${actionLabel}) for solution "${existing.title}":\n\n${noteInput}`,
                  status: "WAITING_CUSTOMER",
                  priority: "HIGH",
                  messages: {
                    create: {
                      senderId: actorId,
                      senderName: "Platform Moderation Team",
                      senderRole: "admin",
                      message: noteInput,
                    },
                  },
                },
              });
            }
            revalidatePath("/partner/support");
          } catch (ticketErr) {
            console.error("[Moderation In-App Ticket] Error:", ticketErr);
          }
        }
      }

      safeRevalidate(updated.slug);
      return NextResponse.json({
        success: true,
        message: isRequestingChanges
          ? "Change request saved and emailed to the partner."
          : "Moderation settings updated successfully.",
        project: updated,
      });
    }

    // ── Phase 4: Quick Offer Actions on Admin-Managed Projects ───────────────
    if (body.offerAction) {
      const action = String(body.offerAction);
      const regularPrice =
        existing.originalPrice != null
          ? Number(existing.originalPrice)
          : existing.price != null
          ? Number(existing.price)
          : null;

      if (action === "end_now" || action === "remove_offer") {
        // End offer now or Remove offer: selling price reverts to regularPrice, offer fields cleared
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
        safeRevalidate(updated.slug);
        return NextResponse.json({
          success: true,
          message:
            action === "end_now"
              ? "Offer ended. Price reverted to regular price."
              : "Offer removed.",
          project: updated,
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
          data: {
            dealEndsAt: nextEndsAt,
          },
        });
        safeRevalidate(updated.slug);
        return NextResponse.json({
          success: true,
          message: "Offer end date extended.",
          project: updated,
        });
      }
    }

    // ── Standard Full Update for Admin-Managed Projects ──────────────────────
    if (!body.slug && body.title) {
      body.slug = slugify(body.title as string);
    }

    if (body.priceMode === "CONTACT" || body.priceMode === "FREE") {
      body.price = null;
      body.originalPrice = null;
      body.dealType = "NONE";
      body.dealLabel = null;
      body.dealStartsAt = null;
      body.dealEndsAt = null;
    } else if (body.priceMode && body.priceMode !== "FIXED") {
      body.originalPrice = null;
      body.dealType = "NONE";
      body.dealLabel = null;
      body.dealStartsAt = null;
      body.dealEndsAt = null;
    } else if (
      body.originalPrice === "" ||
      (body.originalPrice != null &&
        body.price != null &&
        Number(body.originalPrice) === Number(body.price))
    ) {
      body.originalPrice = null;
    } else if (body.originalPrice !== undefined && body.originalPrice !== null) {
      body.originalPrice = Number(body.originalPrice);
    }

    const parsed = ProjectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

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

    const features: { feature: string; sortOrder?: number }[] | undefined = Array.isArray(
      body.features
    )
      ? body.features
      : undefined;
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

    let resolvedTechIds: string[] | undefined = undefined;
    if (technologyIds !== undefined) {
      resolvedTechIds = [];
      for (const item of technologyIds) {
        if (!item || typeof item !== "string") continue;
        const trimmed = item.trim();
        if (!trimmed) continue;
        const existingById = await db.technology
          .findUnique({ where: { id: trimmed } })
          .catch(() => null);
        if (existingById) {
          resolvedTechIds.push(existingById.id);
          continue;
        }
        const techSlug = trimmed
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const existingByName = await db.technology
          .findFirst({
            where: {
              OR: [
                { name: { equals: trimmed, mode: "insensitive" } },
                { slug: techSlug },
              ],
            },
          })
          .catch(() => null);
        if (existingByName) {
          resolvedTechIds.push(existingByName.id);
        } else {
          const newTech = await db.technology
            .create({
              data: {
                name: trimmed,
                slug: techSlug || `tech-${Date.now()}`,
                isActive: true,
              },
            })
            .catch(() => null);
          if (newTech) resolvedTechIds.push(newTech.id);
        }
      }
    }

    if ((status ?? existing.status) === "PUBLISHED") {
      const targetProviderId = providerId ?? existing.providerId;
      const provider = targetProviderId
        ? await db.projectProvider.findUnique({
            where: { id: targetProviderId },
            select: {
              isActive: true,
              applicationStatus: true,
              providerConsentConfirmed: true,
              removedAt: true,
            },
          })
        : null;
      if (!canPublishForProvider(provider)) {
        return NextResponse.json({ error: providerPublicationError }, { status: 422 });
      }
    }

    const effectiveMode = priceMode ?? existing.priceMode;
    const effectiveDealType =
      effectiveMode === "FIXED" ? (dealType ?? (existing as any).dealType ?? "NONE") : "NONE";

    const project = await db.project.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(shortDescription !== undefined && { shortDescription }),
        ...(fullDescription !== undefined && { fullDescription }),
        ...(status !== undefined && { status }),
        ...(featured !== undefined && { featured }),
        ...(featuredOrder !== undefined && { featuredOrder }),
        ...(priceMode !== undefined && { priceMode }),
        ...((price !== undefined || priceMode !== undefined) && {
          price:
            effectiveMode === "CONTACT" || effectiveMode === "FREE"
              ? null
              : (price ?? null),
        }),
        ...((originalPrice !== undefined || priceMode !== undefined) && {
          originalPrice: effectiveMode === "FIXED" ? (originalPrice ?? null) : null,
        }),
        ...(priceQualifier !== undefined && { priceQualifier }),
        ...((dealType !== undefined || priceMode !== undefined) && {
          dealType: effectiveDealType,
          dealLabel:
            effectiveDealType === "CUSTOM"
              ? (dealLabel ?? (existing as any).dealLabel ?? null)
              : null,
        }),
        ...(dealStartsAt !== undefined && {
          dealStartsAt: effectiveMode === "FIXED" ? dealStartsAt : null,
        }),
        ...(dealEndsAt !== undefined && {
          dealEndsAt: effectiveMode === "FIXED" ? dealEndsAt : null,
        }),
        ...(demoUrl !== undefined && { demoUrl: demoUrl ?? null }),
        ...(projectType !== undefined && { projectType: projectType ?? null }),
        ...(whatsIncluded !== undefined && { whatsIncluded }),
        ...(categoryId !== undefined && { categoryId }),
        ...(providerId !== undefined && { providerId }),
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

    await writeAuditLog({
      actorId,
      action: "PROJECT_UPDATED",
      entityType: "Project",
      entityId: project.id,
      metadata: { title: project.title, status: project.status },
    });

    safeRevalidate(project.slug);

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      project,
    });
  } catch (error: any) {
    if (error instanceof AuthError) return authErrorResponse(error);
    if (error?.code === "P2002" || error?.message?.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "A project with this slug already exists" },
        { status: 409 }
      );
    }
    console.error("PATCH /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

// ─── DELETE /api/admin/projects/[id] ─────────────────────────────────────────

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdmin();
    const { id } = await params;

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const searchParams = req.nextUrl?.searchParams;
    const action = searchParams?.get("action");

    if (action === "archive") {
      const project = await db.project.update({
        where: { id },
        data: { status: "ARCHIVED" },
      });

      await writeAuditLog({
        actorId: session.user.id,
        action: "PROJECT_ARCHIVED",
        entityType: "Project",
        entityId: project.id,
        metadata: { title: project.title },
      });

      safeRevalidate(existing.slug);
      return NextResponse.json({ success: true, message: "Project archived successfully" });
    }

    await db.$transaction(async (tx) => {
      await tx.transaction.updateMany({
        where: { solutionId: id },
        data: { solutionId: null },
      });

      await tx.inquiry.deleteMany({
        where: { projectId: id },
      });

      await tx.project.delete({
        where: { id },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "PROJECT_DELETED",
          entityType: "Project",
          entityId: id,
          details: { title: existing.title, slug: existing.slug },
        },
      });
    });

    safeRevalidate(existing.slug);

    return NextResponse.json({ success: true, message: "Project deleted successfully" });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("DELETE /api/admin/projects/[id] error:", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }
}
