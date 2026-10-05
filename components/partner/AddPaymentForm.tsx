// components/partner/AddPaymentForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { formatMoney } from "@/lib/utils/money";
import {
  PaymentRowsEditor,
  rowsAreBusy,
  validatePaymentRows,
  type PaymentRow,
} from "@/components/partner/PaymentRowsEditor";

interface AddPaymentFormProps {
  transactionId: string;
  slotsLeft: number;
  remainingToSubmit: number;
  currency: string;
}

export function AddPaymentForm({ transactionId, slotsLeft, remainingToSubmit, currency }: AddPaymentFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = React.useState(false);
  const [rows, setRows] = React.useState<PaymentRow[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (slotsLeft <= 0 || remainingToSubmit <= 0) return null;

  const submit = async () => {
    setError(null);
    if (rows.length === 0) {
      setError("Add at least one payment.");
      return;
    }
    const check = validatePaymentRows(rows);
    if (!check.ok) {
      setError(check.errors[0] ?? "Please check the payment details.");
      return;
    }
    if (check.total > remainingToSubmit) {
      setError(`Payments total ${formatMoney(check.total, currency)} but only ${formatMoney(remainingToSubmit, currency)} is outstanding.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/transactions/${transactionId}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payments: check.payments }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to add payment");
      toast.success("Payment added and sent for verification.");
      setRows([]);
      setOpen(false);
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to add payment";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 font-bold">
        <PlusCircle className="w-4 h-4" />
        Add next payment ({slotsLeft} left • {formatMoney(remainingToSubmit, currency)} outstanding)
      </Button>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-[#D9E2E4] bg-white p-4">
      <p className="text-xs font-bold text-[#102124]">
        Add payment(s) — up to {slotsLeft} more, outstanding {formatMoney(remainingToSubmit, currency)}
      </p>
      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <PaymentRowsEditor rows={rows} setRows={setRows} maxRows={slotsLeft} disabled={loading} />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => { setOpen(false); setRows([]); setError(null); }} disabled={loading}>
          Cancel
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={submit} isLoading={loading} disabled={rowsAreBusy(rows) || loading || rows.length === 0}>
          Submit payment
        </Button>
      </div>
    </div>
  );
}
