// components/partner/SupportTicketForm.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Headphones, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function SupportTicketForm({ returnUrl = "/partner/support" }: { returnUrl?: string }) {
  const router = useRouter();

  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState("Listing Approval");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [description, setDescription] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/partner/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: subject.trim(),
          category: category.trim(),
          priority,
          description: description.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create support ticket");
      }

      router.push(`${returnUrl}/${data.ticket.id}`);
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

      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <Label className="text-xs font-semibold text-[#102124]">Subject *</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Question regarding payment settlement for OmniCart project"
            required
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="Listing Approval">Solution Listing Review</option>
              <option value="Payment Settlement">Payment Verification / Settlement</option>
              <option value="Customer Dispute">Customer Communication Issue</option>
              <option value="Account & Studio">Account &amp; Studio Settings</option>
              <option value="Technical Bug">Technical Platform Issue</option>
              <option value="Other">Other Inquiry</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-[#102124]">Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761]"
            >
              <option value="LOW">Low — General question</option>
              <option value="MEDIUM">Medium — Standard inquiry</option>
              <option value="HIGH">High — Urgent project concern</option>
              <option value="URGENT">Urgent — Transaction blockage</option>
            </select>
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-[#102124]">Detailed Description *</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please detail your request or question clearly..."
            rows={6}
            required
            className="mt-1 text-xs"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Link href={returnUrl}>
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
          Submit Support Ticket
        </Button>
      </div>
    </form>
  );
}
