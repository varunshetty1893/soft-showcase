// lib/cart/cart-context.tsx
// User-Isolated Shopping Cart & Saved Projects context.
// Strictly scopes cart persistence to the authenticated user's unique ID/email.
// Prevents cross-account data leaks when multiple users share the same device/browser.

"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import { getEffectivePricing, type ProjectPricingInput } from "@/lib/utils/pricing";

export interface CartItem extends ProjectPricingInput {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  priceMode: string;
  price?: number | string | null;
  originalPrice?: number | string | null;
  imageUrl?: string | null;
  providerName?: string | null;
  categoryName?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  isInCart: (id: string) => boolean;
  totalCount: number;
  totalEstimatedPrice: number;
  isLoaded: boolean;
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

// Prefix for user-isolated carts in localStorage
const USER_CART_PREFIX = "softshowcase_cart_user_";
// Legacy shared un-isolated cart key to purge
const LEGACY_CART_KEY = "softshowcase_cart_v1";

function getUserStorageKey(userId?: string | null, email?: string | null): string | null {
  if (userId && typeof userId === "string" && userId.trim()) {
    return `${USER_CART_PREFIX}${userId.trim()}`;
  }
  if (email && typeof email === "string" && email.trim()) {
    return `${USER_CART_PREFIX}${email.trim().toLowerCase()}`;
  }
  return null;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Derive active user's unique storage key
  const activeUserKey = React.useMemo(() => {
    if (status !== "authenticated" || !session?.user) return null;
    return getUserStorageKey(session.user.id, session.user.email);
  }, [session, status]);

  // Keep track of which user key the current items state belongs to
  const loadedUserKeyRef = React.useRef<string | null | undefined>(undefined);

  // Synchronize cart with the active authenticated user session
  React.useEffect(() => {
    // Wait until NextAuth has resolved session status
    if (status === "loading") {
      return;
    }

    // Purge legacy un-isolated shared cart to prevent historical leakage
    try {
      if (typeof window !== "undefined" && localStorage.getItem(LEGACY_CART_KEY)) {
        localStorage.removeItem(LEGACY_CART_KEY);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }

    // If unauthenticated or no active user: immediately wipe in-memory items
    if (status === "unauthenticated" || !activeUserKey) {
      loadedUserKeyRef.current = null;
      setItems([]);
      setIsLoaded(true);
      return;
    }

    // If user switched or first load for this authenticated user
    if (loadedUserKeyRef.current !== activeUserKey) {
      loadedUserKeyRef.current = activeUserKey;
      try {
        const stored = localStorage.getItem(activeUserKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            // Strip legacy provider contact info (Issue H4 migration)
            const sanitized = parsed.map((item: any) => {
              const copy = { ...item };
              delete copy.providerWhatsapp;
              delete copy.providerEmail;
              return copy as CartItem;
            });
            setItems(sanitized);
          } else {
            setItems([]);
          }
        } else {
          // New account or account with no previous cart -> start with fresh empty cart
          setItems([]);
        }
      } catch (e) {
        console.error("[Cart] Failed to load user-isolated cart from storage", e);
        setItems([]);
      } finally {
        setIsLoaded(true);
      }
    }
  }, [status, activeUserKey]);

  // Persist items to the active user's storage key whenever items change
  React.useEffect(() => {
    if (!isLoaded || status !== "authenticated" || !activeUserKey) {
      return;
    }

    // Ensure we are saving only for the user whose cart is currently loaded
    if (loadedUserKeyRef.current !== activeUserKey) {
      return;
    }

    try {
      localStorage.setItem(activeUserKey, JSON.stringify(items));
    } catch (e) {
      console.error("[Cart] Failed to persist user-isolated cart to storage", e);
    }
  }, [items, isLoaded, status, activeUserKey]);

  // Listen to cross-tab storage changes for the same user
  React.useEffect(() => {
    if (!activeUserKey) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === activeUserKey && e.newValue) {
        try {
          const updated = JSON.parse(e.newValue);
          if (Array.isArray(updated)) {
            setItems(updated);
          }
        } catch {
          // Ignore parse errors
        }
      } else if (e.key === activeUserKey && !e.newValue) {
        setItems([]);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [activeUserKey]);

  const addToCart = React.useCallback(
    (item: CartItem) => {
      if (!activeUserKey) {
        console.warn("[Cart] Cannot add to cart: user is not authenticated");
        return;
      }
      setItems((prev) => {
        if (prev.some((i) => i.id === item.id)) return prev;
        return [...prev, item];
      });
    },
    [activeUserKey]
  );

  const removeFromCart = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    if (activeUserKey) {
      try {
        localStorage.removeItem(activeUserKey);
      } catch {}
    }
  }, [activeUserKey]);

  const isInCart = React.useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const totalEstimatedPrice = React.useMemo(() => {
    return items.reduce((sum, item) => {
      const effective = getEffectivePricing(item);
      return effective.priceMode === "FIXED" &&
        effective.effectivePrice !== null &&
        effective.effectivePrice > 0
        ? sum + effective.effectivePrice
        : sum;
    }, 0);
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isInCart,
        totalCount: items.length,
        totalEstimatedPrice,
        isLoaded,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = React.useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
