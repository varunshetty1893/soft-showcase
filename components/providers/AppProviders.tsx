"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart/cart-context";
import { ToastProvider } from "@/components/ui/toast";

export function AppProviders({
  children,
  session,
}: {
  children: React.ReactNode;
  session?: any;
}) {
  // Prevent unhandled NextAuth client polling / fetch rejections from tripping error boundaries
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = event?.reason;
      const isAuthError =
        reason?.name === "ClientFetchError" ||
        reason?.name === "ClientSessionError" ||
        (typeof reason?.message === "string" && reason.message.includes("errors.authjs.dev"));

      if (isAuthError) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return (
    <SessionProvider
      session={session}
      basePath="/api/auth"
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ToastProvider>
        <CartProvider>{children}</CartProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
