// app/api/custom-requests/route.ts
// Public API endpoint for submitting a custom software project request.
// Source of truth: docs/26-custom-project-system.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { CustomRequestSchema } from "@/lib/validation/custom-request.schema";
import {
  customRequestLimiter,
  customRequestEmailLimiter,
  customRequestBurstLimiter,
  canSendEmail,
  getRequestIp,
} from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { createAuditLog } from "@/lib/db/audit";
import { auth } from "@/lib/auth/auth";
import {
  sendAdminCustomRequestEmail,
  sendCustomerCustomRequestConfirmationEmail,
} from "@/lib/email/email-service";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting (3 requests per 60 minutes per IP — dedicated custom namespace, N2)
    const ip = await getRequestIp(req);
    const rateLimit = await customRequestLimiter.check(ip);

    if (!rateLimit.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimit.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error: "Too many custom project requests. Please try again later.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfterSeconds),
          },
        }
      );
    }

    // 2. Parse request body
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // 2a. Honeypot & minimum form fill-time anti-bot checks (M4 / N1)
    if (typeof body.website === "string" && body.website.trim().length > 0) {
      return NextResponse.json(
        { error: "Invalid submission" },
        { status: 400 }
      );
    }

    if (typeof body.formSubmittedAt === "number") {
      const elapsedMs = Date.now() - body.formSubmittedAt;
      if (elapsedMs >= 0 && elapsedMs < 2000) {
        return NextResponse.json(
          { error: "Form submitted too quickly. Please try again." },
          { status: 400 }
        );
      }
    }

    let session = null;
    try {
      session = await auth();
    } catch {
      session = null;
    }
    const isVerifiedUser = Boolean(session?.user?.id && session?.user?.email);

    // 2b. Unauthenticated submissions require Turnstile verification (N1)
    let captchaVerified = false;
    if (!isVerifiedUser) {
      const turnstileToken =
        typeof body.turnstileToken === "string" ? body.turnstileToken : null;
      const turnstileCheck = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileCheck.success) {
        if (turnstileCheck.unreachable) {
          return NextResponse.json(
            {
              error:
                "Security verification service is temporarily unavailable. Please try again in a moment.",
            },
            { status: 503 }
          );
        }
        return NextResponse.json(
          {
            error:
              "Security verification failed. Please complete the challenge and try again.",
          },
          { status: 400 }
        );
      }
      captchaVerified = true;
    }

    const cleanPayload = { ...body };
    delete cleanPayload.website;
    delete cleanPayload.formSubmittedAt;
    delete cleanPayload.turnstileToken;

    // 3. Validate input with Zod
    const parsed = CustomRequestSchema.safeParse(cleanPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase().trim();

    // 3a. Dedicated custom-request per-email limit (3/day) and global burst limit (40/hr) (N2)
    const emailLimitCheck = await customRequestEmailLimiter.check(normalizedEmail);
    if (!emailLimitCheck.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((emailLimitCheck.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error:
            "You have reached the daily limit for custom project requests. Our team is reviewing your submissions.",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    const burstCheck = await customRequestBurstLimiter.check("global_custom_requests");
    const isBurstThrottled = !burstCheck.success;

    // 4. Persist to database first
    const customRequest = await db.customProjectRequest.create({
      data: {
        customerId: session?.user?.id || null,
        linkedAt: session?.user?.id ? new Date() : null,
        name: data.name,
        email: normalizedEmail,
        whatsapp: data.whatsapp ?? null,
        projectTitle: data.projectTitle,
        category: data.category ?? null,
        technologyPreferences: data.technologyPreferences,
        description: data.description,
        requiredFeatures: data.requiredFeatures,
        deadline: data.deadline ?? null,
        budget: data.budget ?? null,
        additionalRequirements: data.additionalRequirements ?? null,
        status: "NEW",
      },
    });

    // 5. Log to audit trail
    await createAuditLog({
      userId: session?.user?.id || null,
      action: "CUSTOM_REQUEST_RECEIVED",
      entityType: "CustomProjectRequest",
      entityId: customRequest.id,
      details: {
        projectTitle: customRequest.projectTitle,
        requesterEmail: customRequest.email,
        category: customRequest.category,
      },
    });

    // 6. Dispatch notifications using canSendEmail() (N3)
    let notificationStatus: "SENT" | "FAILED" | "PENDING" | "THROTTLED" =
      isBurstThrottled ? "THROTTLED" : "PENDING";
    let emailDispatched = false;

    if (!isBurstThrottled) {
      const canSendAdminEmail = await canSendEmail();
      if (!canSendAdminEmail) {
        notificationStatus = "THROTTLED";
      } else {
        try {
          const adminEmailRes = await sendAdminCustomRequestEmail({
            name: customRequest.name,
            email: customRequest.email,
            whatsapp: customRequest.whatsapp,
            projectTitle: customRequest.projectTitle,
            category: customRequest.category,
            technologies: customRequest.technologyPreferences,
            budget: customRequest.budget,
            deadline: customRequest.deadline,
            description: customRequest.description,
            requiredFeatures: customRequest.requiredFeatures,
            additionalRequirements: customRequest.additionalRequirements,
          });
          if (adminEmailRes.success) {
            notificationStatus = "SENT";
            emailDispatched = true;
          } else {
            notificationStatus = "FAILED";
          }
        } catch (err) {
          console.error(
            "[CustomRequest] Failed to send admin notification email:",
            err
          );
          notificationStatus = "FAILED";
        }
      }
    }

    const canConfirmCustomer =
      (isVerifiedUser &&
        session?.user?.email?.toLowerCase() === normalizedEmail) ||
      captchaVerified;

    if (canConfirmCustomer && notificationStatus !== "THROTTLED") {
      const canSendCustEmail = await canSendEmail();
      if (canSendCustEmail) {
        try {
          const custEmailRes = await sendCustomerCustomRequestConfirmationEmail(
            customRequest.email,
            {
              customerName: customRequest.name,
              projectTitle: customRequest.projectTitle,
            }
          );
          if (custEmailRes.success) {
            emailDispatched = true;
          }
        } catch (err) {
          console.error(
            "[CustomRequest] Failed to send customer confirmation email:",
            err
          );
        }
      }
    }

    if (notificationStatus !== "PENDING") {
      try {
        await db.customProjectRequest.update?.({
          where: { id: customRequest.id },
          data: { notificationStatus },
        });
      } catch {
        // Non-fatal
      }
    }

    const responseMessage = emailDispatched
      ? "Your custom project request has been received and confirmation has been sent."
      : "Your custom project request has been saved and queued for architectural review.";

    return NextResponse.json(
      {
        success: true,
        requestId: customRequest.id,
        notificationStatus,
        emailDispatched,
        message: responseMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API /api/custom-requests] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while submitting your request." },
      { status: 500 }
    );
  }
}
