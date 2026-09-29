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

    // 3. Resolve project & verify it exists
    const project = await db.project.findFirst({
      where: {
        OR: [
          { id: projectId },
          { slug: projectId },
          { slug: { equals: projectId, mode: "insensitive" } },
        ],
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

    // 5. Require customer authentication to communicate with partners
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to send an inquiry to the Solution Partner." },
        { status: 401 }
      );
    }
    const customerId = user.id;

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

    // 7. Attempt to send provider notification email
    try {
      const emailResult = await sendProviderInquiryEmail({
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
      });

      if (emailResult.success) {
        await db.inquiry.update({
          where: { id: inquiry.id },
          data: { notificationStatus: "SENT" },
        });
      } else {
        await db.inquiry.update({
          where: { id: inquiry.id },
          data: { notificationStatus: "FAILED" },
        });
      }

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
    } catch (emailErr) {
      console.error("[Email] Provider inquiry delivery exception:", emailErr);
      await db.inquiry.update({
        where: { id: inquiry.id },
        data: { notificationStatus: "FAILED" },
      });
    }

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
