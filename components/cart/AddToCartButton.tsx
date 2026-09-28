"use client";

import * as React from "react";
import { ShoppingCart, Check, Lock } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";

interface AddToCartButtonProps {
  project: {
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
  };
  variant?: "primary" | "outline" | "compact";
  className?: string;
}

export function AddToCartButton({ project, variant = "primary", className = "" }: AddToCartButtonProps) {
  const { addToCart, removeFromCart, isInCart } = useCart();
  const sessionContext = useSession();
  const session = sessionContext?.data;
  const router = useRouter();
  const pathname = usePathname();
  const inCart = isInCart(project.id);
  const [justAdded, setJustAdded] = React.useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(pathname || `/projects/${project.slug}`)}`);
      return;
    }

    if (inCart) {
      removeFromCart(project.id);
    } else {
      addToCart({
        id: project.id,
        title: project.title,
        slug: project.slug,
        shortDescription: project.shortDescription,
        priceMode: project.priceMode,
        price: project.price,
        imageUrl: project.imageUrl,
        providerName: project.providerName,
        providerWhatsapp: project.providerWhatsapp,
        providerEmail: project.providerEmail,
        categoryName: project.categoryName,
      });
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    }
  };

  if (!session?.user) {
    if (variant === "compact") {
      // Don't show cart option at all when user is not logged in
      return null;
    }

    return (
      <Button
        type="button"
        onClick={handleToggle}
        variant="primary"
        size="lg"
        className={`w-full gap-2 text-sm font-bold bg-[#155761] hover:bg-[#10474F] text-white transition-all cursor-pointer ${className}`}
      >
        <Lock className="w-4 h-4" />
        <span>Sign In to Buy / Access</span>
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        title={inCart ? "Remove from cart" : "Add to cart"}
        className={`p-2 rounded-xl border transition-all cursor-pointer ${
          inCart
            ? "bg-[#DDF4EC] text-[#155761] border-[#2F7D78]/30 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200"
            : "bg-white text-[#526267] border-[#D9E2E4] hover:text-[#155761] hover:border-[#155761]/40 hover:bg-[#F3F7F7]"
        } ${className}`}
      >
        {inCart ? (
          justAdded ? (
            <Check className="w-4 h-4 text-[#2F7D78]" />
          ) : (
            <ShoppingCart className="w-4 h-4 fill-current text-[#155761]" />
          )
        ) : (
          <ShoppingCart className="w-4 h-4" />
        )}
      </button>
    );
  }

  return (
    <Button
      type="button"
      onClick={handleToggle}
      variant={inCart ? "outline" : "primary"}
      size="lg"
      className={`w-full gap-2 text-sm font-bold transition-all cursor-pointer ${
        inCart
          ? "border-[#2F7D78]/40 bg-[#DDF4EC] text-[#155761] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300"
          : "bg-[#155761] hover:bg-[#10474F] text-white"
      } ${className}`}
    >
      {inCart ? (
        <>
          <Check className="w-4 h-4 text-[#2F7D78]" />
          <span>In Your Cart (Click to Remove)</span>
        </>
      ) : (
        <>
          <ShoppingCart className="w-4 h-4" />
          <span>Add to Saved Cart</span>
        </>
      )}
    </Button>
  );
}
