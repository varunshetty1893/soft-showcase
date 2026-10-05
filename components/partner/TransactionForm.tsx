// components/partner/TransactionForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { parseMoney, formatMoney } from "@/lib/utils/money";
import { MAX_ACTIVE_PAYMENTS } from "@/lib/transactions/payments";
import {
  PaymentRowsEditor,
  rowsAreBusy,
  validatePaymentRows,
  type PaymentRow,
} from "@/components/partner/PaymentRowsEditor";

interface SolutionOption {
  id: string;
  title: string;
}

interface TransactionFormProps {
  solutions: SolutionOption[];
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
  const [currency, setCurrency] = React.useState("INR");
  const [agreedAmount, setAgreedAmount] = React.useState("");
  const [paymentEvidenceNotes, setPaymentEvidenceNotes] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [deliveryStatus, setDeliveryStatus] = React.useState<"PENDING" | "IN_PROGRESS">("PENDING");

  const [rows, setRows] = React.useState<PaymentRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const validation = React.useMemo(() => validatePaymentRows(rows), [rows]);
  const paidNow = validation.total;
  const agreedParsed = agreedAmount.trim() === "" ? null : parseMoney(agreedAmount, "Total deal amount");
  const agreedValue = agreedParsed && agreedParsed.ok ? agreedParsed.value : null;
  const effectiveAgreed = agreedValue ?? paidNow;
  const balanceAfter = Math.max(0, Math.round((effectiveAgreed - paidNow) * 100) / 100);
  const busy = rowsAreBusy(rows);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (rows.length === 0) {
      setError("Add at least one payment (screenshot or cash entry).");
      return;
    }
    if (rows.length > MAX_ACTIVE_PAYMENTS) {
      setError(`A transaction can have at most ${MAX_ACTIVE_PAYMENTS} payments.`);
      return;
    }
    if (agreedParsed && !agreedParsed.ok) {
      setError(agreedParsed.error);
      return;
    }
    const check = validatePaymentRows(rows);
    if (!check.ok) {
      setError(check.errors[0] ?? "Please check the payment details.");
      return;
    }
    if (agreedValue !== null && check.total > agreedValue) {
      setError(
        `Payments total ${formatMoney(check.total, currency)} which is more than the total deal amount ${formatMoney(agreedValue, currency)}.`
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerEmail: customerEmail.trim().toLowerCase(),
        customerWhatsapp: customerWhatsapp.trim() || undefined,
        solutionId: solutionId || undefined,
        projectType,
        currency,
        agreedAmount: agreedValue ?? undefined,
        payments: check.payments,
        paymentEvidenceNotes: paymentEvidenceNotes.trim() || undefined,
        description: description.trim() || undefined,
        deliveryStatus,
      };

      const res = await fetch("/api/partner/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
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
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        <div className="border-b border-[#F3F7F7] pb-3">
          <h2 className="text-base font-bold text-[#102124]">3. Payments &amp; UTR Evidence</h2>
          <p className="text-[11px] text-[#526267] mt-1">
            A customer can pay in up to {MAX_ACTIVE_PAYMENTS} payments. Each payment is recorded separately with its own
            screenshot and UTR. UTR is not needed for cash payments.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">
              Total Deal Amount <span className="text-[10px] font-normal text-[#526267]">(leave empty if fully paid now)</span>
            </Label>
            <Input
              type="number"
              inputMode="decimal"
              min="1"
              step="0.01"
              value={agreedAmount}
              onChange={(e) => setAgreedAmount(e.target.value)}
              placeholder="e.g. 25000"
              className="mt-1 font-bold text-sm"
            />
          </div>
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Currency</Label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-mono font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              {["INR", "USD", "EUR", "GBP", "AED", "SGD"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <PaymentRowsEditor rows={rows} setRows={setRows} maxRows={MAX_ACTIVE_PAYMENTS} disabled={loading} />

        {rows.length > 0 && (
          <div className="rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] p-4 text-xs space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#526267]">Paid in this submission</span>
              <strong className="text-[#155761]">{formatMoney(paidNow, currency)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#526267]">Total deal amount</span>
              <strong>{formatMoney(effectiveAgreed, currency)}</strong>
            </div>
            <div className="flex justify-between border-t border-[#D9E2E4] pt-1.5">
              <span className="text-[#526267]">Balance remaining</span>
              <strong className={balanceAfter > 0 ? "text-amber-700" : "text-emerald-700"}>
                {formatMoney(balanceAfter, currency)}
              </strong>
            </div>
          </div>
        )}

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Evidence Notes (Optional)</Label>
          <Input
            value={paymentEvidenceNotes}
            onChange={(e) => setPaymentEvidenceNotes(e.target.value)}
            placeholder="e.g. First installment received via GPay"
            className="mt-1 text-xs"
          />
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Delivery Status</Label>
          <select
            value={deliveryStatus}
            onChange={(e) => setDeliveryStatus(e.target.value as "PENDING" | "IN_PROGRESS")}
            className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
          >
            <option value="PENDING">Pending (Awaiting Kickoff)</option>
            <option value="IN_PROGRESS">In Progress (Code Handover underway)</option>
          </select>
          <p className="text-[11px] text-[#526267] mt-1">
            Delivered / Completed can only be set after the full amount is paid and verified.
          </p>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/partner/transactions" className={buttonVariants({ variant: "outline", size: "md" })}>
          Cancel
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          disabled={busy || loading || rows.length === 0}
          className="font-bold shadow-md"
        >
          Submit Transaction Record
        </Button>
      </div>
    </form>
  );
}
