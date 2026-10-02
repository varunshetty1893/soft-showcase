// app/api/admin/providers/[id]/lifecycle/route.ts
// Admin endpoint for provider lifecycle actions (Phase 2A & 2B):
// - toggle (Activate / Deactivate with compare-and-set & audit)
// - remove (Soft remove with impact tracking, session invalidation, optional escaped email, audit)
// - restore (Restore soft-removed provider, audit)
// - permanent_delete (Hard delete only when removed and 0 inquiries/transactions/tickets, snapshot audit)

import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, AuthError, authErrorResponse } from "@/lib/auth/session";
import {
  toggleProviderActiveState,
  removeProvider,
  restoreProvider,
  permanentlyDeleteProvider,
} from "@/lib/providers/provider-lifecycle";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await requireAdmin();
    const actorId = session.user.id;
    const { id: providerId } = await params;

    const body = await request.json().catch(() => null);
    if (!body || typeof body.action !== "string") {
      return NextResponse.json({ error: "Invalid action payload." }, { status: 400 });
    }

    const revalidateAll = () => {
      try {
        revalidatePath("/admin/providers");
        revalidatePath(`/admin/providers/${providerId}/edit`);
        revalidatePath("/admin/projects");
        revalidatePath("/partner");
        revalidatePath("/projects");
        revalidatePath("/");
      } catch {
        // Ignore revalidate errors outside Next request context (e.g. unit tests)
      }
    };

    if (body.action === "toggle") {
      const result = await toggleProviderActiveState({
        providerId,
        targetActive: Boolean(body.targetActive),
        reason: typeof body.reason === "string" ? body.reason : undefined,
        actorId,
      });

      revalidateAll();

      if (!result.ok) {
        const status = result.notFound
          ? 404
          : result.selfBlocked
          ? 403
          : result.conflict
          ? 409
          : 400;
        return NextResponse.json(
          { error: result.message, conflict: Boolean(result.conflict) },
          { status }
        );
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        provider: result.provider,
      });
    }

    if (body.action === "remove") {
      const result = await removeProvider({
        providerId,
        reason: String(body.reason || ""),
        confirmName: String(body.confirmName || ""),
        notifyPartner: Boolean(body.notifyPartner),
        actorId,
      });

      revalidateAll();

      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: result.status });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        provider: result.provider,
      });
    }

    if (body.action === "restore") {
      const result = await restoreProvider({
        providerId,
        actorId,
      });

      revalidateAll();

      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: result.status });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
        provider: result.provider,
      });
    }

    if (body.action === "permanent_delete") {
      const result = await permanentlyDeleteProvider({
        providerId,
        confirmName: String(body.confirmName || ""),
        actorId,
      });

      revalidateAll();

      if (!result.ok) {
        return NextResponse.json({ error: result.message }, { status: result.status });
      }

      return NextResponse.json({
        success: true,
        message: result.message,
      });
    }

    return NextResponse.json({ error: `Unsupported action: ${body.action}` }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) return authErrorResponse(error);
    console.error("POST /api/admin/providers/[id]/lifecycle error:", error);
    return NextResponse.json({ error: "Failed to process provider action." }, { status: 500 });
  }
}
