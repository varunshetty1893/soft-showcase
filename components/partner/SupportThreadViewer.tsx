// components/partner/SupportThreadViewer.tsx
"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send, User, Shield, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/format";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  attachmentUrl?: string | null;
  createdAt: string | Date;
}

interface SupportThreadViewerProps {
  ticketId: string;
  initialMessages: Message[];
  currentUserId: string;
  ticketStatus: string;
  isAdminView?: boolean;
}

export function SupportThreadViewer({
  ticketId,
  initialMessages,
  currentUserId,
  ticketStatus,
}: SupportThreadViewerProps) {
  const router = useRouter();
  const toast = useToast();
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [replyText, setReplyText] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const isClosed = ticketStatus === "CLOSED" || ticketStatus === "RESOLVED";

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const url = `/api/partner/support/${ticketId}/messages`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: replyText.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send message");

      setMessages((prev) => [...prev, data.message]);
      setReplyText("");
      toast.success("Reply sent.");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Messages Thread */}
      <div className="space-y-4">
        {messages.map((msg) => {
          const isSenderAdmin = msg.senderRole === "admin";
          const isMine = msg.senderId === currentUserId;

          return (
            <div
              key={msg.id}
              className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-2 ${
                isSenderAdmin
                  ? "bg-[#DDF4EC]/40 border-[#2F7D78]/25 ml-4 sm:ml-8"
                  : isMine
                  ? "bg-white border-[#D9E2E4] mr-4 sm:mr-8"
                  : "bg-[#F8FAFA] border-[#D9E2E4]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${
                      isSenderAdmin
                        ? "bg-[#2F7D78] text-white"
                        : "bg-[#155761] text-white"
                    }`}
                  >
                    {isSenderAdmin ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  </div>
                  <span className="font-bold text-[#102124]">
                    {msg.senderName} {isSenderAdmin ? "(Platform Administration)" : ""}
                  </span>
                </div>
                <span className="text-[10px] text-[#526267] font-mono">
                  {formatDate(msg.createdAt)}
                </span>
              </div>

              <p className="text-[#102124] leading-relaxed whitespace-pre-line pl-8">
                {msg.message}
              </p>
            </div>
          );
        })}
      </div>

      {/* Reply input */}
      {isClosed ? (
        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 text-center text-xs text-gray-500">
          This support ticket is resolved or closed. If you have an additional inquiry, please create a new ticket.
        </div>
      ) : (
        <form onSubmit={handleSendReply} className="space-y-3 bg-white rounded-3xl border border-[#D9E2E4] p-5 shadow-xs">
          {error && (
            <div className="text-xs text-rose-600 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          <Textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            rows={3}
            required
            className="text-xs"
          />

          <div className="flex items-center justify-end">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={loading}
              className="gap-1.5 font-bold shadow-xs text-xs"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Reply</span>
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
