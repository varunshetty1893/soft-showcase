// app/receipts/[paymentId]/page.tsx
// Printable payment receipt. Use the browser's "Save as PDF" from the print dialog.
// Access: the customer who paid, the issuing partner, or an admin.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isAdminUser } from "@/lib/auth/admin";
import { resolvePartnerForUser } from "@/lib/auth/partner-auth";
import { getPaymentForReceipt } from "@/lib/db/queries/transaction-payments";
import { buildReceipts, paymentMethodLabel } from "@/lib/transactions/payments";
import { formatMoney } from "@/lib/utils/money";
import { formatDate } from "@/lib/utils/format";
import { APP_NAME } from "@/config/constants";
import { PrintButton } from "@/components/receipts/PrintButton";

export const metadata: Metadata = {
  title: `Payment Receipt — ${APP_NAME}`,
  robots: { index: false, follow: false },
};

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ paymentId: string }>;
}) {
  const { paymentId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/receipts/${paymentId}`)}`);
  }

  const payment = await getPaymentForReceipt(paymentId);
  if (!payment || payment.status !== "VERIFIED") notFound();
  const tx = payment.transaction;

  const email = (session.user.email || "").toLowerCase();
  const isAdmin = Boolean(isAdminUser(session.user));
  const isCustomer =
    tx.customerId === session.user.id || (email !== "" && tx.customerEmail.toLowerCase() === email);
  let isIssuer = false;
  if (!isAdmin && !isCustomer) {
    const partner = await resolvePartnerForUser(session.user).catch(() => null);
    isIssuer = Boolean(partner && partner.id === tx.partnerId);
  }
  if (!isAdmin && !isCustomer && !isIssuer) notFound();

  const agreed = tx.agreedAmount ?? tx.amount;
  const receipts = buildReceipts(tx.transactionNumber, tx.payments as any[], agreed);
  const receipt = receipts.find((r) => r.paymentId === payment.id);
  if (!receipt) notFound();

  const currency = payment.currency || tx.currency || "INR";
  const backHref = isAdmin ? `/admin/transactions/${tx.id}` : isIssuer ? `/partner/transactions/${tx.id}` : "/my-transactions";

  const row = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-6 py-2 border-b border-[#EEF3F3] text-sm">
      <span className="text-[#526267]">{label}</span>
      <span className="font-semibold text-[#102124] text-right break-all">{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F3F7F7] py-8 px-4 print:bg-white print:py-0 print:px-0">
      <div className="mx-auto max-w-2xl mb-4 flex items-center justify-between print:hidden">
        <Link href={backHref} className="text-xs font-semibold text-[#155761] hover:underline">
          ← Back
        </Link>
        <PrintButton />
      </div>

      <div className="mx-auto max-w-2xl bg-white rounded-2xl border border-[#D9E2E4] shadow-sm p-8 sm:p-10 print:shadow-none print:border-0 print:rounded-none">
        <div className="flex items-start justify-between gap-4 pb-6 border-b-2 border-[#155761]">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt={APP_NAME} className="h-12 w-auto object-contain" />
            <div>
              <p className="text-lg font-extrabold text-[#102124] leading-tight">{APP_NAME}</p>
              <p className="text-[11px] text-[#526267]">Software marketplace</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-extrabold text-[#155761] uppercase tracking-wide">
              {receipt.isFinal ? "Paid in Full" : "Payment Receipt"}
            </p>
            <p className="text-xs font-mono text-[#526267] mt-1">{receipt.receiptNumber}</p>
          </div>
        </div>

        <div className="py-6 grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#526267] mb-1">Received from</p>
            <p className="font-bold text-[#102124]">{tx.customerName}</p>
            <p className="text-[#526267] text-xs">{tx.customerEmail}</p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#526267] mb-1">Issued by (partner)</p>
            <p className="font-bold text-[#102124]">{tx.partner?.displayName ?? "Solution Partner"}</p>
            <p className="text-[#526267] text-xs">via {APP_NAME}</p>
          </div>
        </div>

        <div className="rounded-xl bg-[#F3F7F7] px-5 py-4 mb-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#526267]">Amount received</p>
          <p className="text-3xl font-extrabold text-[#155761] mt-1">
            {formatMoney(Number(payment.amount.toString()), currency)}
          </p>
        </div>

        <div>
          {row("Order / Transaction", <span className="font-mono">{tx.transactionNumber}</span>)}
          {row("Solution", tx.solution?.title ?? tx.projectType.replace(/_/g, " "))}
          {row("Payment", `${receipt.sequence} of ${(tx.payments as any[]).filter((p) => p.status !== "REJECTED").length}`)}
          {row("Payment mode", paymentMethodLabel(payment.paymentMethod))}
          {payment.utrNumber && row("UTR / Reference", <span className="font-mono">{payment.utrNumber}</span>)}
          {row("Payment date", formatDate(payment.paidAt))}
          {payment.verifiedAt && row("Verified on", formatDate(payment.verifiedAt))}
        </div>

        <div className="mt-6 rounded-xl border border-[#D9E2E4] p-5 text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-[#526267]">Total deal amount</span>
            <strong>{formatMoney(Number(agreed.toString()), currency)}</strong>
          </div>
          <div className="flex justify-between">
            <span className="text-[#526267]">Total paid (verified)</span>
            <strong className="text-[#155761]">{formatMoney(receipt.paidTotalAfter, currency)}</strong>
          </div>
          <div className="flex justify-between border-t border-[#D9E2E4] pt-2">
            <span className="text-[#526267]">Balance</span>
            <strong className={receipt.balanceAfter > 0 ? "text-amber-700" : "text-emerald-700"}>
              {receipt.balanceAfter > 0 ? formatMoney(receipt.balanceAfter, currency) : "Nil — Paid in Full"}
            </strong>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-[#EEF3F3] text-[11px] text-[#526267] flex flex-col sm:flex-row justify-between gap-2">
          <span>GST No: —</span>
          <span>This is a computer-generated receipt and does not require a signature.</span>
        </div>
      </div>
    </div>
  );
}
