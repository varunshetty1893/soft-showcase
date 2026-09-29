// app/api/admin/providers/[id]/status/route.ts
// Administrative partner approval, rejection, and verification management.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { PartnerStatusUpdateSchema } from "@/lib/validation/partner.schema";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.isAdmin) {
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

    const updated = await db.projectProvider.update({
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
      // so they disappear from the user side but stay as draft in the partner portal
      await db.project.updateMany({
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
    if (updated.userId) {
      await db.user.update({
        where: { id: updated.userId },
        data: {
          role: applicationStatus === "approved" ? "solution_partner" : "customer",
        },
      }).catch(() => null);
    }

    // Create audit log
    await db.auditLog.create({
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

    return NextResponse.json({ provider: updated });
  } catch (err) {
    console.error("Failed to update partner application status:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
