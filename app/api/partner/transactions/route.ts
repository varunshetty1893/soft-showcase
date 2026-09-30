// app/api/partner/transactions/route.ts
// Solution Partner transaction recording and evidence submission.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CreateTransactionSchema } from "@/lib/validation/transaction.schema";
import { generateSecureTransactionNumber } from "@/lib/utils/crypto";
import { transactionCreateLimiter, getClientIp } from "@/lib/utils/rate-limit";

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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
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

    const transactions = await db.transaction.findMany({
      where: { partnerId: partner.id },
      include: {
        solution: { select: { id: true, title: true, slug: true } },
        enquiry: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ transactions });
  } catch (err) {
    console.error("Failed to list partner transactions:", err);
    return NextResponse.json({ error: "Failed to load transactions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Request size limit: reject payloads > 256KB (Issue 46)
  const contentLength = req.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > 262144) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const ip = getClientIp(req);
  const rateCheck = await transactionCreateLimiter.check(session.user.id || ip);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: "Too many transaction recording requests. Please wait a few moments." },
      { status: 429 }
    );
  }

  try {
    let partner = await db.projectProvider.findFirst({
      where: { userId: session.user.id },
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

    // Request size limit: reject payloads > 256KB (Issue 46)
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > 262144) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = await req.json();
    const parsed = CreateTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Validate payment evidence URL (Issue 27: Arbitrary External URLs)
    if (data.paymentEvidenceUrl && !isValidEvidenceUrl(data.paymentEvidenceUrl)) {
      return NextResponse.json(
        { error: "Payment evidence must be uploaded through the platform storage." },
        { status: 400 }
      );
    }

    // Verify ownership of solutionId if provided (Issue 5: Transaction Cross-Linking)
    if (data.solutionId) {
      const solution = await db.project.findUnique({
        where: { id: data.solutionId },
      });
      if (!solution) {
        return NextResponse.json({ error: "Selected solution not found" }, { status: 404 });
      }
      if (solution.providerId !== partner.id && !session.user.isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: The specified solution does not belong to your partner account" },
          { status: 403 }
        );
      }
    }

    // Verify ownership of enquiryId if provided (Issue 5: Transaction Cross-Linking)
    if (data.enquiryId) {
      const enquiry = await db.inquiry.findUnique({
        where: { id: data.enquiryId },
      });
      if (!enquiry) {
        return NextResponse.json({ error: "Selected inquiry not found" }, { status: 404 });
      }
      if (enquiry.providerId !== partner.id && !session.user.isAdmin) {
        return NextResponse.json(
          { error: "Forbidden: The specified inquiry does not belong to your partner account" },
          { status: 403 }
        );
      }
    }

    // Generate collision-resistant unique transaction number with retry loop (Issue 25)
    let transactionNumber = generateSecureTransactionNumber();
    let collisionAttempts = 0;
    while (await db.transaction.findUnique({ where: { transactionNumber } })) {
      collisionAttempts++;
      transactionNumber = generateSecureTransactionNumber();
      if (collisionAttempts > 5) break;
    }

    // Try linking customer account if registered
    let customerId: string | null = null;
    const existingUser = await db.user.findUnique({
      where: { email: data.customerEmail },
      select: { id: true },
    });
    if (existingUser) {
      customerId = existingUser.id;
    }

    // Enforce initial business state constraints (Issue 26)
    const initialDeliveryStatus =
      data.deliveryStatus === "COMPLETED" || data.deliveryStatus === "DELIVERED"
        ? "IN_PROGRESS"
        : data.deliveryStatus || "PENDING";

    // Atomically create transaction and audit log
    const transaction = await db.$transaction(async (tx) => {
      const created = await tx.transaction.create({
        data: {
          transactionNumber,
          partnerId: partner.id,
          customerId,
          customerName: data.customerName,
          customerEmail: data.customerEmail,
          customerWhatsapp: data.customerWhatsapp || null,
          solutionId: data.solutionId || null,
          enquiryId: data.enquiryId || null,
          amount: data.amount as any,
          currency: data.currency || "INR",
          paymentMethod: data.paymentMethod || "UPI",
          utrNumber: data.utrNumber,
          paymentStatus: data.paymentEvidenceUrl ? "EVIDENCE_SUBMITTED" : "PENDING",
          paymentEvidenceUrl: data.paymentEvidenceUrl || null,
          paymentEvidenceNotes: data.paymentEvidenceNotes || null,
          projectType: data.projectType,
          description: data.description || null,
          deliveryStatus: initialDeliveryStatus,
          verificationSource: "manual_provider_submission",
        },
      });

      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          action: "TRANSACTION_RECORDED",
          entityType: "Transaction",
          entityId: created.id,
          details: {
            transactionNumber,
            amount: data.amount,
            currency: data.currency,
            partnerId: partner.id,
          },
        },
      }).catch(() => null);

      return created;
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to record transaction:", err);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
