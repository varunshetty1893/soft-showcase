"use client";

import * as React from "react";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";

export function CartNavButton() {
  const { totalCount } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      href="/cart"
      className="relative flex items-center justify-center p-2 rounded-xl text-[#526267] hover:text-[#155761] hover:bg-[#F3F7F7] border border-transparent hover:border-[#D9E2E4] transition-all cursor-pointer"
      title="View Saved Projects"
      aria-label="View Saved Projects"
    >
      <ShoppingCart className="w-5 h-5" />
      {mounted && totalCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 px-1 items-center justify-center rounded-full bg-[#155761] text-[10px] font-bold text-white shadow-xs">
          {totalCount}
        </span>
      )}
    </Link>
  );
}
