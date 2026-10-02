// components/ui/toast/ToastViewport.tsx
"use client";

import * as React from "react";
import { ToastItem } from "./ToastItem";
import { MAX_VISIBLE_TOASTS, type ToastRecord } from "./types";

interface ToastViewportProps {
  toasts: ToastRecord[];
  onDismiss: (id: string) => void;
  onPauseChange?: (id: string, paused: boolean) => void;
}

export function ToastViewport({
  toasts,
  onDismiss,
  onPauseChange,
}: ToastViewportProps) {
  const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS);

  if (visibleToasts.length === 0) return null;

  return (
    <div
      aria-label="Notifications"
      data-testid="toast-viewport"
      className="fixed top-4 right-4 z-50 flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0"
    >
      {visibleToasts.map((t) => (
        <ToastItem
          key={t.id}
          toast={t}
          onDismiss={onDismiss}
          onPauseChange={onPauseChange}
        />
      ))}
    </div>
  );
}
