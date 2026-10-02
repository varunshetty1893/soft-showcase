// components/ui/toast/types.ts
// Shared types and timing constants for the Admin & Partner Toast system (Phase 1).

export type ToastVariant = "success" | "info" | "warning" | "error";

export interface ToastInput {
  id?: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  /**
   * Auto-dismiss duration in milliseconds.
   * null or 0 means the toast stays until manually dismissed.
   */
  duration?: number | null;
}

export interface ToastRecord {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  duration: number | null;
  createdAt: number;
  paused: boolean;
  remainingMs: number | null;
  lastResumedAt: number;
}

export const MAX_VISIBLE_TOASTS = 3;

export const TOAST_DURATIONS: Record<ToastVariant, number | null> = {
  success: 4000,
  info: 5000,
  warning: 8000,
  error: null, // Error stays until dismissed (or 12000ms if specified)
};

export const ERROR_FALLBACK_DURATION_MS = 12000;

export function getDefaultToastDuration(variant: ToastVariant): number | null {
  return TOAST_DURATIONS[variant];
}

export function normalizeDedupeKey(variant: ToastVariant, message: string, title?: string): string {
  return `${variant}::${(title || "").trim().toLowerCase()}::${message.trim().toLowerCase()}`;
}

/**
 * Pure helper used by ToastProvider and unit tests to insert/deduplicate a toast,
 * keeping newest on top and capping visible list at MAX_VISIBLE_TOASTS.
 */
export function upsertToastList(
  existing: ToastRecord[],
  input: ToastInput,
  now: number = Date.now()
): ToastRecord[] {
  const variant: ToastVariant = input.variant || "info";
  const duration =
    input.duration !== undefined ? input.duration : getDefaultToastDuration(variant);
  const key = normalizeDedupeKey(variant, input.message, input.title);

  const duplicateIndex = existing.findIndex(
    (t) => normalizeDedupeKey(t.variant, t.message, t.title) === key
  );

  const nextRecord: ToastRecord = {
    id:
      duplicateIndex !== -1
        ? existing[duplicateIndex].id
        : input.id || `toast-${now}-${Math.random().toString(36).slice(2, 8)}`,
    variant,
    title: input.title,
    message: input.message.trim(),
    duration,
    createdAt: now,
    paused: false,
    remainingMs: duration,
    lastResumedAt: now,
  };

  const withoutDuplicate =
    duplicateIndex !== -1
      ? existing.filter((_, idx) => idx !== duplicateIndex)
      : existing;

  // Newest on top, max 3 visible
  return [nextRecord, ...withoutDuplicate].slice(0, MAX_VISIBLE_TOASTS);
}

export const FEEDBACK_QUERY_PARAMS = [
  "success",
  "error",
  "warning",
  "info",
  "message",
  "toast",
] as const;

export interface ParsedUrlFeedback {
  toast: ToastInput | null;
  cleanSearch: string;
}

/**
 * Extracts feedback query params (?success=, ?error=, ?warning=, ?info=, ?message=)
 * and returns both the toast to trigger and the cleaned query string with feedback params removed.
 */
export function extractUrlFeedback(searchParamsString: string): ParsedUrlFeedback {
  const raw = searchParamsString.startsWith("?")
    ? searchParamsString.slice(1)
    : searchParamsString;
  const params = new URLSearchParams(raw);

  let foundToast: ToastInput | null = null;

  if (params.get("error")) {
    foundToast = {
      variant: "error",
      message: params.get("error")!,
    };
  } else if (params.get("warning")) {
    foundToast = {
      variant: "warning",
      message: params.get("warning")!,
    };
  } else if (params.get("success")) {
    foundToast = {
      variant: "success",
      message: params.get("success")!,
    };
  } else if (params.get("info")) {
    foundToast = {
      variant: "info",
      message: params.get("info")!,
    };
  } else if (params.get("message") || params.get("toast")) {
    const msg = (params.get("message") || params.get("toast"))!;
    const typeParam = params.get("type") || params.get("variant");
    const variant: ToastVariant =
      typeParam === "error" || typeParam === "warning" || typeParam === "success" || typeParam === "info"
        ? typeParam
        : "info";
    foundToast = {
      variant,
      message: msg,
    };
  }

  for (const key of FEEDBACK_QUERY_PARAMS) {
    params.delete(key);
  }
  if (foundToast) {
    params.delete("type");
    params.delete("variant");
  }

  const cleanStr = params.toString();
  return {
    toast: foundToast && foundToast.message.trim() ? foundToast : null,
    cleanSearch: cleanStr ? `?${cleanStr}` : "",
  };
}
