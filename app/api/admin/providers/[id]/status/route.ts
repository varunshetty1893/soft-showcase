// app/api/admin/providers/[id]/status/route.ts
// Administrative partner approval, rejection, and verification management.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
import { createAuditLogTx } from "@/lib/db/audit";
import { PartnerStatusUpdateSchema } from "@/lib/validation/partner.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let session;
  try {
    session = await requireAdmin();
  } catch (e) {
    if (e instanceof AuthError) return authErrorResponse(e);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }
    const parsed = PartnerStatusUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { applicationStatus, rejectionReason, adminNotes, verificationStatus, verificationNotes } =
      parsed.data;

    const isApproving = applicationStatus === "approved";
    const isDeactivating =
      applicationStatus === "deactivated" ||
      applicationStatus === "suspended" ||
      applicationStatus === "rejected";

    const existing = await db.projectProvider.findUnique({
      where: { id },
      select: {
        id: true,
        displayName: true,
        applicationStatus: true,
        verificationStatus: true,
        isActive: true,
        removedAt: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // A soft-removed provider must go through the explicit Restore flow, never be
    // re-approved implicitly through a status change.
    if (existing.removedAt) {
      return NextResponse.json(
        { error: "This provider has been removed. Restore it before changing its status." },
        { status: 409 }
      );
    }

    // Atomically execute status change, project draft cascading, user role update, and audit log.
    // Audit is written inside the transaction (and is NOT swallowed): no audit row, no change.
    const updated = await db.$transaction(async (tx) => {
      const provider = await tx.projectProvider.update({
        where: { id },
        data: {
          applicationStatus,
          ...(isApproving
            ? {
                isActive: true,
                verificationStatus: verificationStatus || "verified",
              }
            : isDeactivating
            ? {
                isActive: false,
                ...(verificationStatus !== undefined ? { verificationStatus } : {}),
              }
            : {
                ...(verificationStatus !== undefined ? { verificationStatus } : {}),
              }),
          ...(rejectionReason !== undefined ? { rejectionReason } : {}),
          ...(verificationNotes !== undefined ? { verificationNotes } : {}),
          // Persist the admin's internal note on the provider record, not only in the audit payload.
          ...(adminNotes !== undefined ? { adminNotes } : {}),
        },
      });

      let draftedCount = 0;
      if (isDeactivating) {
        // Deactivating partner: change all their published projects to DRAFT
        const drafted = await tx.project.updateMany({
          where: {
            providerId: id,
            status: "PUBLISHED",
          },
          data: {
            status: "DRAFT",
          },
        });
        draftedCount = drafted.count;
      }

      // Update the linked user's role (and mark email verified on approval so they can log in).
      // updateMany so a missing/deleted user does not throw and abort the transaction.
      if (provider.userId) {
        await tx.user.updateMany({
          where: { id: provider.userId },
          data: {
            role: applicationStatus === "approved" ? "solution_partner" : "customer",
            ...(applicationStatus === "approved" ? { emailVerified: new Date() } : {}),
          },
        });
      }

      await createAuditLogTx(tx, {
        userId: session.user.id,
        action: `PARTNER_${applicationStatus.toUpperCase()}`,
        entityType: "ProjectProvider",
        entityId: id,
        details: {
          displayName: existing.displayName,
          previousState: {
            applicationStatus: existing.applicationStatus,
            verificationStatus: existing.verificationStatus,
            isActive: existing.isActive,
          },
          applicationStatus,
          verificationStatus: provider.verificationStatus,
          rejectionReason: rejectionReason ?? null,
          adminNotes: adminNotes ?? null,
          draftedProjects: draftedCount,
        },
      });

      return provider;
    });

    // Revalidate public catalog, admin providers list, partner portal, and sitemap
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}/edit`);
    revalidatePath("/partner");
    revalidatePath("/partner/dashboard");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ provider: updated });
  } catch (err) {
    console.error("Failed to update partner application status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
