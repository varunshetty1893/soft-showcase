// app/api/admin/custom-requests/route.ts
// Admin-only custom requests listing endpoint.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth/session";
import { getAdminCustomRequests } from "@/lib/db/queries/custom-requests";
import type { CustomRequestStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(false);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const statusParam = searchParams.get("status") as CustomRequestStatus | null;

    const data = await getAdminCustomRequests({
      page: isNaN(page) ? 1 : page,
      status: statusParam || undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("[API] Error fetching admin custom requests:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
