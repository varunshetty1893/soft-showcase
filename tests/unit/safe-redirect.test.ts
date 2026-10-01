// tests/unit/safe-redirect.test.ts
import { describe, it, expect } from "vitest";
import { getSafeCallbackUrl } from "@/lib/utils/safe-redirect";

describe("Open Redirect Protection (M1)", () => {
  it("allows safe relative paths", () => {
    expect(getSafeCallbackUrl("/dashboard")).toBe("/dashboard");
    expect(getSafeCallbackUrl("/projects/omnicart-marketplace")).toBe("/projects/omnicart-marketplace");
    expect(getSafeCallbackUrl("/partner/solutions?tab=active")).toBe("/partner/solutions?tab=active");
  });

  it("falls back for external URLs", () => {
    expect(getSafeCallbackUrl("https://evil.com")).toBe("/");
    expect(getSafeCallbackUrl("http://evil.com/phishing")).toBe("/");
    expect(getSafeCallbackUrl("//evil.com")).toBe("/");
    expect(getSafeCallbackUrl("//evil.com/path")).toBe("/");
  });

  it("falls back for protocol-relative and backslash variants", () => {
    expect(getSafeCallbackUrl("/\\evil.com")).toBe("/");
    expect(getSafeCallbackUrl("\\evil.com")).toBe("/");
    expect(getSafeCallbackUrl("/dashboard\\evil.com")).toBe("/");
  });

  it("falls back for URL-encoded evasion attempts", () => {
    expect(getSafeCallbackUrl("%2F%2Fevil.com")).toBe("/");
    expect(getSafeCallbackUrl("%2F%5Cevil.com")).toBe("/");
    expect(getSafeCallbackUrl("/path%2F%2Fevil.com")).toBe("/");
  });

  it("falls back for javascript: and data: schemes", () => {
    expect(getSafeCallbackUrl("javascript:alert(1)")).toBe("/");
    expect(getSafeCallbackUrl("data:text/html,<script>alert(1)</script>")).toBe("/");
    expect(getSafeCallbackUrl("vbscript:msgbox(1)")).toBe("/");
  });

  it("falls back for control characters", () => {
    expect(getSafeCallbackUrl("/dashboard\x00evil")).toBe("/");
    expect(getSafeCallbackUrl("/dashboard\r\nSet-Cookie:admin=true")).toBe("/");
  });

  it("rejects auth endpoints to prevent redirect loops", () => {
    expect(getSafeCallbackUrl("/login")).toBe("/");
    expect(getSafeCallbackUrl("/login?callbackUrl=/dashboard")).toBe("/");
    expect(getSafeCallbackUrl("/register")).toBe("/");
    expect(getSafeCallbackUrl("/api/auth/signin")).toBe("/");
  });

  it("respects custom fallback", () => {
    expect(getSafeCallbackUrl("https://evil.com", "/partner/dashboard")).toBe("/partner/dashboard");
    expect(getSafeCallbackUrl(null, "/custom-fallback")).toBe("/custom-fallback");
    expect(getSafeCallbackUrl("", "/custom-fallback")).toBe("/custom-fallback");
  });
});
