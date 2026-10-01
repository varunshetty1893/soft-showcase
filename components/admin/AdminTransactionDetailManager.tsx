// components/admin/AdminTransactionDetailManager.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowLeft,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/utils/format";

interface AdminTransactionDetailManagerProps {
  transaction: any;
}

export function AdminTransactionDetailManager({ transaction }: AdminTransactionDetailManagerProps) {
  const router = useRouter();

  const [paymentStatus, setPaymentStatus] = React.useState(transaction.paymentStatus || "PENDING");
  const [deliveryStatus, setDeliveryStatus] = React.useState(transaction.deliveryStatus || "PENDING");
  const [adminNotes, setAdminNotes] = React.useState(transaction.adminNotes || "");
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleUpdate = async (newStatus?: string) => {
    setError(null);
    setSuccess(false);
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
      setSuccess(true);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
              UTR: {transaction.utrNumber} • Created {formatDate(transaction.createdAt)}
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2">
          {paymentStatus !== "VERIFIED" && (
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

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          Transaction updated successfully!
        </div>
      )}

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <h2 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-2">
            Payment &amp; Financials
          </h2>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Amount:</span>
              <strong className="text-sm font-extrabold text-indigo-700">
                {formatCurrency(Number(transaction.amount))}
              </strong>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-semibold">{transaction.paymentMethod}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-50">
              <span className="text-gray-500">UTR / Ref Number:</span>
              <span className="font-mono font-bold text-gray-900">{transaction.utrNumber}</span>
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

      {/* Payment Evidence Screenshot Card */}
      {transaction.paymentEvidenceUrl && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">Payment Evidence Screenshot</h3>
            <a
              href={transaction.paymentEvidenceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1"
            >
              <span>Open raw image</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50 p-4 flex items-center justify-center">
            <div className="relative w-full h-80">
              <Image
                src={transaction.paymentEvidenceUrl}
                alt="Payment Proof"
                fill
                sizes="(max-width: 768px) 100vw, 800px"
                className="object-contain rounded-lg"
                referrerPolicy="no-referrer"
                unoptimized={transaction.paymentEvidenceUrl.startsWith("data:")}
              />
            </div>
          </div>
        </div>
      )}

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
