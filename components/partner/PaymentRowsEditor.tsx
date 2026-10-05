// components/partner/PaymentRowsEditor.tsx
"use client";

import * as React from "react";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Plus, Sparkles, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseMoney } from "@/lib/utils/money";
import {
  UI_PAYMENT_METHODS,
  isCashMethod,
  normalizePaymentMethod,
  validateUtrForMethod,
} from "@/lib/transactions/payments";

export interface PaymentRow {
  key: string;
  amount: string;
  paymentMethod: string;
  utrNumber: string;
  evidenceUrl?: string;
  previewUrl?: string;
  fileName?: string;
  state: "idle" | "reading" | "uploading" | "ready" | "error";
  autoFilled?: boolean;
  messages: string[];
}

export function newPaymentRow(partial: Partial<PaymentRow> = {}): PaymentRow {
  return {
    key: Math.random().toString(36).slice(2, 10),
    amount: "",
    paymentMethod: "UPI",
    utrNumber: "",
    state: "idle",
    messages: [],
    ...partial,
  };
}

export function rowsAreBusy(rows: PaymentRow[]): boolean {
  return rows.some((r) => r.state === "reading" || r.state === "uploading");
}

export interface RowsValidation {
  ok: boolean;
  errors: string[];
  payments: Array<{ amount: number; paymentMethod: string; utrNumber: string | null; evidenceUrl: string | null }>;
  total: number;
}

/** Same rules as the API (shared helpers), so the user sees the problem before submitting. */
export function validatePaymentRows(rows: PaymentRow[]): RowsValidation {
  const errors: string[] = [];
  const payments: RowsValidation["payments"] = [];
  let totalCents = 0;
  rows.forEach((row, i) => {
    const label = `Payment ${i + 1}`;
    const amount = parseMoney(row.amount, `${label} amount`);
    if (!amount.ok) {
      errors.push(amount.error);
      return;
    }
    const method = normalizePaymentMethod(row.paymentMethod);
    const utr = validateUtrForMethod(method, row.utrNumber);
    if (!utr.ok) {
      errors.push(`${label}: ${utr.error}`);
      return;
    }
    totalCents += Math.round(amount.value * 100);
    payments.push({
      amount: amount.value,
      paymentMethod: method,
      utrNumber: utr.utr,
      evidenceUrl: row.evidenceUrl ?? null,
    });
  });
  const seen = new Set<string>();
  for (const p of payments) {
    if (!p.utrNumber) continue;
    if (seen.has(p.utrNumber)) errors.push(`UTR ${p.utrNumber} is entered more than once`);
    seen.add(p.utrNumber);
  }
  return { ok: errors.length === 0 && payments.length === rows.length, errors, payments, total: totalCents / 100 };
}

// Downscale before sending to the AI route: keeps the request small and fast and avoids
// body-size failures with large phone screenshots. The ORIGINAL file is what gets stored.
async function compressForReading(file: File): Promise<string> {
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
  try {
    const img: HTMLImageElement = await new Promise((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("decode failed"));
      el.src = dataUrl;
    });
    const maxSide = 1600;
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    if (scale === 1 && file.size < 1_500_000) return dataUrl;
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } catch {
    return dataUrl;
  }
}

interface ExtractResponse {
  amount?: string;
  utrNumber?: string;
  paymentMethod?: string;
  warnings?: string[];
  error?: string;
}

interface PaymentRowsEditorProps {
  rows: PaymentRow[];
  setRows: React.Dispatch<React.SetStateAction<PaymentRow[]>>;
  /** Maximum number of rows this editor may hold (3 minus payments that already exist). */
  maxRows: number;
  disabled?: boolean;
}

