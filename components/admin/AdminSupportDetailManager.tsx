// components/admin/AdminSupportDetailManager.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  ArrowLeft,
  Save,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/format";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  createdAt: string | Date;
}

interface AdminSupportDetailManagerProps {
  ticket: any;
  currentUserId?: string;
}

export function AdminSupportDetailManager({ ticket }: AdminSupportDetailManagerProps) {
  const router = useRouter();
  const toast = useToast();

  const [status, setStatus] = React.useState(ticket.status || "OPEN");
  const [adminNotes, setAdminNotes] = React.useState(ticket.adminNotes || "");
  const [messages, setMessages] = React.useState<Message[]>(ticket.messages || []);
  const [replyText, setReplyText] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [replyLoading, setReplyLoading] = React.useState(false);

  const handleUpdateStatus = async () => {
    setLoading(true);

    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          adminNotes: adminNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update ticket");

      toast.success("Ticket updated successfully!");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyLoading(true);

    try {
      const res = await fetch(`/api/partner/support/${ticket.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post message");

      setMessages((prev: Message[]) => [...prev, data.message]);
      setReplyText("");
      setStatus("WAITING_CUSTOMER");
      toast.success("Reply sent to ticket thread.");
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send message");
    } finally {
      setReplyLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/support"
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-indigo-600">
                {ticket.ticketNumber}
              </span>
              <h1 className="text-xl font-bold text-gray-950">{ticket.subject}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  status === "RESOLVED" || status === "CLOSED"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Requester: <strong>{ticket.requester?.name || "User"}</strong> ({ticket.requester?.email}) • Role: <strong>{ticket.requesterRole}</strong>
            </p>
          </div>
        </div>

        {status !== "RESOLVED" && (
          <Button
            size="sm"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              try {
                const res = await fetch(`/api/admin/support/${ticket.id}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ status: "RESOLVED" }),
                });
                const data = await res.json().catch(() => ({}));
                if (!res.ok) {
                  toast.error(data.error || "Failed to mark ticket as resolved.");
                  return;
                }
                setStatus("RESOLVED");
                toast.success("Support ticket marked as resolved.");
                router.refresh();
              } catch {
                toast.error("Network error. Please try again.");
              } finally {
                setLoading(false);
              }
            }}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs gap-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark Resolved</span>
          </Button>
        )}
      </div>

      {/* Messages Thread */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-2">
          Communication Thread ({messages.length} messages)
        </h2>

        <div className="space-y-4 pt-2">
          {messages.map((msg: Message) => {
            const isSenderAdmin = msg.senderRole === "admin";

            return (
              <div
                key={msg.id}
                className={`p-4 rounded-xl border text-xs space-y-1.5 ${
                  isSenderAdmin
                    ? "bg-indigo-50/50 border-indigo-200 ml-6"
                    : "bg-gray-50 border-gray-200 mr-6"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">
                      {msg.senderName} {isSenderAdmin ? "(Admin)" : ""}
                    </span>
                    <span className="text-[10px] text-gray-400 capitalize bg-white px-2 py-0.5 rounded border border-gray-200">
                      {msg.senderRole}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">
                    {formatDate(msg.createdAt)}
                  </span>
                </div>
                <p className="text-gray-800 leading-relaxed whitespace-pre-line pl-1">
                  {msg.message}
                </p>
              </div>
            );
          })}
        </div>

        {/* Admin Reply Box */}
        <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => handleSendReply(e)} className="pt-4 border-t border-gray-100 space-y-3">
          <Label className="text-xs font-semibold text-gray-700">Reply as Administrator</Label>
          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write official response to customer or partner..."
            rows={3}
            required
            className="text-xs"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              size="sm"
              isLoading={replyLoading}
              className="gap-1.5 font-bold text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Admin Response</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Admin Controls */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-gray-950 border-b border-gray-100 pb-2">
          Ticket Management Controls
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs font-semibold text-gray-700">Status</Label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 px-3 mt-1 rounded-xl bg-white border border-gray-200 text-xs font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="OPEN">Open (Awaiting triage)</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_CUSTOMER">Waiting Customer Response</option>
              <option value="WAITING_ADMIN">Waiting Administrator Action</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div>
            <Label className="text-xs font-semibold text-gray-700">Category</Label>
            <Input value={ticket.category} disabled className="mt-1 text-xs bg-gray-50" />
          </div>
        </div>

        <div>
          <Label className="text-xs font-semibold text-gray-700">Internal Admin Notes</Label>
          <Textarea
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            placeholder="Confidential notes visible only to platform admins..."
            rows={2}
            className="mt-1 text-xs"
          />
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            onClick={handleUpdateStatus}
            isLoading={loading}
            className="gap-1.5 font-bold"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Ticket Settings</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
