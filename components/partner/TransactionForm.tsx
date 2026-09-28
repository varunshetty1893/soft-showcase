// components/partner/TransactionForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Receipt, AlertCircle, ArrowLeft, Upload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface SolutionOption {
  id: string;
  title: string;
}

interface TransactionFormProps {
  solutions: SolutionOption[];
}

export function TransactionForm({ solutions }: TransactionFormProps) {
  const router = useRouter();

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
  >("IN_PROGRESS");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

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

      router.push("/partner/transactions");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
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
      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
          3. Payment Amount &amp; UTR Evidence
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Label className="text-xs font-semibold text-[#102124]">Amount Received *</Label>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Payment Mode</Label>
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
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">UTR / Bank Ref Number *</Label>
            <Input
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              placeholder="e.g. 412389102931"
              required
              className="mt-1 font-mono text-xs"
            />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Payment Evidence Screenshot / Receipt URL</Label>
          <Input
            type="url"
            value={paymentEvidenceUrl}
            onChange={(e) => setPaymentEvidenceUrl(e.target.value)}
            placeholder="https://drive.google.com/... or https://res.cloudinary.com/..."
            className="mt-1 text-xs"
          />
          <p className="text-[11px] text-[#526267] mt-1">
            Provide a direct public link to the bank receipt, UPI screenshot, or proof of payment for platform administrative audit.
          </p>
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Delivery Status</Label>
          <select
            value={deliveryStatus}
            onChange={(e) => setDeliveryStatus(e.target.value as any)}
            className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
          >
            <option value="IN_PROGRESS">In Progress (Code Handover underway)</option>
            <option value="DELIVERED">Delivered (Code Handed Over)</option>
            <option value="COMPLETED">Completed (Sign-off Finished)</option>
            <option value="PENDING">Pending (Awaiting Kickoff)</option>
          </select>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href="/partner/transactions">
          <Button variant="outline" size="md">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={loading}
          className="font-bold shadow-md"
        >
          Submit Transaction Record
        </Button>
      </div>
    </form>
  );
}
