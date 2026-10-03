// app/api/admin/users/route.ts
// Admin User Management — list all users with search, role filter, and pagination.

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { getAllUsers } from "@/lib/db/queries/users";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin(true);

    const { searchParams } = req.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const rawPageSize = Number(searchParams.get("pageSize"));
    const pageSize = [5, 10, 20, 25, 50, 100].includes(rawPageSize)
      ? rawPageSize
      : 10;
    const q = searchParams.get("q")?.slice(0, 100) ?? "";
    const role = searchParams.get("role") ?? "all";

    const { users, total } = await getAllUsers({ page, pageSize, q: q || undefined, role });

    return NextResponse.json({
      users,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      currentPage: page,
      pageSize,
    });
  } catch (err) {
    console.error("[admin/users GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
