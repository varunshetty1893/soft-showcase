// components/transactions/PaymentsTable.tsx
// Read-only list of a transaction's payments with screenshot + receipt links.
// Server-component safe (no hooks). `actions` lets the admin page inject per-row buttons.

import * as React from "react";
import { Download, ExternalLink } from "lucide-react";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/format";
import { paymentMethodLabel } from "@/lib/transactions/payments";
import type { PaymentView } from "@/lib/transactions/summary";

const STATUS_STYLE: Record<string, string> = {
  VERIFIED: "bg-[#DDF4EC] text-[#2F7D78] border border-[#2F7D78]/30",
  REJECTED: "bg-rose-100 text-rose-800",
  PENDING_REVIEW: "bg-amber-100 text-amber-900 border border-amber-300",
};
const STATUS_LABEL: Record<string, string> = {
  VERIFIED: "Verified",
  REJECTED: "Rejected",
  PENDING_REVIEW: "Awaiting verification",
};

export function PaymentsTable({
  payments,
  currency,
  renderActions,
}: {
  payments: PaymentView[];
  currency: string;
  renderActions?: (p: PaymentView) => React.ReactNode;
}) {
  if (payments.length === 0) {
    return <p className="text-xs text-[#526267]">No payments recorded.</p>;
  }
  return (
    <div className="space-y-3">
      {payments.map((p) => (
        <div key={p.id} className="rounded-2xl border border-[#D9E2E4] p-4 flex flex-col sm:flex-row gap-4">
          {p.evidenceUrl ? (
            <a href={p.evidenceUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 block w-full sm:w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.evidenceUrl} alt={`Payment ${p.sequence} screenshot`} className="w-full h-28 object-contain rounded-xl border border-[#D9E2E4] bg-[#F8FAFA]" referrerPolicy="no-referrer" />
            </a>
          ) : (
            <div className="shrink-0 w-full sm:w-28 h-28 rounded-xl border border-dashed border-[#D9E2E4] bg-[#F8FAFA] flex items-center justify-center text-[10px] text-[#526267] text-center px-2">
              No screenshot
            </div>
          )}
          <div className="flex-1 text-xs space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-sm text-[#102124]">
                Payment {p.sequence}: {formatMoney(p.amount, currency)}
              </strong>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_STYLE[p.status] ?? ""}`}>
                {STATUS_LABEL[p.status] ?? p.status}
              </span>
            </div>
            <p className="text-[#526267]">
              {paymentMethodLabel(p.paymentMethod)} • {formatDate(p.paidAt)}
            </p>
            <p className="font-mono text-[#102124]">
              {p.paymentMethod === "CASH" ? "Cash payment (no UTR)" : `UTR: ${p.utrNumber ?? "—"}`}
            </p>
            {p.rejectionReason && <p className="text-rose-700">Reason: {p.rejectionReason}</p>}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              {p.evidenceUrl && (
                <a href={p.evidenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[#155761] font-semibold hover:underline">
                  <ExternalLink className="w-3 h-3" /> Open screenshot
                </a>
              )}
              {p.status === "VERIFIED" && p.receiptNumber && (
                <a href={`/receipts/${p.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#155761] text-white font-semibold hover:bg-[#0f434b]">
                  <Download className="w-3 h-3" /> {p.isFinalReceipt ? "Final receipt (Paid in Full)" : `Receipt ${p.receiptNumber}`}
                </a>
              )}
              {renderActions?.(p)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
