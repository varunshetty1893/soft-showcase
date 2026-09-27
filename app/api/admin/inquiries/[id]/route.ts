// app/api/admin/inquiries/[id]/route.ts
// Admin-only single inquiry detail and status update endpoint.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth/session";
import { getAdminInquiryById, updateAdminInquiry, updateInquiryNotificationStatus } from "@/lib/db/queries/inquiries";
import { createAuditLog } from "@/lib/db/audit";
import { sendProviderInquiryEmail } from "@/lib/email/email-service";
import { z } from "zod";

const UpdateInquirySchema = z.object({
  status: z.enum(["NEW", "CONTACTED", "DISCUSSING", "QUOTED", "CLOSED"]).optional(),
  adminNotes: z.string().nullable().optional(),
  retryNotification: z.boolean().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(false);
    const { id } = await context.params;

    const inquiry = await getAdminInquiryById(id);
    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    return NextResponse.json(inquiry);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("[API] Error fetching inquiry detail:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin(false);
    const { id } = await context.params;

    const existing = await getAdminInquiryById(id);
    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = UpdateInquirySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, adminNotes, retryNotification } = result.data;

    // Retry sending provider notification email if requested
    if (retryNotification && existing.provider.email) {
      try {
        const emailResult = await sendProviderInquiryEmail({
          inquiry: {
            name: existing.name,
            email: existing.email,
            whatsapp: existing.whatsapp,
            message: existing.message,
          },
          project: {
            id: existing.project.id,
            title: existing.project.title,
            slug: existing.project.slug,
          },
          provider: {
            displayName: existing.provider.displayName,
            email: existing.provider.email,
          },
        });

        await updateInquiryNotificationStatus(
          existing.id,
          emailResult.success ? "SENT" : "FAILED"
        );
      } catch (err) {
        console.error("[Inquiry Retry] Notification email failed:", err);
      }
    }

    const updated = await updateAdminInquiry(id, {
      ...(status && { status }),
      ...(adminNotes !== undefined && { adminNotes }),
    });

    // Write audit log entry
    if (status && status !== existing.status) {
      await createAuditLog({
        userId: session.user.id,
        action: "INQUIRY_STATUS_CHANGED",
        entityType: "Inquiry",
        entityId: id,
        details: {
          previousStatus: existing.status,
          newStatus: status,
          projectTitle: existing.project.title,
          customerEmail: existing.email,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("[API] Error updating inquiry:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
