// app/api/inquiries/route.ts
// Public endpoint for submitting project inquiries.
// Source of truth: docs/25-inquiry-system.md, docs/18-email-architecture.md, docs/05-provider-contact-system.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { InquirySchema } from "@/lib/validation/inquiry.schema";
import { getClientIp, inquiryLimiter } from "@/lib/utils/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import {
  sendProviderInquiryEmail,
  sendCustomerConfirmationEmail,
} from "@/lib/email/email-service";

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting by IP
    const ip = getClientIp(request);
    const rateLimitResult = inquiryLimiter.check(ip);

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        { error: "Too many inquiries submitted. Please try again later." },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    // 2. Validate request body
    const body = await request.json();
    const parseResult = InquirySchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parseResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { projectId, name, email, whatsapp, message, contactMethod } = parseResult.data;

    // 3. Resolve project & verify it is published with an active, approved partner
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { slug: projectId },
          { slug: { equals: projectId, mode: "insensitive" } },
        ],
        status: "PUBLISHED",
        provider: {
          isActive: true,
          applicationStatus: "approved",
        },
      },
      include: {
        provider: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or is no longer available" },
        { status: 404 }
      );
    }

    // 4. Resolve provider & verify contact availability
    const provider = project.provider;
    if (!provider || !provider.isActive) {
      return NextResponse.json(
        { error: "Project provider is currently unavailable" },
        { status: 400 }
      );
    }

    if (!provider.email) {
      return NextResponse.json(
        { error: "Provider email contact is not configured" },
        { status: 400 }
      );
    }

    // 5. Optional customer session association (docs/25-inquiry-system.md)
    let customerId: string | null = null;
    try {
      const user = await getCurrentUser();
      customerId = user?.id || null;
    } catch {
      customerId = null;
    }

    // 6. Create inquiry record in DB (capture providerId at submission time)
    const inquiry = await db.inquiry.create({
      data: {
        projectId: project.id,
        providerId: provider.id,
        customerId,
        name,
        email,
        whatsapp: whatsapp || null,
        message,
        contactMethod,
        status: "NEW",
        notificationStatus: "PENDING",
      },
    });

    // 7. Send provider notification & customer confirmation emails asynchronously (Issue 24)
    sendProviderInquiryEmail({
      inquiry: {
        name,
        email,
        whatsapp,
        message,
      },
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
      },
      provider: {
        displayName: provider.displayName,
        email: provider.email,
      },
    })
      .then(async (emailResult) => {
        try {
          if (db.inquiry?.update) {
            await db.inquiry.update({
              where: { id: inquiry.id },
              data: { notificationStatus: emailResult.success ? "SENT" : "FAILED" },
            });
          }
        } catch {
          // ignore background update error
        }
      })
      .catch(async (emailErr) => {
        console.error("[Email] Provider inquiry delivery exception:", emailErr);
        try {
          if (db.inquiry?.update) {
            await db.inquiry.update({
              where: { id: inquiry.id },
              data: { notificationStatus: "FAILED" },
            });
          }
        } catch {
          // ignore background update error
        }
      });

    // Send confirmation to customer asynchronously
    sendCustomerConfirmationEmail({
      inquiry: {
        name,
        email,
        whatsapp,
        message,
      },
      project: {
        id: project.id,
        title: project.title,
        slug: project.slug,
      },
      provider: {
        displayName: provider.displayName,
        email: provider.email,
      },
    }).catch((err) => {
      console.error("[Email] Customer confirmation failed:", err);
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          inquiryId: inquiry.id,
          message: "Inquiry submitted successfully",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/inquiries error:", error);
    return NextResponse.json(
      { error: "Internal server error submitting inquiry" },
      { status: 500 }
    );
  }
}
