// app/api/inquiries/route.ts
// Public endpoint for submitting project inquiries.
// Source of truth: docs/25-inquiry-system.md, docs/18-email-architecture.md, docs/05-provider-contact-system.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { InquirySchema } from "@/lib/validation/inquiry.schema";
import {
  getRequestIp,
  inquiryLimiter,
  recipientEmailLimiter,
  projectIpLimiter,
  dailyOutboundEmailLimiter,
} from "@/lib/utils/rate-limit";
import { getCurrentUser } from "@/lib/auth/session";
import {
  sendProviderInquiryEmail,
  sendCustomerConfirmationEmail,
} from "@/lib/email/email-service";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";

export async function POST(request: NextRequest) {
  try {
    // 1. IP & Rate limiting by IP (M2 & M3)
    const ip = await getRequestIp(request);
    const rateLimitResult = await inquiryLimiter.check(ip);

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

    // Request size limit: reject payloads > 128KB (Issue 46)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 131072) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 2. Validate request body
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // Anti-Spam: Honeypot check (M4)
    if (body.website && String(body.website).trim().length > 0) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // Anti-Spam: Minimum fill time check (M4) - forms filled faster than 2 seconds are bot submissions
    if (body.formSubmittedAt && typeof body.formSubmittedAt === "number") {
      const fillDuration = Date.now() - body.formSubmittedAt;
      if (fillDuration > 0 && fillDuration < 2000) {
        return NextResponse.json(
          { error: "Form submitted too quickly. Please review your details before submitting." },
          { status: 400 }
        );
      }
    }

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

    const { projectId, name, email, whatsapp, message, contactMethod, turnstileToken } = parseResult.data;

    // 3. User session verification & CAPTCHA validation (M4)
    let customerId: string | null = null;
    let isAuthenticatedVerifiedUser = false;
    try {
      const currentUser = await getCurrentUser();
      if (currentUser?.id) {
        customerId = currentUser.id;
        if (currentUser.email && currentUser.email.toLowerCase() === email.toLowerCase()) {
          isAuthenticatedVerifiedUser = true;
        }
      }
    } catch {
      customerId = null;
    }

    // If user is unauthenticated or emailing on behalf of another address, require valid Turnstile CAPTCHA
    let captchaPassed = false;
    if (!isAuthenticatedVerifiedUser) {
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        return NextResponse.json(
          { error: "Security verification failed. Please complete the CAPTCHA." },
          { status: 400 }
        );
      }
      captchaPassed = true;
    } else {
      captchaPassed = true;
    }

    // 4. Resolve project & verify it is published with an active, approved partner
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

    // 5. Resolve provider & verify contact availability
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

    // 6. Anti-Relay abuse limits (M4)
    // Per recipient limiter: max 3/hour
    const recipientCheck = await recipientEmailLimiter.check(`rcpt:${provider.email.toLowerCase()}`);
    if (!recipientCheck.success) {
      const retryAfter = Math.max(1, Math.ceil((recipientCheck.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "This solution provider is temporarily receiving a high volume of inquiries. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Per project per IP limiter: max 5/hour
    const projectIpCheck = await projectIpLimiter.check(`proj:${project.id}:ip:${ip}`);
    if (!projectIpCheck.success) {
      const retryAfter = Math.max(1, Math.ceil((projectIpCheck.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many inquiries for this specific project from your connection. Please wait before submitting again." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Global daily cap on outbound transactional emails
    const dailyCapCheck = await dailyOutboundEmailLimiter.check("global_daily");
    if (!dailyCapCheck.success) {
      console.warn("[Email] Global daily outbound transactional email cap reached.");
    }

    // 7. Create inquiry record in DB
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

    // 8. Send provider notification asynchronously
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

    // 9. Send customer confirmation ONLY if authenticated with verified email or CAPTCHA passed (M4)
    if (isAuthenticatedVerifiedUser || captchaPassed) {
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
