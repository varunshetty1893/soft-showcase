// app/api/partner/transactions/route.ts
// Solution Partner transaction recording and evidence submission.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CreateTransactionSchema } from "@/lib/validation/transaction.schema";
import { generateSecureTransactionNumber } from "@/lib/utils/crypto";
import { transactionCreateLimiter, getClientIp } from "@/lib/utils/rate-limit";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";
import { isValidEvidenceUrl } from "@/lib/transactions/evidence";
import { firstValidationMessage } from "@/lib/transactions/errors";
import {
  createTransactionWithPayments,
  PaymentRuleError,
} from "@/lib/db/queries/transaction-payments";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const partner = await resolvePartnerForUser(session.user);

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
        payments: { orderBy: { sequence: "asc" } },
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
    const partner = await resolvePartnerForUser(session.user);

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
        { error: firstValidationMessage(parsed.error), details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.deliveryStatus === "DELIVERED" || data.deliveryStatus === "COMPLETED") {
      return NextResponse.json(
        { error: "New transaction records must start as Pending or In Progress. Update delivery status after creation." },
        { status: 400 }
      );
    }

    // Validate payment evidence URLs (Issue 27: Arbitrary External URLs)
    for (const payment of data.payments) {
      if (payment.evidenceUrl && !isValidEvidenceUrl(payment.evidenceUrl)) {
        return NextResponse.json(
          { error: "Payment screenshots must be uploaded through the platform storage." },
          { status: 400 }
        );
      }
    }

    // Verify ownership of solutionId if provided (Issue 5: Transaction Cross-Linking)
    let solution: { id: string; providerId: string } | null = null;
    if (data.solutionId) {
      solution = await db.project.findUnique({
        where: { id: data.solutionId },
        select: { id: true, providerId: true },
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
    let enquiry: {
      projectId: string;
      customerId: string | null;
      name: string;
      email: string;
      whatsapp: string | null;
      providerId: string;
    } | null = null;
    if (data.enquiryId) {
      enquiry = await db.inquiry.findUnique({
        where: { id: data.enquiryId },
        select: {
          projectId: true,
          customerId: true,
          name: true,
          email: true,
          whatsapp: true,
          providerId: true,
        },
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

      if (solution && enquiry.projectId !== solution.id) {
        return NextResponse.json(
          { error: "The selected inquiry belongs to a different solution." },
          { status: 400 }
        );
      }

      const differs = (submitted: string | null | undefined, authoritative: string | null) =>
        authoritative !== null && (submitted || "").trim().toLowerCase() !== authoritative.trim().toLowerCase();
      if (
        differs(data.customerEmail, enquiry.email) ||
        differs(data.customerName, enquiry.name) ||
        differs(data.customerWhatsapp, enquiry.whatsapp)
      ) {
        return NextResponse.json(
          { error: "Customer details must match the selected inquiry." },
          { status: 400 }
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
    let customerId: string | null = enquiry?.customerId ?? null;
    if (!customerId) {
      const existingUser = await db.user.findUnique({
        where: { email: enquiry?.email ?? data.customerEmail },
        select: { id: true },
      });
      customerId = existingUser?.id ?? null;
    }

    // Atomically create the transaction, its payment rows and the audit record.
    // Totals, overpayment, the 3-payment limit and duplicate-UTR rules are enforced inside.
    const transaction = await createTransactionWithPayments({
      transactionNumber,
      partnerId: partner.id,
      customerId,
      createdById: session.user.id,
      data: {
        customerName: enquiry?.name ?? data.customerName,
        customerEmail: enquiry?.email ?? data.customerEmail,
        customerWhatsapp: enquiry?.whatsapp ?? (data.customerWhatsapp || null),
        solutionId: data.solutionId || null,
        enquiryId: data.enquiryId || null,
        agreedAmount: data.agreedAmount ?? null,
        currency: data.currency || "INR",
        payments: data.payments,
        paymentEvidenceNotes: data.paymentEvidenceNotes || null,
        projectType: data.projectType,
        description: data.description || null,
        deliveryStatus: data.deliveryStatus === "IN_PROGRESS" ? "IN_PROGRESS" : "PENDING",
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err: unknown) {
    if (err instanceof PaymentRuleError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("Failed to record transaction:", err);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
