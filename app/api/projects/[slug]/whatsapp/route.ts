// app/api/projects/[slug]/whatsapp/route.ts
// Public API route to safely resolve provider WhatsApp deep link.
// Source of truth: docs/20-whatsapp-architecture.md & docs/15-api-architecture.md

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { getClientIp, whatsappLimiter } from "@/lib/utils/rate-limit";
import { generateWhatsAppUrl } from "@/lib/whatsapp/whatsapp";
import { APP_URL } from "@/config/constants";

type Params = { params: Promise<{ slug: string }> };

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // 0. Verify customer authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: "Please sign in to contact the Solution Partner on WhatsApp." },
        { status: 401 }
      );
    }

    // 1. Rate limiting by client IP
    const ip = getClientIp(request);
    const rateLimitResult = whatsappLimiter.check(ip);

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

    // 2. Resolve slug param
    const { slug } = await params;
    if (!slug) {
      return NextResponse.json({ error: "Project slug is required" }, { status: 400 });
    }

    // 3. Find published project and its provider
    const project = await db.project.findFirst({
      where: {
        slug,
        status: "PUBLISHED",
      },
      include: {
        provider: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // 4. Verify provider has WhatsApp enabled and configured
    if (!project.provider || !project.provider.showWhatsapp) {
      return NextResponse.json(
        { error: "WhatsApp contact is not enabled for this project provider" },
        { status: 403 }
      );
    }

    if (!project.provider.whatsappNumber) {
      return NextResponse.json(
        { error: "No WhatsApp number configured for this provider" },
        { status: 400 }
      );
    }

    // 5. Generate secure wa.me deep link
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
