// app/api/admin/custom-requests/[id]/route.ts
// Admin-only custom project request detail and status update endpoint.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth/session";
import { getAdminCustomRequestById, updateAdminCustomRequest } from "@/lib/db/queries/custom-requests";
import { createAuditLog } from "@/lib/db/audit";
import { z } from "zod";

const UpdateCustomRequestSchema = z.object({
  status: z
    .enum(["NEW", "REVIEWING", "CONTACTED", "IN_PROGRESS", "COMPLETED", "DECLINED"])
    .optional(),
  adminNotes: z.string().nullable().optional(),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    await requireAdmin(false);
    const { id } = await context.params;

    const customReq = await getAdminCustomRequestById(id);
    if (!customReq) {
      return NextResponse.json({ error: "Custom request not found" }, { status: 404 });
    }

    return NextResponse.json(customReq);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("[API] Error fetching custom request detail:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const session = await requireAdmin(false);
    const { id } = await context.params;

    const existing = await getAdminCustomRequestById(id);
    if (!existing) {
      return NextResponse.json({ error: "Custom request not found" }, { status: 404 });
    }

    const body = await request.json();
    const result = UpdateCustomRequestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { status, adminNotes } = result.data;

    const updated = await updateAdminCustomRequest(id, {
      ...(status && { status }),
      ...(adminNotes !== undefined && { adminNotes }),
    });

    // Write audit log entry
    if (status && status !== existing.status) {
      await createAuditLog({
        userId: session.user.id,
        action: "CUSTOM_REQUEST_STATUS_CHANGED",
        entityType: "CustomProjectRequest",
        entityId: id,
        details: {
          previousStatus: existing.status,
          newStatus: status,
          projectTitle: existing.projectTitle,
          customerEmail: existing.email,
        },
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("[API] Error updating custom request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
