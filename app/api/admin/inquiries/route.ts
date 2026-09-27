// app/api/admin/inquiries/route.ts
// Admin-only inquiries listing endpoint.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, authErrorResponse, AuthError } from "@/lib/auth/session";
import { getAdminInquiries } from "@/lib/db/queries/inquiries";
import type { InquiryStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(false);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const statusParam = searchParams.get("status") as InquiryStatus | null;

    const data = await getAdminInquiries({
      page: isNaN(page) ? 1 : page,
      status: statusParam || undefined,
    });

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("[API] Error fetching admin inquiries:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
