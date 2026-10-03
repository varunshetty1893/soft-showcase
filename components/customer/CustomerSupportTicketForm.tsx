// components/customer/CustomerSupportTicketForm.tsx
// Support ticket form for customers — categories are customer-facing topics:
// order issues, custom build queries, billing, and technical help.
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, HelpCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";

const CUSTOMER_CATEGORIES = [
  { value: "Custom Build Query", label: "Custom Build / Project Request Query" },
  { value: "Order & Payment", label: "Order & Payment Issue" },
  { value: "Project Delivery", label: "Project Delivery & Handover" },
  { value: "Refund Request", label: "Refund or Dispute Request" },
  { value: "Technical Help", label: "Technical Help with Delivered Project" },
  { value: "Account & Profile", label: "Account & Profile Settings" },
  { value: "Other", label: "Other Inquiry" },
] as const;

export function CustomerSupportTicketForm({
  returnUrl = "/my-support",
}: {
  returnUrl?: string;
}) {
  const router = useRouter();
  const toast = useToast();

  const [subject, setSubject] = React.useState("");
  const [category, setCategory] = React.useState<string>("Custom Build Query");
  const [priority, setPriority] = React.useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [description, setDescription] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/customer/support", {
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

      toast.success("Support ticket submitted. Our team will respond shortly.");
      router.push(
        `${returnUrl}/${data.ticket.id}?success=${encodeURIComponent(
          "Support ticket created successfully."
        )}`
      );
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
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4]">
        <HelpCircle className="w-4 h-4 text-[#155761] mt-0.5 shrink-0" />
        <p className="text-xs text-[#526267] leading-relaxed">
          Use this form to contact platform support for help with your custom build request, order
          disputes, payment issues, or delivery queries. Our team typically responds within 24 hours.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white rounded-3xl border border-[#D9E2E4] p-6 sm:p-8 shadow-xs space-y-5">
        {/* Subject */}
        <div>
          <Label className="text-xs font-semibold text-[#102124]">Subject *</Label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Question about my custom dashboard build timeline"
            required
            maxLength={200}
            className="mt-1"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Category</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761] cursor-pointer"
            >
              {CUSTOMER_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div>
            <Label className="text-xs font-semibold text-[#102124]">Priority</Label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as "LOW" | "MEDIUM" | "HIGH" | "URGENT")}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-[#D9E2E4] text-xs font-medium text-[#102124] focus:outline-none focus:ring-2 focus:ring-[#155761] cursor-pointer"
            >
              <option value="LOW">Low — General inquiry</option>
              <option value="MEDIUM">Medium — Needs attention soon</option>
              <option value="HIGH">High — Blocking my project</option>
              <option value="URGENT">Urgent — Critical issue</option>
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <Label className="text-xs font-semibold text-[#102124]">
            Description *
          </Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe your issue or question in detail. Include any order reference numbers, project names, or screenshots if relevant."
            rows={6}
            required
            minLength={20}
            maxLength={5000}
            className="mt-1 resize-none"
          />
          <p className="text-[10px] text-[#526267] mt-1 text-right">
            {description.length}/5000 characters
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <Link
          href={returnUrl}
          className={buttonVariants({
            variant: "outline",
            size: "sm",
            className: "text-xs",
          })}
        >
          Cancel
        </Link>
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={loading || !subject.trim() || !description.trim()}
          className="font-bold shadow-xs"
        >
          {loading ? "Submitting…" : "Open Support Ticket"}
        </Button>
      </div>
    </form>
  );
}
