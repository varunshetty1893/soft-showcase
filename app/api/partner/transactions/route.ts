// app/api/partner/transactions/route.ts
// Solution Partner transaction recording and evidence submission.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/client";
import { CreateTransactionSchema } from "@/lib/validation/transaction.schema";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    const body = await req.json();
    const parsed = CreateTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Generate unique transaction number: e.g. TXN-YYYYMMDD-XXXX
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const rand = Math.floor(1000 + Math.random() * 9000);
    const transactionNumber = `TXN-${dateStr}-${rand}`;

    // Try linking customer account if registered
    let customerId: string | null = null;
    const existingUser = await db.user.findUnique({
      where: { email: data.customerEmail },
      select: { id: true },
    });
    if (existingUser) {
      customerId = existingUser.id;
    }

    const transaction = await db.transaction.create({
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
        deliveryStatus: data.deliveryStatus,
        verificationSource: "manual_provider_submission",
      },
    });

    return NextResponse.json({ transaction }, { status: 201 });
  } catch (err: unknown) {
    console.error("Failed to record transaction:", err);
    return NextResponse.json({ error: "Failed to record transaction" }, { status: 500 });
  }
}
