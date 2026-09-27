// components/inquiry/WhatsAppButton.tsx
// Client-side button to request and open provider WhatsApp conversation.
// Source of truth: docs/20-whatsapp-architecture.md

"use client";

import * as React from "react";
import { MessageSquare, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  projectSlug: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function WhatsAppButton({
  projectSlug,
  className = "w-full",
  size = "lg",
}: WhatsAppButtonProps) {
  const [loading, setLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectSlug)}/whatsapp`);
      const data = await res.json();

      if (!res.ok || !data.success) {
        if (res.status === 429) {
          setErrorMessage("Too many requests. Please wait a few minutes.");
        } else {
          setErrorMessage(data.error || "Unable to open WhatsApp. Please try again.");
        }
        return;
      }

      if (data.data?.url) {
        window.open(data.data.url, "_blank", "noopener,noreferrer");
      }
    } catch (err) {
      console.error("WhatsApp button error:", err);
      setErrorMessage("Network error. Please try again or use the email form.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full space-y-1.5">
      <Button
        type="button"
        variant="whatsapp"
        size={size}
        isLoading={loading}
        onClick={handleClick}
        className={className}
        disabled={loading}
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        {loading ? "Connecting to WhatsApp..." : "Discuss on WhatsApp"}
      </Button>

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
