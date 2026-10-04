// components/partner/TransactionForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2, Upload, Sparkles, CheckCircle2, X } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

interface SolutionOption {
  id: string;
  title: string;
}

interface TransactionFormProps {
  solutions: SolutionOption[];
}

interface ExtractedReceiptData {
  amount?: string;
  currency?: string;
  utrNumber?: string;
  paymentMethod?: string;
  confidence?: string;
}

// ── Receipt AI Extraction ──────────────────────────────────────────────────────
// Calls our server-side route to avoid exposing API keys client-side.
async function extractReceiptData(imageDataUrl: string): Promise<ExtractedReceiptData> {
  const res = await fetch("/api/partner/receipt-extract", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  });
  if (!res.ok) throw new Error("Could not read receipt automatically.");
  return res.json();
}

export function TransactionForm({ solutions }: TransactionFormProps) {
  const router = useRouter();
  const toast = useToast();

  const [customerName, setCustomerName] = React.useState("");
  const [customerEmail, setCustomerEmail] = React.useState("");
  const [customerWhatsapp, setCustomerWhatsapp] = React.useState("");
  const [solutionId, setSolutionId] = React.useState(solutions[0]?.id || "");
  const [projectType, setProjectType] = React.useState<
    "EXISTING_SOLUTION" | "CUSTOMIZED_EXISTING_SOLUTION" | "NEW_SOLUTION_FOR_CUSTOMER"
  >("EXISTING_SOLUTION");
  const [amount, setAmount] = React.useState("");
  const [currency, setCurrency] = React.useState("INR");
  const [paymentMethod, setPaymentMethod] = React.useState("UPI");
  const [utrNumber, setUtrNumber] = React.useState("");
  const [paymentEvidenceUrl, setPaymentEvidenceUrl] = React.useState("");
  const [paymentEvidenceNotes, setPaymentEvidenceNotes] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [deliveryStatus, setDeliveryStatus] = React.useState<
    "PENDING" | "IN_PROGRESS" | "DELIVERED" | "COMPLETED"
  >("PENDING");

  const [loading, setLoading] = React.useState(false);
  const [evidenceUploading, setEvidenceUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // ── Receipt AI state ─────────────────────────────────────────────────────────
  const [receiptExtracting, setReceiptExtracting] = React.useState(false);
  const [extractedData, setExtractedData] = React.useState<ExtractedReceiptData | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = React.useState<string | null>(null);
  const receiptInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleReceiptUpload = async (file: File | undefined) => {
    if (!file) return;
    setError(null);

    // Show local preview immediately
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target?.result as string;
      setReceiptPreviewUrl(dataUrl);

      // 1️⃣ Try AI extraction first
      setReceiptExtracting(true);
      try {
        const extracted = await extractReceiptData(dataUrl);
        const hasFields = Boolean(
          extracted.amount || extracted.currency || extracted.utrNumber || extracted.paymentMethod
        );

        if (hasFields) {
          setExtractedData(extracted);
          if (extracted.amount) setAmount(extracted.amount);
          if (extracted.currency) setCurrency(extracted.currency.toUpperCase());
          if (extracted.utrNumber) setUtrNumber(extracted.utrNumber);
          if (extracted.paymentMethod) setPaymentMethod(extracted.paymentMethod);
          toast.success("Receipt details auto-filled! Please verify below.");
        } else {
          setExtractedData(null);
          toast.info("Could not auto-detect details from this screenshot. Please enter Amount and UTR manually.");
        }
      } catch {
        // AI extraction failed — still upload the file normally
        setExtractedData(null);
        toast.error("Could not auto-read receipt. Please fill fields manually.");
      } finally {
        setReceiptExtracting(false);
      }

      // 2️⃣ Upload file to storage
      setEvidenceUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/partner/uploads", { method: "POST", body: formData });
        const data = await res.json();
        if (!res.ok || !data?.url) throw new Error(data?.error || "Evidence upload failed");
        setPaymentEvidenceUrl(data.url);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Evidence upload failed");
      } finally {
        setEvidenceUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearReceipt = () => {
    setReceiptPreviewUrl(null);
    setExtractedData(null);
    setPaymentEvidenceUrl("");
    if (receiptInputRef.current) receiptInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerWhatsapp: customerWhatsapp.trim() || undefined,
        solutionId: solutionId || undefined,
        projectType,
        amount: Number(amount),
        currency,
        paymentMethod,
        utrNumber: utrNumber.trim(),
        paymentEvidenceUrl: paymentEvidenceUrl.trim() || undefined,
        paymentEvidenceNotes: paymentEvidenceNotes.trim() || undefined,
        description: description.trim() || undefined,
        deliveryStatus,
      };

      const res = await fetch("/api/partner/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to record transaction");
      }

      router.push(`/partner/transactions?success=${encodeURIComponent("Transaction recorded successfully.")}`);
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const isBusy = evidenceUploading || receiptExtracting;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Customer Information */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          1. Customer &amp; Client Details
        </h2>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Customer Full Name *</Label>
          <Input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Rahul Sharma"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Customer Email *</Label>
            <Input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="buyer@clientdomain.com"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Customer WhatsApp (Optional)</Label>
            <Input
              value={customerWhatsapp}
              onChange={(e) => setCustomerWhatsapp(e.target.value)}
              placeholder="919876543210"
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Solution & Scope */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          2. Solution &amp; Project Scope
        </h2>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Project Scope Type *</Label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value as any)}
            className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
          >
            <option value="EXISTING_SOLUTION">Existing Listed Solution</option>
            <option value="CUSTOMIZED_EXISTING_SOLUTION">Customized Existing Solution</option>
            <option value="NEW_SOLUTION_FOR_CUSTOMER">New Custom Solution for Customer</option>
          </select>
        </div>

        {solutions.length > 0 && (
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Associated Solution</Label>
            <select
              value={solutionId}
              onChange={(e) => setSolutionId(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="">-- None / Custom Project --</option>
              {solutions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Scope Notes / Custom Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Delivered full Next.js source code + Stripe Connect integration and 1 month deployment support..."
            rows={3}
            className="mt-1 text-xs"
          />
        </div>
      </div>

      {/* Payment & Evidence */}
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          3. Payment Amount &amp; UTR Evidence
        </h2>

        {/* ── Receipt Upload with AI extraction ─────────────────────────── */}
        <div className="rounded-2xl border border-[#D9E2E4] bg-[#F8FAFA] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-[#102124]">
              Payment Screenshot / Receipt
            </Label>
            {receiptPreviewUrl && !isBusy && (
              <button
                type="button"
                onClick={clearReceipt}
                className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
              >
                <X className="w-3 h-3" /> Remove
              </button>
            )}
          </div>

          {!receiptPreviewUrl ? (
            /* Upload drop zone */
            <label
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer transition-all ${
                isBusy
                  ? "border-[#155761] bg-[#EBF7F5]"
                  : "border-[#D9E2E4] hover:border-[#155761]/60 hover:bg-white"
              }`}
            >
              {isBusy ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin text-[#155761]" />
                  <p className="text-xs font-bold text-[#155761]">
                    {receiptExtracting ? "Reading receipt with AI…" : "Uploading receipt…"}
                  </p>
                  <p className="text-[11px] text-[#526267]">Please wait a moment.</p>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-full bg-[#155761]/10 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-[#155761]" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-[#102124]">Upload payment screenshot</p>
                    <p className="text-[11px] text-[#526267] mt-0.5">
                      PNG, JPG, WebP — AI will auto-fill amount &amp; UTR from the image
                    </p>
                  </div>
                </>
              )}
              <input
                ref={receiptInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                disabled={isBusy}
                onChange={(e) => handleReceiptUpload(e.target.files?.[0])}
              />
            </label>
          ) : (
            /* Preview + AI-extracted banner */
            <div className="space-y-3">
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptPreviewUrl}
                alt="Receipt preview"
                className="w-full max-h-48 object-contain rounded-xl border border-[#D9E2E4] bg-white"
              />

              {/* AI extraction in progress */}
              {receiptExtracting && (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>AI is reading your receipt — fields will fill automatically…</span>
                </div>
              )}

              {/* Extraction success notice */}
              {extractedData && !receiptExtracting && (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                  <div>
                    <p className="font-bold">Fields auto-filled from your screenshot</p>
                    <p className="text-[11px] mt-0.5 text-emerald-700">
                      Review and edit any field below before submitting.
                    </p>
                  </div>
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 shrink-0 ml-auto" />
                </div>
              )}

              {/* Upload in progress */}
              {evidenceUploading && !receiptExtracting && (
                <div className="flex items-center gap-2 p-3 bg-[#EBF7F5] border border-[#2F7D78]/30 rounded-xl text-xs text-[#155761] font-semibold">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Uploading receipt to secure storage…</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Amount & Currency ──────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">
              Amount Received *
              {extractedData?.amount && (
                <span className="ml-1.5 text-[10px] font-normal text-emerald-600 inline-flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> auto-filled
                </span>
              )}
            </Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="25000"
              required
              className="mt-1 font-bold text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Currency</Label>
            <Input
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1 text-xs font-mono uppercase"
            />
          </div>
        </div>

        {/* ── Payment Mode & UTR ────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">
              Payment Mode
              {extractedData?.paymentMethod && (
                <span className="ml-1.5 text-[10px] font-normal text-emerald-600 inline-flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> auto-filled
                </span>
              )}
            </Label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="UPI">UPI (Google Pay / PhonePe / Paytm)</option>
              <option value="NEFT_RTGS">NEFT / RTGS Bank Transfer</option>
              <option value="IMPS">IMPS Immediate Transfer</option>
              <option value="WIRE_TRANSFER">International Wire / SWIFT</option>
              <option value="CARD">Debit / Credit Card</option>
              <option value="CASH">Cash (In-Person)</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">
              UTR / Bank Ref Number
              {paymentMethod === "CASH" ? (
                <span className="ml-1 text-[10px] font-normal text-[#526267]">(optional for cash)</span>
              ) : (
                <span className="text-rose-500"> *</span>
              )}
              {extractedData?.utrNumber && (
                <span className="ml-1.5 text-[10px] font-normal text-emerald-600 inline-flex items-center gap-0.5">
                  <Sparkles className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> auto-filled
                </span>
              )}
            </Label>
            <Input
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder={paymentMethod === "CASH" ? "e.g. Receipt #001 (optional)" : "e.g. 412389102931"}
              required={paymentMethod !== "CASH"}
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>

        {/* ── Evidence notes ────────────────────────────────────────────── */}
        <div>
          <Label className="text-xs font-semibold text-[#102124]">Evidence Notes (Optional)</Label>
          <Input
            value={paymentEvidenceNotes}
            onChange={(e) => setPaymentEvidenceNotes(e.target.value)}
            placeholder="e.g. Verified via Axis Bank statement reference #9812"
            className="mt-1 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Delivery Status</Label>
          <select
            value={deliveryStatus}
            onChange={(e) => setDeliveryStatus(e.target.value as any)}
            className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
          >
            <option value="PENDING">Pending (Awaiting Kickoff)</option>
            <option value="IN_PROGRESS">In Progress (Code Handover underway)</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link
          href="/partner/transactions"
          className={buttonVariants({ variant: "outline", size: "md" })}
        >
          Cancel
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={isBusy || loading}
          className="font-bold shadow-md"
        >
          Submit Transaction Record
        </Button>
      </div>
    </form>
  );
}
