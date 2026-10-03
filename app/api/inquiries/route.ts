// app/api/inquiries/route.ts
// Public POST endpoint for customers to submit project inquiries.
// Source of truth: docs/25-inquiry-system.md & docs/15-api-Private-routes.md

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { InquirySchema } from "@/lib/validation/inquiry.schema";
import { isProviderEligibleForRouting } from "@/lib/db/queries/providers";
import {
  inquiryLimiter,
  providerClientLimiter,
  providerCustomerEmailLimiter,
  providerGlobalBurstLimiter,
  projectIpLimiter,
  canSendEmail,
  getRequestIp,
} from "@/lib/utils/rate-limit";
import { verifyTurnstileToken } from "@/lib/utils/turnstile";
import { getCurrentUser } from "@/lib/auth/session";
import {
  sendProviderInquiryEmail,
  sendCustomerConfirmationEmail,
  InquiryEmailData,
} from "@/lib/email/email-service";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting (5 requests per 15 mins per IP)
    const ip = await getRequestIp(req);
    const rateLimitResult = await inquiryLimiter.check(ip);

    if (!rateLimitResult.success) {
      const retryAfterSeconds = Math.max(
        1,
        Math.ceil((rateLimitResult.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error: "Too many inquiry requests. Please wait before trying again.",
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

    // Check authentication state before Turnstile check
    const user = await getCurrentUser().catch(() => null);
    const isVerifiedUser = Boolean(user?.id && user?.email);

    // 2b. Unauthenticated visitors must pass Cloudflare Turnstile verification (N1)
    let captchaVerified = false;
    if (!isVerifiedUser) {
      const turnstileToken =
        typeof body.turnstileToken === "string" ? body.turnstileToken : null;
      const turnstileResult = await verifyTurnstileToken(turnstileToken, ip);
      if (!turnstileResult.success) {
        if (turnstileResult.unreachable) {
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

    // Strip anti-spam fields before strict Zod validation so .strict() doesn't reject them
    const cleanPayload = { ...body };
    delete cleanPayload.website;
    delete cleanPayload.formSubmittedAt;
    delete cleanPayload.turnstileToken;

    // 3. Validate input with strict schema (rejects provider_email, providerId, etc.)
    const parsed = InquirySchema.safeParse(cleanPayload);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { projectId, name, email, whatsapp, message, contactMethod } =
      parsed.data;
    const normalizedCustomerEmail = email.toLowerCase().trim();

    // 4. Resolve Project & Provider strictly from database (NEVER from client)
    const project = await db.project.findFirst({
      where: {
        id: projectId,
        status: "PUBLISHED",
      },
      include: {
        provider: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found or not available for inquiries" },
        { status: 404 }
      );
    }

    const provider = project.provider;

    // 5. Verify Provider is active and approved (B2/B3)
    if (!isProviderEligibleForRouting(provider)) {
      return NextResponse.json(
        { error: "Project provider is currently unavailable" },
        { status: 400 }
      );
    }

    // Enforce provider contact preference: reject email inquiry when showEmail is false (B2/B3)
    if (provider.showEmail === false) {
      return NextResponse.json(
        { error: "This provider has disabled email inquiries for this project" },
        { status: 403 }
      );
    }

    // 5a. Three-Layer Provider Lead Protection (N2) + Project-IP limit
    // Layer 1: per provider + client (IP/fingerprint): 3/hour (stops one abuser without blocking others)
    const providerClientCheck = await providerClientLimiter.check(
      `${provider.id}:${ip}`
    );
    if (!providerClientCheck.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((providerClientCheck.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error:
            "You have sent too many inquiries to this provider recently. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Layer 2: per customer email + provider: 3/day (stops repeat spam from same email)
    const providerCustomerEmailCheck = await providerCustomerEmailLimiter.check(
      `${provider.id}:${normalizedCustomerEmail}`
    );
    if (!providerCustomerEmailCheck.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((providerCustomerEmailCheck.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error:
            "You have reached the daily inquiry limit for this provider. Please wait for their response.",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Per-project per-IP limit: 5/hour
    const projectIpCheck = await projectIpLimiter.check(`${project.id}:${ip}`);
    if (!projectIpCheck.success) {
      const retryAfter = Math.max(
        1,
        Math.ceil((projectIpCheck.reset - Date.now()) / 1000)
      );
      return NextResponse.json(
        {
          error:
            "You have sent too many inquiries for this project recently. Please try again later.",
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }

    // Layer 3: per provider global burst: 40/hour (burst safety — NEVER rejects the customer; throttles email only)
    const providerBurstCheck = await providerGlobalBurstLimiter.check(provider.id);
    const isBurstThrottled = !providerBurstCheck.success;

    // 6. Persist inquiry to database BEFORE sending emails
    const inquiry = await db.inquiry.create({
      data: {
        projectId: project.id,
        providerId: provider.id,
        customerId: user?.id ?? null,
        name,
        email: normalizedCustomerEmail,
        whatsapp: whatsapp || null,
        message,
        contactMethod,
        status: "NEW",
        notificationStatus: isBurstThrottled ? "THROTTLED" : "PENDING",
      },
    });

    // 7. Send Emails (Provider notification + Customer confirmation)
    let notificationStatus: "SENT" | "FAILED" | "PENDING" | "THROTTLED" =
      isBurstThrottled ? "THROTTLED" : "PENDING";
    const emailPayload: InquiryEmailData = {
      inquiry: {
        name: inquiry.name,
        email: inquiry.email,
        whatsapp: inquiry.whatsapp,
        message: inquiry.message,
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
    };

    if (!isBurstThrottled) {
      // N3: Enforce daily outbound email cap via canSendEmail()
      const canSendProviderEmail = await canSendEmail();
      if (!canSendProviderEmail) {
        notificationStatus = "THROTTLED";
      } else {
        try {
          const providerEmailResult = await sendProviderInquiryEmail(emailPayload);
          if (providerEmailResult.success) {
            notificationStatus = "SENT";
          } else {
            notificationStatus = "FAILED";
          }
        } catch (emailErr) {
          console.error("[Inquiry] Provider email dispatch failed:", emailErr);
          notificationStatus = "FAILED";
        }
      }
    }

    // Send customer confirmation ONLY if customer email matches verified user OR passed CAPTCHA (M4),
    // and only if provider email was not burst-throttled and daily cap allows it (N3).
    const shouldSendCustomerConfirmation =
      (isVerifiedUser &&
        user?.email?.toLowerCase() === normalizedCustomerEmail) ||
      captchaVerified;

    if (shouldSendCustomerConfirmation && notificationStatus !== "THROTTLED") {
      const canSendCustEmail = await canSendEmail();
      if (canSendCustEmail) {
        try {
          await sendCustomerConfirmationEmail(emailPayload);
        } catch (confirmErr) {
          console.warn(
            "[Inquiry] Customer confirmation email failed (non-fatal):",
            confirmErr
          );
        }
      }
    }

    // 8. Update inquiry notificationStatus
    try {
      await db.inquiry.update({
        where: { id: inquiry.id },
        data: { notificationStatus },
      });
    } catch {
      // Non-fatal
    }

    // 9. Return success response (B10: honest message when email is skipped or throttled)
    const responseMessage =
      notificationStatus === "SENT"
        ? "Your inquiry has been sent to the project provider."
        : notificationStatus === "FAILED"
          ? "Your inquiry has been saved in the provider's dashboard, but the email notification could not be delivered."
          : notificationStatus === "THROTTLED"
            ? "Your inquiry has been saved in the provider's dashboard. The email notification is temporarily delayed."
            : "Your inquiry has been saved in the provider's dashboard and is awaiting email delivery.";

    return NextResponse.json(
      {
        success: true,
        data: {
          inquiryId: inquiry.id,
          status: inquiry.status,
          notificationStatus,
          emailDispatched: notificationStatus === "SENT",
          message: responseMessage,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[API /api/inquiries] Unexpected error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your inquiry" },
      { status: 500 }
    );
  }
}
