// app/api/partner/receipt-extract/route.ts
// Server-side route that accepts a base64 receipt image and returns
// extracted payment fields using Google Gemini Vision.
// Requires GEMINI_API_KEY in environment variables.
// Falls back gracefully if the key is missing or extraction fails.

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/session";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";

// Maps common receipt text patterns to our internal payment method codes
function normalisePaymentMethod(raw: string): string {
  const u = raw.toUpperCase();
  if (u.includes("UPI") || u.includes("GPAY") || u.includes("PHONEPE") || u.includes("PAYTM")) return "UPI";
  if (u.includes("NEFT")) return "NEFT_RTGS";
  if (u.includes("RTGS")) return "NEFT_RTGS";
  if (u.includes("IMPS")) return "IMPS";
  if (u.includes("SWIFT") || u.includes("WIRE")) return "WIRE_TRANSFER";
  if (u.includes("CARD") || u.includes("VISA") || u.includes("MASTER")) return "CARD";
  if (u.includes("CASH")) return "CASH";
  return raw;
}

export async function POST(req: NextRequest) {
  try {
    // Auth guard
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
      // Return empty extraction if key not configured; client shows manual fill
      return NextResponse.json({}, { status: 200 });
    }

    const body = await req.json();
    const { imageDataUrl } = body as { imageDataUrl?: string };

    if (!imageDataUrl || !imageDataUrl.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Strip the data URL prefix to get raw base64
    const [header, base64Data] = imageDataUrl.split(",");
    const mimeMatch = header.match(/data:(image\/[a-z]+);base64/);
    const mimeType = mimeMatch?.[1] ?? "image/jpeg";

    // Call Gemini gemini-1.5-flash with vision
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: `You are a payment receipt data extractor. Analyze this payment receipt screenshot and extract the following fields. 
Respond ONLY with a valid JSON object (no markdown, no explanation):
{
  "amount": "<numeric amount as string, digits only, e.g. '25000'>",
  "currency": "<3-letter ISO currency code, e.g. 'INR', 'USD'>",
  "utrNumber": "<UTR/transaction reference/UPI ID/bank ref number as string>",
  "paymentMethod": "<one of: UPI, NEFT, RTGS, IMPS, SWIFT, WIRE, CARD, CASH, or the raw text if unknown>",
  "confidence": "<'high', 'medium', or 'low'>"
}
If a field is not visible in the receipt, omit it from the JSON. Do not guess.`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0,
            maxOutputTokens: 256,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      console.error("[receipt-extract] Gemini API error:", await geminiRes.text());
      return NextResponse.json({}, { status: 200 }); // Degrade gracefully
    }

    const geminiData = await geminiRes.json();
    const rawText: string =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Parse JSON from Gemini response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({}, { status: 200 });
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Normalise payment method
    if (extracted.paymentMethod) {
      extracted.paymentMethod = normalisePaymentMethod(extracted.paymentMethod);
    }

    return NextResponse.json(extracted, { status: 200 });
  } catch (err) {
    console.error("[receipt-extract] Error:", err);
    // Always degrade gracefully — don't break the form
    return NextResponse.json({}, { status: 200 });
  }
}
