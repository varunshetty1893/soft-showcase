// tests/unit/toast.test.ts
// Unit tests for Phase 1 — Auto-dismissing messages (toasts) for admin and partner:
// - Timing per variant (success 4s, info 5s, warning 8s, error stays until dismissed / 12s fallback)
// - Pause on hover / keyboard focus and resume with remaining time
// - Query param extraction and clean URL replacement after first render
// - Deduplication of identical messages and max 3 visible (newest on top)

import { describe, it, expect } from "vitest";
import {
  TOAST_DURATIONS,
  ERROR_FALLBACK_DURATION_MS,
  MAX_VISIBLE_TOASTS,
  getDefaultToastDuration,
  upsertToastList,
  pauseToastRecord,
  resumeToastRecord,
  extractUrlFeedback,
  type ToastRecord,
} from "@/components/ui/toast/types";

describe("Phase 1 — Shared Toast System", () => {
  describe("Variant timing", () => {
    it("configures exact auto-dismiss durations per variant", () => {
      expect(getDefaultToastDuration("success")).toBe(4000);
      expect(getDefaultToastDuration("info")).toBe(5000);
      expect(getDefaultToastDuration("warning")).toBe(8000);
      expect(getDefaultToastDuration("error")).toBeNull(); // Stays until dismissed
      expect(TOAST_DURATIONS).toEqual({
        success: 4000,
        info: 5000,
        warning: 8000,
        error: null,
      });
      expect(ERROR_FALLBACK_DURATION_MS).toBe(12000);
    });
  });

  describe("Pause on hover / focus", () => {
    it("pauses timer and preserves remaining time when hovered or focused, then resumes", () => {
      const start = 10000;
      const list = upsertToastList(
        [],
        { variant: "success", message: "Partner activated." },
        start
      );
      expect(list).toHaveLength(1);
      const initial = list[0];
      expect(initial.duration).toBe(4000);
      expect(initial.remainingMs).toBe(4000);
      expect(initial.paused).toBe(false);

      // Hover after 1500ms
      const paused = pauseToastRecord(initial, start + 1500);
      expect(paused.paused).toBe(true);
      expect(paused.remainingMs).toBe(2500);

      // Remain hovered for 10 seconds — remainingMs does not decrease while paused
      const stillPaused = pauseToastRecord(paused, start + 11500);
      expect(stillPaused.remainingMs).toBe(2500);

      // Mouse leave / blur at start + 11500
      const resumed = resumeToastRecord(stillPaused, start + 11500);
      expect(resumed.paused).toBe(false);
      expect(resumed.remainingMs).toBe(2500);
      expect(resumed.lastResumedAt).toBe(start + 11500);
    });
  });

  describe("Deduplication and max 3 visible (newest on top)", () => {
    it("deduplicates identical messages of the same variant and moves to top", () => {
      let list: ToastRecord[] = [];
      list = upsertToastList(
        list,
        { id: "t1", variant: "success", message: "Saved successfully" },
        1000
      );
      list = upsertToastList(
        list,
        { id: "t2", variant: "info", message: "Syncing catalog" },
        2000
      );
      // Trigger identical success message again
      list = upsertToastList(
        list,
        { id: "t3", variant: "success", message: "  saved successfully  " },
        3000
      );

      expect(list).toHaveLength(2);
      expect(list[0].id).toBe("t1"); // Reuses existing ID and moves to top
      expect(list[0].createdAt).toBe(3000);
      expect(list[1].id).toBe("t2");
    });

    it("caps visible toasts at MAX_VISIBLE_TOASTS (3) with newest on top", () => {
      let list: ToastRecord[] = [];
      list = upsertToastList(list, { id: "1", variant: "info", message: "One" }, 100);
      list = upsertToastList(list, { id: "2", variant: "info", message: "Two" }, 200);
      list = upsertToastList(list, { id: "3", variant: "info", message: "Three" }, 300);
      list = upsertToastList(list, { id: "4", variant: "success", message: "Four" }, 400);

      expect(MAX_VISIBLE_TOASTS).toBe(3);
      expect(list).toHaveLength(3);
      expect(list.map((t) => t.id)).toEqual(["4", "3", "2"]);
    });
  });

  describe("URL query param extraction & cleanup", () => {
    it("extracts ?success= param and strips it from the URL while preserving non-feedback params", () => {
      const parsed = extractUrlFeedback(
        "?page=2&success=Partner+%27Varun+Shetty%27+has+been+activated&tab=active"
      );
      expect(parsed.toast).toEqual({
        variant: "success",
        message: "Partner 'Varun Shetty' has been activated",
      });
      expect(parsed.cleanSearch).toBe("?page=2&tab=active");
    });

    it("extracts ?error= param and returns clean empty search when no other params exist", () => {
      const parsed = extractUrlFeedback("?error=Self-lockout+prevented");
      expect(parsed.toast).toEqual({
        variant: "error",
        message: "Self-lockout prevented",
      });
      expect(parsed.cleanSearch).toBe("");
    });

    it("extracts ?message= with ?type=warning and cleans both params", () => {
      const parsed = extractUrlFeedback("?message=Check+settings&type=warning");
      expect(parsed.toast).toEqual({
        variant: "warning",
        message: "Check settings",
      });
      expect(parsed.cleanSearch).toBe("");
    });
  });
});
