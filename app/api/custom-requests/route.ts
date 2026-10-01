// app/api/custom-requests/route.ts
// Public API endpoint for submitting custom project requests.
// Source of truth: docs/26-custom-project-system.md & docs/15-api-architecture.md

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CustomRequestSchema } from "@/lib/validation/custom-request.schema";
import {
  customRequestLimiter,
  getRequestIp,
  recipientEmailLimiter,
  dailyOutboundEmailLimiter,
} from "@/lib/utils/rate-limit";
import {
  sendAdminCustomRequestEmail,
  sendCustomerCustomRequestConfirmationEmail,
} from "@/lib/email/email-service";
import { createAuditLog } from "@/lib/db/audit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";

export async function POST(request: Request) {
  try {
    // 1. IP & Rate Limiting Check (M2 & M3)
    const ip = await getRequestIp(request);
    const rateLimit = await customRequestLimiter.check(ip);

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error: "Rate limit exceeded. You may only submit 3 custom project requests per hour.",
        },
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

    // 2. Body parsing and Anti-Abuse Checks (M4)
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
    }

    // Honeypot check (M4)
    if (body.website && String(body.website).trim().length > 0) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // Minimum fill time check (M4)
    if (body.formSubmittedAt && typeof body.formSubmittedAt === "number") {
      const fillDuration = Date.now() - body.formSubmittedAt;
      if (fillDuration > 0 && fillDuration < 2000) {
        return NextResponse.json(
          { error: "Form submitted too quickly. Please review your details before submitting." },
          { status: 400 }
        );
      }
    }

    const validation = CustomRequestSchema.safeParse(body);
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

    // 3. User session verification & CAPTCHA validation (M4)
    let customerId: string | null = null;
    let isAuthenticatedVerifiedUser = false;
    try {
      const session = await auth();
      if (session?.user?.id) {
        customerId = session.user.id;
        if (session.user.email && session.user.email.toLowerCase() === data.email.toLowerCase()) {
          isAuthenticatedVerifiedUser = true;
        }
      }
    } catch {
      customerId = null;
    }

    let captchaPassed = false;
    if (!isAuthenticatedVerifiedUser) {
      const turnstileResult = await verifyTurnstileToken(data.turnstileToken, ip);
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

    // 4. Anti-Relay abuse limits (M4)
    const recipientCheck = await recipientEmailLimiter.check(`custom:${data.email.toLowerCase()}`);
    if (!recipientCheck.success) {
      const retryAfter = Math.max(1, Math.ceil((recipientCheck.reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: "Too many custom project requests submitted for this email address. Please try again later." },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    await dailyOutboundEmailLimiter.check("global_daily");

    // 5. Database Insertion
    const customRequest = await db.customProjectRequest.create({
      data: {
        name: data.name,
        email: data.email,
        whatsapp: data.whatsapp || null,
        projectTitle: data.projectTitle,
        category: data.category || null,
        technologyPreferences: data.technologyPreferences || [],
        description: data.description,
        requiredFeatures: data.requiredFeatures,
        deadline: data.deadline || null,
        budget: data.budget || null,
        additionalRequirements: data.additionalRequirements || null,
        status: "NEW",
      },
    });

    // 6. Audit Log Entry
    await createAuditLog({
      userId: customerId,
      action: "CUSTOM_REQUEST_RECEIVED",
      entityType: "CustomProjectRequest",
      entityId: customRequest.id,
      details: {
        projectTitle: data.projectTitle,
        customerEmail: data.email,
        category: data.category,
      },
    });

    // 7. Send Email Notifications
    // 7a. Admin Notification
    sendAdminCustomRequestEmail({
      name: data.name,
      email: data.email,
      whatsapp: data.whatsapp,
      projectTitle: data.projectTitle,
      category: data.category,
      technologies: data.technologyPreferences,
      budget: data.budget,
      deadline: data.deadline,
      description: data.description,
      requiredFeatures: data.requiredFeatures,
      additionalRequirements: data.additionalRequirements,
    }).catch((err) => {
      console.error("[Email] Failed to notify admin for custom request:", err);
    });

    // 7b. Customer Confirmation Email only if authenticated or CAPTCHA passed (M4)
    if (isAuthenticatedVerifiedUser || captchaPassed) {
      sendCustomerCustomRequestConfirmationEmail(data.email, {
        customerName: data.name,
        projectTitle: data.projectTitle,
      }).catch((err) => {
        console.error("[Email] Failed to send customer confirmation email:", err);
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Your custom project request has been submitted successfully.",
        requestId: customRequest.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Custom project request submission error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your request." },
      { status: 500 }
    );
  }
}
