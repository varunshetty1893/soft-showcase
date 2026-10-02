// components/ui/toast/ToastItem.tsx
"use client";

import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  X,
} from "lucide-react";
import type { ToastRecord, ToastVariant } from "./types";

interface ToastItemProps {
  toast: ToastRecord;
  onDismiss: (id: string) => void;
  onPauseChange?: (id: string, paused: boolean) => void;
}

const VARIANT_STYLES: Record<
  ToastVariant,
  {
    container: string;
    icon: React.ReactNode;
    closeBtn: string;
  }
> = {
  success: {
    container:
      "bg-emerald-50/95 border-emerald-200 text-emerald-900 shadow-lg shadow-emerald-950/5",
    icon: <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />,
    closeBtn: "text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-500",
  },
  info: {
    container:
      "bg-[#F3F7F7]/95 border-[#BEDEE1] text-[#102124] shadow-lg shadow-slate-950/5",
    icon: <Info className="w-4 h-4 text-[#155761] shrink-0 mt-0.5" />,
    closeBtn: "text-[#155761] hover:bg-[#E5EEEE] focus:ring-[#155761]",
  },
  warning: {
    container:
      "bg-amber-50/95 border-amber-200 text-amber-950 shadow-lg shadow-amber-950/5",
    icon: <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />,
    closeBtn: "text-amber-800 hover:bg-amber-100 focus:ring-amber-500",
  },
  error: {
    container:
      "bg-rose-50/95 border-rose-200 text-rose-900 shadow-lg shadow-rose-950/5",
    icon: <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />,
    closeBtn: "text-rose-700 hover:bg-rose-100 focus:ring-rose-500",
  },
};

export function ToastItem({ toast, onDismiss, onPauseChange }: ToastItemProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);
  const isPaused = isHovered || isFocused;

  const remainingRef = React.useRef<number | null>(toast.duration);
  const startedAtRef = React.useRef<number>(Date.now());
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset remaining time if the toast was deduplicated/refreshed
  React.useEffect(() => {
    remainingRef.current = toast.duration;
    startedAtRef.current = Date.now();
  }, [toast.createdAt, toast.duration]);

  React.useEffect(() => {
    onPauseChange?.(toast.id, isPaused);
  }, [isPaused, onPauseChange, toast.id]);

  React.useEffect(() => {
    if (toast.duration === null || toast.duration <= 0) {
      return;
    }

    if (isPaused) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      const elapsed = Date.now() - startedAtRef.current;
      if (remainingRef.current !== null) {
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
      }
      return;
    }

    const delay = remainingRef.current ?? toast.duration;
    if (delay <= 0) {
      onDismiss(toast.id);
      return;
    }

    startedAtRef.current = Date.now();
    timerRef.current = setTimeout(() => {
      onDismiss(toast.id);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPaused, toast.duration, toast.id, toast.createdAt, onDismiss]);

  const style = VARIANT_STYLES[toast.variant];
  const isError = toast.variant === "error";

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      aria-atomic="true"
      data-testid={`toast-item-${toast.variant}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setIsFocused(false);
        }
      }}
      className={`pointer-events-auto w-full max-w-sm rounded-2xl border p-4 backdrop-blur-md transition-all duration-200 motion-reduce:transition-none motion-reduce:animate-none ${style.container}`}
    >
      <div className="flex items-start gap-3">
        {style.icon}
        <div className="flex-1 min-w-0 text-xs leading-relaxed">
          {toast.title && (
            <p className="font-bold mb-0.5 truncate">{toast.title}</p>
          )}
          <p className="font-medium break-words">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={() => onDismiss(toast.id)}
          aria-label="Close notification"
          className={`p-1 rounded-lg transition-colors motion-reduce:transition-none focus:outline-none focus:ring-2 cursor-pointer shrink-0 ${style.closeBtn}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
