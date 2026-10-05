// components/inquiry/InquiryModal.tsx
// Modal wrapper for submitting project inquiries.
// Source of truth: docs/25-inquiry-system.md & docs/12-component-architecture.md

"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X, Mail } from "lucide-react";
import { InquiryForm } from "./InquiryForm";

interface InquiryModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  initialContact?: {
    name?: string;
    email?: string;
    whatsapp?: string;
  };
}

export function InquiryModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  initialContact,
}: InquiryModalProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key press
  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dialog card */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-dialog-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl border border-[#D9E2E4] p-6 sm:p-8 z-10 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#F3F7F7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F3F7F7] border border-[#D9E2E4] text-[#155761] flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 id="inquiry-dialog-title" className="text-lg font-bold text-[#102124] leading-snug">
                Send Project Inquiry
              </h2>
              <p className="text-xs text-[#526267] line-clamp-1">{projectTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="text-[#526267] hover:text-[#102124] hover:bg-[#F3F7F7] p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5">
          <InquiryForm
            projectId={projectId}
            projectTitle={projectTitle}
            onCancel={onClose}
            initialContact={initialContact}
          />
        </div>
      </div>
    </div>,
    document.body
  );
}
