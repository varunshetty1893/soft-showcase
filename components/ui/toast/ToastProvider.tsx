// components/ui/toast/ToastProvider.tsx
"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ToastViewport } from "./ToastViewport";
import {
  extractUrlFeedback,
  upsertToastList,
  type ToastInput,
  type ToastRecord,
} from "./types";

export interface ToastContextValue {
  toasts: ToastRecord[];
  toast: (input: ToastInput) => string;
  success: (message: string, title?: string, duration?: number | null) => string;
  error: (message: string, title?: string, duration?: number | null) => string;
  warning: (message: string, title?: string, duration?: number | null) => string;
  info: (message: string, title?: string, duration?: number | null) => string;
  dismiss: (id: string) => void;
  clearAll: () => void;
}

export const ToastContext = React.createContext<ToastContextValue | null>(null);

function ToastUrlListener({
  onTrigger,
}: {
  onTrigger: (input: ToastInput) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastProcessedRef = React.useRef<string>("");

  React.useEffect(() => {
    if (!searchParams) return;
    const rawQuery = searchParams.toString();
    if (!rawQuery || rawQuery === lastProcessedRef.current) return;

    const { toast, cleanSearch } = extractUrlFeedback(rawQuery);
    if (toast) {
      lastProcessedRef.current = rawQuery;
      onTrigger(toast);
      const nextUrl = `${pathname}${cleanSearch}`;
      router.replace(nextUrl, { scroll: false });
    }
  }, [pathname, router, searchParams, onTrigger]);

  return null;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const parentContext = React.useContext(ToastContext);
  const [toasts, setToasts] = React.useState<ToastRecord[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setToasts([]);
  }, []);

  const handlePauseChange = React.useCallback((id: string, paused: boolean) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id && t.paused !== paused ? { ...t, paused } : t))
    );
  }, []);

  const addToast = React.useCallback((input: ToastInput): string => {
    if (!input.message || !input.message.trim()) return "";
    const now = Date.now();
    const generatedId =
      input.id || `toast-${now}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => upsertToastList(prev, { ...input, id: generatedId }, now));
    return generatedId;
  }, []);

  const success = React.useCallback(
    (message: string, title?: string, duration?: number | null) =>
      addToast({ variant: "success", message, title, duration }),
    [addToast]
  );

  const error = React.useCallback(
    (message: string, title?: string, duration?: number | null) =>
      addToast({ variant: "error", message, title, duration }),
    [addToast]
  );

  const warning = React.useCallback(
    (message: string, title?: string, duration?: number | null) =>
      addToast({ variant: "warning", message, title, duration }),
    [addToast]
  );

  const info = React.useCallback(
    (message: string, title?: string, duration?: number | null) =>
      addToast({ variant: "info", message, title, duration }),
    [addToast]
  );

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toasts,
      toast: addToast,
      success,
      error,
      warning,
      info,
      dismiss,
      clearAll,
    }),
    [toasts, addToast, success, error, warning, info, dismiss, clearAll]
  );

  if (parentContext) {
    return <>{children}</>;
  }

  return (
    <ToastContext.Provider value={value}>
      <React.Suspense fallback={null}>
        <ToastUrlListener onTrigger={addToast} />
      </React.Suspense>
      {children}
      <ToastViewport
        toasts={toasts}
        onDismiss={dismiss}
        onPauseChange={handlePauseChange}
      />
    </ToastContext.Provider>
  );
}
