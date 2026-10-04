// app/api/partner/inquiries/[id]/route.ts
// Updates status and notes for a partner-assigned customer inquiry.
// Sends email notifications to customer on meaningful status transitions.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { sendInquiryStatusUpdateEmail } from "@/lib/email/email-service";

// Status values the customer should be notified about.
const NOTIFY_STATUSES = new Set(["CONTACTED", "DISCUSSING", "QUOTED", "CLOSED"]);

async function resolvePartner(session: any) {
  let partner = await db.projectProvider.findFirst({
    where: {
      OR: [
        { userId: session.user.id },
        { email: session.user.email || "" },
      ],
    },
  });
  if (!partner && session.user.isAdmin) {
    partner = await db.projectProvider.findFirst();
  }
  return partner;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const partner = await resolvePartner(session);
    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json({ error: "Partner account is not active or approved" }, { status: 403 });
    }

    const inquiry = await db.inquiry.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, slug: true } },
      },
    });

    if (!inquiry) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (inquiry.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your inquiry" }, { status: 403 });
    }

    return NextResponse.json({ inquiry });
  } catch (err) {
    console.error("Failed to get inquiry:", err);
    return NextResponse.json({ error: "Failed to get inquiry" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const partner = await resolvePartner(session);
    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json({ error: "Partner account is not active or approved" }, { status: 403 });
    }

    // Fetch full inquiry for ownership check + email data
    const existing = await db.inquiry.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, title: true, slug: true } },
        customer: { select: { id: true, name: true, email: true, contactEmail: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Inquiry not found" }, { status: 404 });
    }

    if (existing.providerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your inquiry" }, { status: 403 });
    }

    const body = await req.json();
    const { partnerNotes, whatsappReplied } = body;
    let { status } = body;

    // Convenience: WhatsApp replied toggle → mark as CONTACTED if still NEW
    if (whatsappReplied === true && (!status || status === "NEW")) {
      status = "CONTACTED";
    }

    const previousStatus = existing.status;
    const nextStatus: string | undefined = status && status !== previousStatus ? status : undefined;

    const updated = await db.inquiry.update({
      where: { id },
      data: {
        ...(nextStatus ? { status: nextStatus as any } : {}),
        ...(partnerNotes !== undefined ? { adminNotes: partnerNotes } : {}),
      },
    });

    // ── Fire customer notification for meaningful status changes ──────────
    if (nextStatus && NOTIFY_STATUSES.has(nextStatus)) {
      // Best-effort: use contactEmail if set, fall back to inquiry email
      const customerEmail =
        existing.customer?.contactEmail || existing.customer?.email || existing.email;

      if (customerEmail && existing.project) {
        sendInquiryStatusUpdateEmail(customerEmail, {
          customerName: existing.customer?.name || existing.name,
          projectTitle: existing.project.title,
          projectSlug: existing.project.slug,
          providerName: partner.displayName || partner.email,
          newStatus: nextStatus as any,
        }).catch((e) =>
          console.warn("[Inquiry] Status notification email failed:", e)
        );
      }
    }

    return NextResponse.json({ inquiry: updated });
  } catch (err) {
    console.error("Failed to update inquiry:", err);
    return NextResponse.json({ error: "Failed to update inquiry" }, { status: 500 });
  }
}
