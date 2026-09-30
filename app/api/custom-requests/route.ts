// app/api/custom-requests/route.ts
// Public API endpoint for submitting custom project requests.
// Source of truth: docs/26-custom-project-system.md & docs/15-api-architecture.md

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CustomRequestSchema } from "@/lib/validation/custom-request.schema";
import { customRequestLimiter, getClientIp } from "@/lib/utils/rate-limit";
import {
  sendAdminCustomRequestEmail,
  sendCustomerCustomRequestConfirmationEmail,
} from "@/lib/email/email-service";
import { createAuditLog } from "@/lib/db/audit";

export async function POST(request: Request) {
  try {
    // Custom project requests are open to any visitor (docs/26-custom-project-system.md)
    let customerId: string | null = null;
    try {
      const session = await auth();
      customerId = session?.user?.id || null;
    } catch {
      // outside request scope or unauthenticated
    }

    // Request size limit: reject payloads > 128KB (Issue 46)
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 131072) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    // 1. Rate Limiting Check (3 per IP per hour as per docs/26-custom-project-system.md)
    const ip = getClientIp(request);
    const rateLimit = customRequestLimiter.check(ip);

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

    // 2. Body parsing and Zod Validation
    const body = await request.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { error: "Invalid request payload." },
        { status: 400 }
      );
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

    // 3. Database Insertion
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

    // 4. Audit Log Entry
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

    // 5. Send Email Notifications (graceful background attempts)
    // 5a. Admin Notification
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

    // 5b. Customer Confirmation Email
    sendCustomerCustomRequestConfirmationEmail(data.email, {
      customerName: data.name,
      projectTitle: data.projectTitle,
    }).catch((err) => {
      console.error("[Email] Failed to send customer confirmation email:", err);
    });

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
