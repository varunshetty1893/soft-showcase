"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { CartProvider } from "@/lib/cart/cart-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CartProvider>{children}</CartProvider>
    </SessionProvider>
  );
}
