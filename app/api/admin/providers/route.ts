// app/api/admin/providers/route.ts
// Admin API for listing and creating project providers.
// Source of truth: docs/21-provider-management.md & docs/15-api-architecture.md

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { ProviderSchema } from "@/lib/validation/provider.schema";

export async function GET() {
  try {
    await requireAdmin();

    const providers = await db.projectProvider.findMany({
      orderBy: { displayName: "asc" },
      include: {
        _count: {
          select: { projects: true },
        },
      },
    });

    return NextResponse.json({ providers });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("GET /api/admin/providers error:", error);
    return NextResponse.json({ error: "Failed to fetch providers" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    const validation = ProviderSchema.safeParse(body);
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

    // Check for duplicate email
    const existing = await db.projectProvider.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A provider with this email already exists." },
        { status: 409 }
      );
    }

    const provider = await db.projectProvider.create({
      data: {
        displayName: data.displayName,
        email: data.email,
        whatsappNumber: data.whatsappNumber || null,
        bio: data.bio || null,
        avatarUrl: data.avatarUrl || null,
        isActive: data.isActive,
        showEmail: data.showEmail,
        showWhatsapp: data.showWhatsapp,
        providerConsentConfirmed: data.providerConsentConfirmed,
        providerConsentConfirmedAt: data.providerConsentConfirmed ? new Date() : null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Provider created successfully",
        provider,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("POST /api/admin/providers error:", error);
    return NextResponse.json({ error: "Failed to create provider" }, { status: 500 });
  }
}
