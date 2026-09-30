// app/api/projects/[slug]/whatsapp/route.ts
// Public API route to safely resolve provider WhatsApp deep link.
// Source of truth: docs/20-whatsapp-architecture.md & docs/15-api-architecture.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { getClientIp, whatsappLimiter } from "@/lib/utils/rate-limit";
import { generateWhatsAppUrl } from "@/lib/whatsapp/whatsapp";
import { APP_URL } from "@/config/constants";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // 1. Rate limiting by client IP
    const ip = getClientIp(request);
    const rateLimitResult = await whatsappLimiter.check(ip);

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    // 2. Resolve slug and optional projectId param
    const resolvedParams = await params;
    const rawSlug = resolvedParams?.slug ? String(resolvedParams.slug).trim() : "";
    const decodedSlug = decodeURIComponent(rawSlug).trim();

    const { searchParams } = new URL(request.url);
    const projectIdQuery = searchParams.get("projectId")?.trim();

    if (!rawSlug && !projectIdQuery) {
      return NextResponse.json({ error: "Project slug or ID is required" }, { status: 400 });
    }

    // 3. Find project and its provider (by slug, lowercase slug, decoded slug, or projectId)
    const project = await db.project.findFirst({
      where: {
        OR: [
          ...(projectIdQuery ? [{ id: projectIdQuery }] : []),
          { slug: rawSlug },
          { slug: decodedSlug },
          { slug: rawSlug.toLowerCase() },
          { slug: decodedSlug.toLowerCase() },
          { slug: { equals: rawSlug, mode: "insensitive" } },
          { slug: { equals: decodedSlug, mode: "insensitive" } },
          { id: rawSlug },
          { id: decodedSlug },
        ],
      },
      include: {
        provider: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    if (project.status !== "PUBLISHED") {
      return NextResponse.json(
        { error: "Project not found or is no longer available" },
        { status: 404 }
      );
    }

    // 5. Verify provider has WhatsApp configured and is an approved, active partner
    if (!project.provider) {
      return NextResponse.json(
        { error: "No Solution Partner is associated with this project." },
        { status: 404 }
      );
    }

    if (!project.provider.isActive || project.provider.applicationStatus !== "approved") {
      return NextResponse.json(
        { error: "This project partner is currently inactive or undergoing review." },
        { status: 403 }
      );
    }

    if (!project.provider.whatsappNumber) {
      return NextResponse.json(
        { error: "No WhatsApp contact number is configured for this Solution Partner yet." },
        { status: 400 }
      );
    }

    if (!project.provider.showWhatsapp) {
      return NextResponse.json(
        { error: "WhatsApp contact is not enabled for this project." },
        { status: 403 }
      );
    }

    // 6. Generate secure wa.me deep link
    const projectUrl = `${APP_URL}/projects/${project.slug}`;
    const url = generateWhatsAppUrl({
      phoneNumber: project.provider.whatsappNumber,
      projectTitle: project.title,
      projectUrl,
      projectId: project.id,
    });

    return NextResponse.json({
      success: true,
      data: { url },
    });
  } catch (error) {
    console.error("GET /api/projects/[slug]/whatsapp error:", error);
    return NextResponse.json(
      { error: "Failed to generate WhatsApp link" },
      { status: 500 }
    );
  }
}
