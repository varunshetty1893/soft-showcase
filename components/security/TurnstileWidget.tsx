// components/security/TurnstileWidget.tsx
// Client-side Cloudflare Turnstile widget (N1).
// Loads https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit once via next/script,
// renders explicitly with NEXT_PUBLIC_TURNSTILE_SITE_KEY, and exposes a reset() handle.

"use client";

import * as React from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: {
          sitekey: string;
          theme?: "light" | "dark" | "auto";
          callback?: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: (errorCode?: string) => void;
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export interface TurnstileWidgetHandle {
  reset: () => void;
}

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (errorCode?: string) => void;
  theme?: "light" | "dark" | "auto";
  className?: string;
}

export const TurnstileWidget = React.forwardRef<TurnstileWidgetHandle, TurnstileWidgetProps>(
  function TurnstileWidget(
    { onVerify, onExpire, onError, theme = "light", className },
    ref
  ) {
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const widgetIdRef = React.useRef<string | null>(null);
    const [scriptReady, setScriptReady] = React.useState(false);

    const siteKey =
      process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
      (process.env.NODE_ENV !== "production" ? "1x00000000000000000000AA" : "");

    const onVerifyRef = React.useRef(onVerify);
    const onExpireRef = React.useRef(onExpire);
    const onErrorRef = React.useRef(onError);

    React.useEffect(() => {
      onVerifyRef.current = onVerify;
      onExpireRef.current = onExpire;
      onErrorRef.current = onError;
    }, [onVerify, onExpire, onError]);

    React.useEffect(() => {
      if (typeof window !== "undefined" && window.turnstile) {
        setScriptReady(true);
      }
    }, []);

    React.useEffect(() => {
      if (!scriptReady || !siteKey || !containerRef.current || !window.turnstile) {
        return;
      }

      if (widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // Ignore removal errors
        }
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme,
          callback: (token: string) => {
            onVerifyRef.current(token);
          },
          "expired-callback": () => {
            onExpireRef.current?.();
          },
          "error-callback": (errCode?: string) => {
            onErrorRef.current?.(errCode);
          },
        });
      } catch (err) {
        console.warn("[TurnstileWidget] Failed to render widget:", err);
      }

      return () => {
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            // Ignore cleanup errors
          }
          widgetIdRef.current = null;
        }
      };
    }, [scriptReady, siteKey, theme]);

    React.useImperativeHandle(
      ref,
      () => ({
        reset() {
          if (widgetIdRef.current && typeof window !== "undefined" && window.turnstile) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch {
              // Ignore reset errors
            }
          }
        },
      }),
      []
    );

    if (!siteKey) {
      return null;
    }

    return (
      <div className={className} data-testid="turnstile-widget" suppressHydrationWarning>
        <Script
          id="cloudflare-turnstile-script"
          src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
          onReady={() => setScriptReady(true)}
        />
        <div ref={containerRef} className="min-h-[65px]" suppressHydrationWarning />
      </div>
    );
  }
);
