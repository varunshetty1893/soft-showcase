// app/api/admin/providers/[id]/status/route.ts
// Administrative partner approval, rejection, and verification management.

import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { db } from "@/lib/db/client";
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
    const body = await req.json();
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

    // Atomically execute status change, project draft cascading, user role update, and audit log
    const updated = await db.$transaction(async (tx) => {
      const provider = await tx.projectProvider.update({
        where: { id },
        data: {
          applicationStatus,
          ...(isApproving
            ? {
                isActive: true,
                showWhatsapp: true,
                showEmail: true,
                providerConsentConfirmed: true,
                providerConsentConfirmedAt: new Date(),
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
        },
      });

      if (isDeactivating) {
        // Deactivating partner: change all their published projects to DRAFT
        await tx.project.updateMany({
          where: {
            providerId: id,
            status: "PUBLISHED",
          },
          data: {
            status: "DRAFT",
          },
        });
      }

      // Also update associated user role if approved
      if (provider.userId) {
        await tx.user.update({
          where: { id: provider.userId },
          data: {
            role: applicationStatus === "approved" ? "solution_partner" : "customer",
          },
        }).catch(() => null);
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: `PARTNER_${applicationStatus.toUpperCase()}`,
          entityType: "ProjectProvider",
          entityId: id,
          details: {
            applicationStatus,
            verificationStatus,
            rejectionReason,
            adminNotes,
          },
        },
      }).catch(() => null);

      return provider;
    });

    // Revalidate public catalog, homepage, and sitemap (Issue 54)
    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath("/sitemap.xml");

    return NextResponse.json({ provider: updated });
  } catch (err) {
    console.error("Failed to update partner application status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
