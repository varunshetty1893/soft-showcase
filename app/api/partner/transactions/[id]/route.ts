// app/api/partner/transactions/[id]/route.ts
// Solution Partner transaction detail and delivery status updater.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";

function isValidEvidenceUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  const trimmed = url.trim();
  if (trimmed.startsWith("data:image/")) return true;
  if (trimmed.startsWith("/uploads/") || trimmed.startsWith("/api/partner/uploads")) return true;
  try {
    const parsed = new URL(trimmed);
    const trustedHosts = [
      "res.cloudinary.com",
      "images.unsplash.com",
      process.env.NEXT_PUBLIC_APP_URL ? new URL(process.env.NEXT_PUBLIC_APP_URL).hostname : "",
      "localhost",
    ].filter(Boolean);
    return trustedHosts.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

// Valid delivery status progression
const VALID_DELIVERY_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["PENDING", "IN_PROGRESS"],
  IN_PROGRESS: ["IN_PROGRESS", "DELIVERED"],
  DELIVERED: ["DELIVERED", "COMPLETED"],
  COMPLETED: ["COMPLETED"],
};

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

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const transaction = await db.transaction.findUnique({
      where: { id },
      include: {
        partner: true,
        solution: true,
        customer: true,
        enquiry: true,
      },
    });

    if (!transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (transaction.partnerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your transaction" }, { status: 403 });
    }

    return NextResponse.json({ transaction });
  } catch (err) {
    console.error("Failed to get transaction:", err);
    return NextResponse.json({ error: "Failed to get transaction" }, { status: 500 });
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

    if (!partner) {
      return NextResponse.json({ error: "Partner profile not found" }, { status: 404 });
    }

    if (!session.user.isAdmin && (!partner.isActive || partner.applicationStatus !== "approved")) {
      return NextResponse.json(
        { error: "Partner account is not active or approved" },
        { status: 403 }
      );
    }

    const existing = await db.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    if (existing.partnerId !== partner.id && !session.user.isAdmin) {
      return NextResponse.json({ error: "Forbidden: Not your transaction" }, { status: 403 });
    }

    const body = await req.json();
    const { deliveryStatus, paymentEvidenceUrl, paymentEvidenceNotes } = body;

    // Validate payment evidence URL (Issue 27)
    if (paymentEvidenceUrl && !isValidEvidenceUrl(paymentEvidenceUrl)) {
      return NextResponse.json(
        { error: "Payment evidence must be uploaded through the platform storage." },
        { status: 400 }
      );
    }

    // Validate payment status modification constraints (Issue 26)
    if (paymentEvidenceUrl) {
      if (
        existing.paymentStatus === "VERIFIED" ||
        existing.paymentStatus === "COMPLETED" ||
        existing.paymentStatus === "REFUNDED"
      ) {
        return NextResponse.json(
          {
            error: `Cannot submit new payment evidence because this transaction is already marked as ${existing.paymentStatus}.`,
          },
          { status: 400 }
        );
      }
    }

    // Validate delivery status transitions (Issue 26)
    if (deliveryStatus && deliveryStatus !== existing.deliveryStatus) {
      const allowedNextStates = VALID_DELIVERY_TRANSITIONS[existing.deliveryStatus] || [];
      if (!allowedNextStates.includes(deliveryStatus) && !session.user.isAdmin) {
        return NextResponse.json(
          {
            error: `Invalid delivery status transition from ${existing.deliveryStatus} to ${deliveryStatus}. Expected progression: PENDING -> IN_PROGRESS -> DELIVERED -> COMPLETED.`,
          },
          { status: 400 }
        );
      }

      // Cannot advance to DELIVERED or COMPLETED if payment was rejected or refunded
      if (
        (deliveryStatus === "DELIVERED" || deliveryStatus === "COMPLETED") &&
        (existing.paymentStatus === "REJECTED" || existing.paymentStatus === "REFUNDED")
      ) {
        return NextResponse.json(
          {
            error: `Cannot mark delivery as ${deliveryStatus} while payment status is ${existing.paymentStatus}.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await db.transaction.update({
      where: { id },
      data: {
        ...(deliveryStatus ? { deliveryStatus } : {}),
        ...(paymentEvidenceUrl ? { paymentEvidenceUrl, paymentStatus: "EVIDENCE_SUBMITTED" } : {}),
        ...(paymentEvidenceNotes !== undefined ? { paymentEvidenceNotes } : {}),
      },
    });

    return NextResponse.json({ transaction: updated });
  } catch (err) {
    console.error("Failed to update transaction:", err);
    return NextResponse.json({ error: "Failed to update transaction" }, { status: 500 });
  }
}
