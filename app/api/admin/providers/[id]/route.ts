// app/api/admin/providers/[id]/route.ts
// Admin API for fetching, updating, and deactivating a single provider.
// Source of truth: docs/21-provider-management.md & docs/15-api-architecture.md

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { ProviderUpdateSchema } from "@/lib/validation/provider.schema";

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const provider = await db.projectProvider.findUnique({
      where: { id },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
          },
        },
        _count: {
          select: { inquiries: true, projects: true },
        },
      },
    });

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("GET /api/admin/providers/[id] error:", error);
    return NextResponse.json({ error: "Failed to fetch provider" }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const validation = ProviderUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Check if provider exists
    const existing = await db.projectProvider.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    // Check email uniqueness if changing email
    if (data.email && data.email !== existing.email) {
      const emailConflict = await db.projectProvider.findUnique({
        where: { email: data.email },
      });
      if (emailConflict) {
        return NextResponse.json(
          { error: "A provider with this email already exists." },
          { status: 409 }
        );
      }
    }

    // Handle consent timestamp
    let consentAt = existing.providerConsentConfirmedAt;
    if (data.providerConsentConfirmed !== undefined) {
      if (data.providerConsentConfirmed && !existing.providerConsentConfirmed) {
        consentAt = new Date();
      } else if (!data.providerConsentConfirmed) {
        consentAt = null;
      }
    }

    // Admin is only permitted to manage platform and visibility controls.
    // Provider identity and studio profile details are strictly managed by the provider only.
    const isApproving = data.applicationStatus === "approved";
    const isDeactivating =
      data.isActive === false ||
      data.applicationStatus === "deactivated" ||
      data.applicationStatus === "suspended" ||
      data.applicationStatus === "rejected";

    const updated = await db.projectProvider.update({
      where: { id },
      data: {
        ...(data.isActive !== undefined && { isActive: isApproving ? true : isDeactivating ? false : data.isActive }),
        ...(data.applicationStatus !== undefined && { applicationStatus: data.applicationStatus }),
        ...(data.rejectionReason !== undefined && { rejectionReason: data.rejectionReason }),
        ...(data.verificationStatus !== undefined && { verificationStatus: data.verificationStatus }),
        ...(data.adminNotes !== undefined && { adminNotes: data.adminNotes }),
        ...(data.showEmail !== undefined && { showEmail: data.showEmail }),
        ...(data.showWhatsapp !== undefined && { showWhatsapp: data.showWhatsapp }),
        ...(data.providerConsentConfirmed !== undefined && {
          providerConsentConfirmed: data.providerConsentConfirmed,
          providerConsentConfirmedAt: consentAt,
        }),
      },
    });

    // If provider is deactivated, demote their published projects to DRAFT
    // so they are removed from the user side but remain as draft in the partner portal
    if (isDeactivating) {
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

    if (updated.userId && data.applicationStatus) {
      await db.user.update({
        where: { id: updated.userId },
        data: {
          role: data.applicationStatus === "approved" ? "solution_partner" : "customer",
          ...(data.applicationStatus === "approved" ? { emailVerified: new Date() } : {}),
        },
      }).catch(() => null);
    }

    revalidatePath("/admin/providers");
    revalidatePath(`/admin/providers/${id}/edit`);
    revalidatePath("/partner");
    revalidatePath("/projects");

    return NextResponse.json({
      success: true,
      message: "Provider updated successfully",
      provider: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("PATCH /api/admin/providers/[id] error:", error);
    return NextResponse.json({ error: "Failed to update provider" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Deactivation logic per docs/21-provider-management.md: sets isActive = false
    const updated = await db.projectProvider.update({
      where: { id },
      data: { isActive: false, applicationStatus: "deactivated" },
    });

    // Demote published projects to DRAFT (Issue 13: Provider Deactivation Inconsistency)
    await db.project.updateMany({
      where: {
        providerId: id,
        status: "PUBLISHED",
      },
      data: {
        status: "DRAFT",
      },
    });

    return NextResponse.json({
      success: true,
      message: "Provider deactivated successfully. Published solutions were converted to draft.",
      provider: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("DELETE /api/admin/providers/[id] error:", error);
    return NextResponse.json({ error: "Failed to deactivate provider" }, { status: 500 });
  }
}
