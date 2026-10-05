// app/api/partner/receipt-extract/route.ts
// Reads ONE payment screenshot with Google Gemini Vision and returns amount, UTR and method.
// Degrades gracefully: on any failure it returns { error } with HTTP 200 so the form can show
// a clear message and fall back to manual entry (it never fails silently).
//
// Env:
//   GEMINI_API_KEY  (required)
//   GEMINI_MODEL    (optional) preferred model id. If it is missing / retired (404) the
//                   fallback chain below is tried automatically.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";
import { db } from "@/lib/db/client";
import { cleanReceiptExtraction } from "@/lib/transactions/receipt-parse";

// Gemini 1.5 / 2.0 are retired and 2.5 is being shut down (16 Oct 2026), so the chain starts
// with the current Gemini 3 family. The first model that answers wins.
const MODEL_CHAIN = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest"];

const MAX_BASE64_CHARS = 7_000_000; // ~5 MB image

const PROMPT = `You read payment screenshots (Google Pay, PhonePe, Paytm, BHIM, Cred, Amazon Pay, bank apps, bank receipts).
Extract these fields exactly as shown on screen:

- amount: the amount paid, digits and an optional decimal point only (e.g. "2", "25000", "499.50"). Ignore fees, cashback, discounts, balances.
- currency: "INR" for the rupee sign, otherwise the 3-letter ISO code.
- upiTransactionId: the 12-digit number labelled "UPI transaction ID", "UTR", "UTR No", "UPI Ref No", "UPI Reference ID", "Transaction reference" or "Ref No". It is ALWAYS exactly 12 digits.
  * Google Pay shows two IDs. Use the 12-digit "UPI transaction ID". NEVER use "Google transaction ID" (it looks like CICAgPiq...).
  * PhonePe shows a "Transaction ID" starting with T... and a separate 12-digit "UTR". Use the 12-digit UTR.
  * Never use order IDs, merchant IDs, VPAs/UPI handles, phone numbers or account numbers.
- otherReferenceId: any other transaction/order/Google ID shown (informational only).
- paymentMethod: one of UPI, IMPS, NEFT_RTGS, CREDIT_DEBIT_CARD, WIRE_TRANSFER, CASH, OTHER. Use UPI for Google Pay, PhonePe, Paytm, BHIM and anything showing UPI.
- paymentStatus: the status text shown (e.g. "Completed", "Success", "Failed", "Pending").
- transactionDate: the date/time shown, as written.

If a field is not visible, return an empty string for it. Never guess or invent digits.`;

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    amount: { type: "STRING" },
    currency: { type: "STRING" },
    upiTransactionId: { type: "STRING" },
    otherReferenceId: { type: "STRING" },
    paymentMethod: { type: "STRING" },
    paymentStatus: { type: "STRING" },
    transactionDate: { type: "STRING" },
  },
  required: ["amount", "upiTransactionId"],
};

async function callGemini(model: string, apiKey: string, mimeType: string, base64Data: string) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ inlineData: { mimeType, data: base64Data } }, { text: PROMPT }],
          },
        ],
        generationConfig: {
          temperature: 0,
          // Large enough that "thinking" tokens can never truncate the JSON answer
          maxOutputTokens: 4096,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      }),
    }
  );
  return res;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const partner = await resolvePartnerForUser(session.user);
    if (!partner) {
      return NextResponse.json({ error: "Partner account required" }, { status: 403 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: "Automatic reading is not configured. Please enter the amount and UTR manually.",
        warnings: [],
      });
    }

    const body = await req.json().catch(() => null);
    const imageDataUrl = (body as { imageDataUrl?: string } | null)?.imageDataUrl;
    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    const [header, base64Data] = imageDataUrl.split(",");
    if (!base64Data || base64Data.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ error: "Image is too large to read. Please enter details manually." });
    }
    const mimeMatch = header.match(/data:(image\/[a-z+.-]+);base64/);
    const mimeType = mimeMatch?.[1] ?? "image/jpeg";

    const models = Array.from(new Set([process.env.GEMINI_MODEL?.trim(), ...MODEL_CHAIN].filter(Boolean) as string[]));

    let rawText = "";
    let lastError = "";
    for (const model of models) {
      let res: Response;
      try {
        res = await callGemini(model, apiKey, mimeType, base64Data);
      } catch (err) {
        lastError = `network error (${model})`;
        console.error("[receipt-extract] network error:", model, err);
        continue;
      }
      if (res.status === 404) {
        lastError = `model ${model} unavailable`;
        console.warn("[receipt-extract] model unavailable, trying next:", model);
        continue; // retired / unknown model: try the next one
      }
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        lastError = `Gemini error ${res.status} (${model})`;
        console.error("[receipt-extract] Gemini API error:", model, res.status, text.slice(0, 300));
        if (res.status === 400 || res.status === 401 || res.status === 403) break; // key / request problem: retrying won't help
        continue;
      }
      const data = await res.json();
      const parts: Array<{ text?: string; thought?: boolean }> = data?.candidates?.[0]?.content?.parts ?? [];
      rawText = parts
        .filter((p) => !p.thought && typeof p.text === "string")
        .map((p) => p.text as string)
        .join("");
      if (rawText) break;
      lastError = `empty response (${model})`;
    }

    if (!rawText) {
      console.error("[receipt-extract] no usable response:", lastError);
      return NextResponse.json({
        error: "Could not read this screenshot automatically. Please enter the amount and UTR manually.",
        warnings: [],
      });
    }

    let parsedJson: Record<string, unknown> = {};
    try {
      const match = rawText.match(/\{[\s\S]*\}/);
      parsedJson = match ? JSON.parse(match[0]) : {};
    } catch {
      parsedJson = {};
    }

    const cleaned = cleanReceiptExtraction(parsedJson, rawText);

    // Early duplicate warning so the partner knows before submitting
    let utrAlreadyUsed = false;
    if (cleaned.utrNumber) {
      const clash = await db.transactionPayment
        .findFirst({
          where: { utrNumber: { equals: cleaned.utrNumber, mode: "insensitive" }, status: { not: "REJECTED" } },
          select: { id: true },
        })
        .catch(() => null);
      utrAlreadyUsed = Boolean(clash);
      if (utrAlreadyUsed) {
        cleaned.warnings.push("This UTR has already been used on another payment.");
      }
    }

    return NextResponse.json({ ...cleaned, utrAlreadyUsed });
  } catch (err) {
    console.error("[receipt-extract] Error:", err);
    return NextResponse.json({
      error: "Could not read this screenshot automatically. Please enter the amount and UTR manually.",
      warnings: [],
    });
  }
}
