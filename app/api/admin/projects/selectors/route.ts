// app/api/admin/projects/selectors/route.ts
// Returns data needed to populate the project form dropdowns.
// Single request to avoid multiple round-trips from the form.

import { NextResponse } from "next/server";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import {
  getAdminCategories,
  getAdminTechnologies,
  getAdminProviderList,
} from "@/lib/db/queries/admin-projects";

export async function GET() {
  try {
    await requireAdmin();

    const [categories, technologies, providers] = await Promise.all([
      getAdminCategories(),
      getAdminTechnologies(),
      getAdminProviderList(),
    ]);

    return NextResponse.json({ categories, technologies, providers });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("GET /api/admin/projects/selectors error:", error);
    return NextResponse.json({ error: "Failed to fetch selectors" }, { status: 500 });
  }
}