export function PaymentRowsEditor({ rows, setRows, maxRows, disabled }: PaymentRowsEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const rowFileRef = React.useRef<Record<string, HTMLInputElement | null>>({});
  const slotsLeft = Math.max(0, maxRows - rows.length);

  const patchRow = React.useCallback(
    (key: string, patch: Partial<PaymentRow> | ((r: PaymentRow) => Partial<PaymentRow>)) => {
      setRows((prev) =>
        prev.map((r) => (r.key === key ? { ...r, ...(typeof patch === "function" ? patch(r) : patch) } : r))
      );
    },
    [setRows]
  );

  const processFile = React.useCallback(
    async (key: string, file: File) => {
      patchRow(key, { state: "reading", fileName: file.name, messages: [] });
      let readingDataUrl = "";
      try {
        readingDataUrl = await compressForReading(file);
        patchRow(key, { previewUrl: readingDataUrl });
      } catch {
        /* preview is optional */
      }

      const messages: string[] = [];
      let extracted: ExtractResponse = {};
      try {
        const res = await fetch("/api/partner/receipt-extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageDataUrl: readingDataUrl }),
        });
        extracted = (await res.json().catch(() => ({}))) as ExtractResponse;
        if (!res.ok && !extracted.error) extracted.error = "Could not read this screenshot automatically.";
      } catch {
        extracted = { error: "Could not read this screenshot automatically. Please enter details manually." };
      }
      if (extracted.error) messages.push(extracted.error);
      if (extracted.warnings) messages.push(...extracted.warnings);

      patchRow(key, (r) => ({
        amount: extracted.amount || r.amount,
        utrNumber: extracted.utrNumber || r.utrNumber,
        paymentMethod: extracted.paymentMethod ? normalizePaymentMethod(extracted.paymentMethod) : r.paymentMethod,
        autoFilled: Boolean(extracted.amount || extracted.utrNumber),
        state: "uploading",
        messages,
      }));

      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await fetch("/api/partner/uploads", { method: "POST", body: formData });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.url) throw new Error(data?.error || "Screenshot upload failed");
        patchRow(key, { evidenceUrl: data.url, state: "ready" });
      } catch (err) {
        patchRow(key, (r) => ({
          state: "error",
          messages: [...r.messages, err instanceof Error ? err.message : "Screenshot upload failed"],
        }));
      }
    },
    [patchRow]
  );

  const addFiles = (files: FileList | null) => {
    if (!files || files.length === 0 || slotsLeft === 0) return;
    const picked = Array.from(files).slice(0, slotsLeft);
    const created = picked.map(() => newPaymentRow({ state: "reading" }));
    setRows((prev) => [...prev, ...created]);
    created.forEach((row, i) => {
      void processFile(row.key, picked[i]);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const attachToRow = (key: string, files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    void processFile(key, file);
    const input = rowFileRef.current[key];
    if (input) input.value = "";
  };

  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  return (
    <div className="space-y-4">
      {rows.map((row, index) => {
        const cash = isCashMethod(row.paymentMethod);
        const busy = row.state === "reading" || row.state === "uploading";
        return (
          <div key={row.key} className="rounded-2xl border border-[#D9E2E4] bg-[#F8FAFA] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-[#102124]">Payment {index + 1}</p>
              {!busy && !disabled && (
                <button
                  type="button"
                  onClick={() => removeRow(row.key)}
                  className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <X className="w-3 h-3" /> Remove
                </button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="sm:w-40 shrink-0">
                {row.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={row.previewUrl}
                    alt={`Payment ${index + 1} screenshot`}
                    className="w-full h-32 object-contain rounded-xl border border-[#D9E2E4] bg-white"
                  />
                ) : (
                  <label className="flex flex-col items-center justify-center gap-1 h-32 rounded-xl border-2 border-dashed border-[#D9E2E4] bg-white text-[#526267] cursor-pointer hover:border-[#155761]/60">
                    <ImagePlus className="w-5 h-5 text-[#155761]" />
                    <span className="text-[11px] font-semibold text-center px-2">
                      {cash ? "Receipt photo (optional)" : "Add screenshot"}
                    </span>
                    <input
                      ref={(el) => {
                        rowFileRef.current[row.key] = el;
                      }}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      disabled={busy || disabled}
                      onChange={(e) => attachToRow(row.key, e.target.files)}
                    />
                  </label>
                )}
                {busy && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[#155761]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {row.state === "reading" ? "Reading screenshot…" : "Uploading…"}
                  </div>
                )}
                {row.state === "ready" && (
                  <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Uploaded
                  </div>
                )}
              </div>

              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-semibold text-[#102124]">
                    Amount *
                    {row.autoFilled && row.amount && (
                      <span className="ml-1.5 text-[10px] font-normal text-emerald-600 inline-flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> auto-filled
                      </span>
                    )}
                  </Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min="1"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) =>
                      patchRow(row.key, { amount: e.target.value, autoFilled: false })
                    }
                    placeholder="e.g. 5000"
                    disabled={disabled}
                    className="mt-1 font-bold text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#102124]">Payment Mode</Label>
                  <select
                    value={row.paymentMethod}
                    onChange={(e) => patchRow(row.key, { paymentMethod: e.target.value })}
                    disabled={disabled}
                    className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
                  >
                    {UI_PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>

                {!cash && (
                  <div className="sm:col-span-2">
                    <Label className="text-xs font-semibold text-[#102124]">
                      UTR / Reference Number <span className="text-rose-500">*</span>
                      {row.autoFilled && row.utrNumber && (
                        <span className="ml-1.5 text-[10px] font-normal text-emerald-600 inline-flex items-center gap-0.5">
                          <Sparkles className="w-2.5 h-2.5 fill-amber-400 text-amber-500" /> auto-filled
                        </span>
                      )}
                    </Label>
                    <Input
                      value={row.utrNumber}
                      onChange={(e) => patchRow(row.key, { utrNumber: e.target.value, autoFilled: false })}
                      placeholder="12-digit UPI transaction ID, e.g. 412389102931"
                      disabled={disabled}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>
                )}
              </div>
            </div>

            {row.messages.length > 0 && (
              <div className="space-y-1">
                {row.messages.map((m, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-1.5 text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-px" />
                    <span>{m}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {slotsLeft > 0 && !disabled && (
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-[#D9E2E4] rounded-xl p-4 cursor-pointer hover:border-[#155761]/60 hover:bg-white transition-all text-xs font-bold text-[#155761]">
            <ImagePlus className="w-4 h-4" />
            Upload screenshot{slotsLeft > 1 ? "s" : ""} (up to {slotsLeft}) — AI fills amount &amp; UTR
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple={slotsLeft > 1}
              className="sr-only"
              onChange={(e) => addFiles(e.target.files)}
            />
          </label>
          <button
            type="button"
            onClick={() => setRows((prev) => [...prev, newPaymentRow()])}
            className="flex items-center justify-center gap-2 rounded-xl border border-[#D9E2E4] bg-white px-4 py-3 text-xs font-bold text-[#102124] hover:bg-[#F3F7F7] cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add payment manually / cash
          </button>
        </div>
      )}
      {slotsLeft === 0 && rows.length > 0 && (
        <p className="text-[11px] text-[#526267]">Maximum payments reached for this transaction.</p>
      )}
    </div>
  );
}
