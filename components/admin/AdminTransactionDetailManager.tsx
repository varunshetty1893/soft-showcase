// components/admin/AdminTransactionDetailManager.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/format";
import { formatMoney } from "@/lib/utils/money";
import { summarizeTransaction } from "@/lib/transactions/summary";
import { PaymentsTable } from "@/components/transactions/PaymentsTable";
import { MAX_ACTIVE_PAYMENTS } from "@/lib/transactions/payments";

interface AdminTransactionDetailManagerProps {
  transaction: any;
}

export function AdminTransactionDetailManager({ transaction }: AdminTransactionDetailManagerProps) {
  const router = useRouter();
  const toast = useToast();

  const [paymentStatus, setPaymentStatus] = React.useState(transaction.paymentStatus || "PENDING");
  const [deliveryStatus, setDeliveryStatus] = React.useState(transaction.deliveryStatus || "PENDING");
  const [adminNotes, setAdminNotes] = React.useState(transaction.adminNotes || "");
  const [loading, setLoading] = React.useState(false);

  const summary = React.useMemo(() => summarizeTransaction(transaction), [transaction]);
  const [reviewingId, setReviewingId] = React.useState<string | null>(null);

  // Keep local status controls in sync after router.refresh() re-renders with fresh server data
  React.useEffect(() => {
    setPaymentStatus(transaction.paymentStatus || "PENDING");
    setDeliveryStatus(transaction.deliveryStatus || "PENDING");
  }, [transaction.paymentStatus, transaction.deliveryStatus]);

  const reviewPayment = async (paymentId: string, action: "VERIFY" | "REJECT") => {
    let reason: string | undefined;
    if (action === "REJECT") {
      const input = window.prompt("Reason for rejecting this payment (shown to the partner):", "");
      if (input === null) return;
      reason = input.trim() || undefined;
    }
    setReviewingId(paymentId);
    try {
      const res = await fetch(`/api/admin/transactions/${transaction.id}/payments/${paymentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update payment");
      toast.success(action === "VERIFY" ? "Payment verified. Receipt issued." : "Payment rejected.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setReviewingId(null);
    }
  };

  const handleUpdate = async (newStatus?: string) => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/transactions/${transaction.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentStatus: newStatus || paymentStatus,
          deliveryStatus,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update transaction");

      if (newStatus) setPaymentStatus(newStatus);
      toast.success("Transaction updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/transactions"
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-950">
                Transaction Audit: {transaction.transactionNumber}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  paymentStatus === "VERIFIED" || paymentStatus === "COMPLETED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : paymentStatus === "REJECTED"
                    ? "bg-rose-50 text-rose-700 border border-rose-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {paymentStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 font-mono mt-0.5">
              {transaction.utrNumber ? `UTR: ${transaction.utrNumber}` : "No UTR (cash)"} • Created {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {paymentStatus !== "VERIFIED" && summary.remainingToSubmit === 0 && summary.balance > 0 && (
            <Button
              size="sm"
              onClick={() => handleUpdate("VERIFIED")}
              isLoading={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1 text-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Verified</span>
            </Button>
          )}

          {paymentStatus !== "REJECTED" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleUpdate("REJECTED")}
              isLoading={loading}
              className="text-rose-600 hover:bg-rose-50 border-rose-200 text-xs gap-1"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Reject Evidence</span>
            </Button>
          )}
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-2">
            Payment &amp; Financials
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Total deal amount:</span>
              <strong className="text-sm font-extrabold text-indigo-700">
                {formatMoney(summary.agreedAmount, transaction.currency)}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Verified so far:</span>
              <span className="font-semibold">{formatMoney(summary.verifiedTotal, transaction.currency)}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Balance:</span>
              <span className={`font-bold ${summary.balance > 0 ? "text-amber-700" : "text-emerald-700"}`}>
                {summary.balance > 0 ? formatMoney(summary.balance, transaction.currency) : "Nil — paid in full"}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Payments:</span>
              <span className="font-semibold">{summary.activeCount} of {MAX_ACTIVE_PAYMENTS}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Verification Source:</span>
              <span className="font-mono text-[11px] text-gray-600">{transaction.verificationSource}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-2">
            Partner &amp; Customer
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Solution Partner:</span>
              <span className="font-bold text-gray-900">{transaction.partner?.displayName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Partner Email:</span>
              <span>{transaction.partner?.email}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Customer Name:</span>
              <span className="font-bold text-gray-900">{transaction.customerName}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-500">Customer Email:</span>
              <span>{transaction.customerEmail}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments, screenshots & per-payment verification */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
        <h3 className="font-bold text-sm text-gray-900">Payments &amp; Receipts</h3>
        <PaymentsTable
          payments={summary.payments}
          currency={transaction.currency}
          renderActions={(p) => (
            <>
              {p.status !== "VERIFIED" && p.status !== "REJECTED" && (
                <Button size="sm" onClick={() => reviewPayment(p.id, "VERIFY")} isLoading={reviewingId === p.id} disabled={reviewingId !== null} className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
                  Verify
                </Button>
              )}
              {p.status !== "REJECTED" && (
                <Button size="sm" variant="outline" onClick={() => reviewPayment(p.id, "REJECT")} disabled={reviewingId !== null} className="h-7 text-xs text-rose-600 border-rose-200 hover:bg-rose-50">
                  Reject
                </Button>
              )}
            </>
          )}
        />
      </div>

      {/* Admin Status & Audit Notes Editor */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-2">
          Administrative Controls
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-700">Payment Status</Label>
            <select
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="PENDING">Pending</option>
              <option value="EVIDENCE_SUBMITTED">Evidence Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="VERIFIED">Verified</option>
              <option value="REJECTED">Rejected</option>
              <option value="COMPLETED">Completed</option>
              <option value="REFUNDED">Refunded</option>
              <option value="DISPUTED">Disputed</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700">Delivery Status</Label>
            <select
              value={deliveryStatus}
              onChange={(e) => setDeliveryStatus(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700">Administrative Audit Notes</Label>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Audit notes or reasons for approval/rejection visible to partner..."
            rows={3}
            className="mt-1 text-xs"
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            size="sm"
            onClick={() => handleUpdate()}
            isLoading={loading}
            className="gap-1.5 font-bold"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Status &amp; Notes</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
