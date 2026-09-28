// app/api/partner/solutions/[id]/route.ts
// Updates or deletes a partner's own solution.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

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
    const parsed = ProjectSchema.safeParse({
      ...body,
      providerId: partner.id,
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const updated = await db.project.update({
      where: { id },
      data: {
        title: data.title,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        status: data.status,
        priceMode: data.priceMode,
        price: data.price,
        demoUrl: data.demoUrl || null,
        projectType: data.projectType,
        whatsIncluded: data.whatsIncluded,
        categoryId: data.categoryId,
      },
    });

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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    let partner = await db.projectProvider.findFirst({
      where: {
        OR: [
          { userId: session.user.id },
          { email: session.user.email || "" },
        ],
      },
    });

    if (!partner && session.user.isAdmin) {
      partner = await db.projectProvider.findFirst();
    }

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Solution not found" }, { status: 404 });
    }

    if (existing.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await db.project.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to delete partner project:", err);
    return NextResponse.json({ error: "Failed to delete solution" }, { status: 500 });
  }
}
