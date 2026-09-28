// app/api/partner/solutions/route.ts
// Handles creating and listing solutions for the authenticated partner.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { ProjectSchema } from "@/lib/validation/project.schema";
import { slugify } from "@/lib/utils/slug";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
    const baseSlug = slugify(data.title);
    let finalSlug = baseSlug;
    let count = 1;
    while (await db.project.findUnique({ where: { slug: finalSlug } })) {
      finalSlug = `${baseSlug}-${count}`;
      count++;
    }

    const features: { feature: string; sortOrder?: number }[] = Array.isArray(body.features)
      ? body.features
      : [];
    const specifications: { key: string; value: string; sortOrder?: number }[] = Array.isArray(
      body.specifications
    )
      ? body.specifications
      : [];
    const faqs: { question: string; answer: string; sortOrder?: number }[] = Array.isArray(
      body.faqs
    )
      ? body.faqs
      : [];
    const technologyIds: string[] = Array.isArray(body.technologyIds)
      ? body.technologyIds
      : [];
    const images: { url: string; storageKey?: string; altText?: string; isPrimary?: boolean; sortOrder?: number }[] = Array.isArray(
      body.images
    )
      ? body.images
      : [];

    const newProject = await db.project.create({
      data: {
        title: data.title,
        slug: finalSlug,
        shortDescription: data.shortDescription,
        fullDescription: data.fullDescription,
        status: data.status || "DRAFT",
        featured: false,
        priceMode: data.priceMode,
        price: data.price || 0,
        demoUrl: data.demoUrl || null,
        projectType: data.projectType || "Web Application",
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
          create: technologyIds.map((techId) => ({
            technologyId: techId,
          })),
        },
        images: {
          create: images.map((img, i) => ({
            url: img.url,
            storageKey: img.storageKey || `img-${Date.now()}-${i}`,
            altText: img.altText || data.title,
            isPrimary: img.isPrimary ?? (i === 0),
            sortOrder: img.sortOrder ?? i + 1,
          })),
        },
      },
    });

    return NextResponse.json({ project: newProject }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to create partner project:", err);
    return NextResponse.json({ error: "Failed to create solution" }, { status: 500 });
  }
}
