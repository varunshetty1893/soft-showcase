// app/api/admin/providers/[id]/route.ts
// Admin API for fetching, updating, and deactivating a single provider.
// Source of truth: docs/21-provider-management.md & docs/15-api-architecture.md

import { NextResponse } from "next/server";
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
    const updated = await db.projectProvider.update({
      where: { id },
      data: {
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.showEmail !== undefined && { showEmail: data.showEmail }),
        ...(data.showWhatsapp !== undefined && { showWhatsapp: data.showWhatsapp }),
        ...(data.providerConsentConfirmed !== undefined && {
          providerConsentConfirmed: data.providerConsentConfirmed,
          providerConsentConfirmedAt: consentAt,
        }),
      },
    });

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
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: "Provider deactivated successfully. Contact buttons are now hidden on all assigned projects.",
      provider: updated,
    });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("DELETE /api/admin/providers/[id] error:", error);
    return NextResponse.json({ error: "Failed to deactivate provider" }, { status: 500 });
  }
}
