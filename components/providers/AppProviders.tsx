"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart/cart-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
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
    <SessionProvider basePath="/api/auth" refetchOnWindowFocus={false} refetchWhenOffline={false}>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
