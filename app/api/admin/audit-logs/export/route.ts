// app/api/admin/audit-logs/export/route.ts
// Admin-only CSV export endpoint for filtered audit logs (Phase 5).
// Uses the exact same filter parser as /admin/audit-logs, caps output at 10,000 rows,
// redacts sensitive payload fields, and protects against CSV formula injection (=, +, -, @).

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import { exportAdminAuditLogsCsv } from "@/lib/db/audit";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(false);

    const url = new URL(req.url);
    const rawParams: Record<string, string | string[]> = {};

    for (const key of Array.from(new Set(url.searchParams.keys()))) {
      const values = url.searchParams.getAll(key);
      rawParams[key] = values.length > 1 ? values : values[0] || "";
    }

    const { csv } = await exportAdminAuditLogsCsv(rawParams);
    const dateStamp = new Date().toISOString().slice(0, 10);

    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-logs-${dateStamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return authErrorResponse(error);
    }
    console.error("[GET /api/admin/audit-logs/export] Error:", error);
    return NextResponse.json(
      { error: "Failed to export audit logs CSV" },
      { status: 500 }
    );
  }
}
