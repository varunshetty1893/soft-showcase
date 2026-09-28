"use client";

import * as React from "react";

export interface CartItem {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  priceMode: string;
  price?: number | string | null;
  imageUrl?: string | null;
  providerName?: string | null;
  providerWhatsapp?: string | null;
  providerEmail?: string | null;
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
}

const CartContext = React.createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "softshowcase_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load cart from localStorage on client mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to load cart from storage", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save cart to localStorage
  React.useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Failed to persist cart to storage", e);
    }
  }, [items, isLoaded]);

  const addToCart = React.useCallback((item: CartItem) => {
    setItems((prev) => {
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFromCart = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = React.useCallback(
    (id: string) => items.some((item) => item.id === id),
    [items]
  );

  const totalEstimatedPrice = React.useMemo(() => {
    return items.reduce((sum, item) => {
      const num = Number(item.price);
      return !isNaN(num) && item.priceMode === "FIXED" ? sum + num : sum;
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
