"use client";

import * as React from "react";
import { CartProvider } from "@/lib/cart/cart-context";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CartProvider>{children}</CartProvider>;
}
