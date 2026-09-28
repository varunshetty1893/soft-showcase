"use client";

import * as React from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart/cart-context";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils/format";
import {
  ShoppingCart,
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ExternalLink,
} from "lucide-react";

export function CartPageContent() {
  const { items, removeFromCart, clearCart, totalCount, totalEstimatedPrice } = useCart();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="py-20 text-center">
        <div className="w-8 h-8 border-2 border-[#155761] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart className="w-6 h-6 text-[#155761]" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#102124]">
              Saved Projects &amp; Cart
            </h1>
          </div>
          <p className="text-sm text-[#526267]">
            Review your shortlisted software solutions and connect with verified creators.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={clearCart}
            className="self-start sm:self-auto text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear Cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-[#D9E2E4] p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-[#F3F7F7] border border-[#D9E2E4] flex items-center justify-center mx-auto mb-4 text-[#155761]">
            <ShoppingCart className="w-8 h-8 opacity-60" />
          </div>
          <h2 className="text-lg font-bold text-[#102124] mb-2">Your cart is currently empty</h2>
          <p className="text-sm text-[#526267] max-w-sm mx-auto mb-6 leading-relaxed">
            Explore hundreds of verified software projects, developer toolkits, and web applications ready for deployment.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/projects">
              <Button variant="primary" className="gap-2">
                <span>Browse Projects</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/custom-project">
              <Button variant="outline">
                Request Custom Build
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        /* Cart Grid */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Item List (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-[#526267] px-1">
              Shortlisted Projects ({totalCount})
            </div>

            {items.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-[#D9E2E4] p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center gap-4 hover:border-[#155761]/30 transition-colors"
              >
                {/* Image */}
                <div className="w-full sm:w-28 h-28 sm:h-20 rounded-xl bg-[#F3F7F7] overflow-hidden shrink-0 border border-[#D9E2E4]">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={`${item.title} project preview`}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#155761]">
                      Soft Showcase
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {item.categoryName && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#155761] bg-[#DDF4EC] px-2 py-0.5 rounded">
                        {item.categoryName}
                      </span>
                    )}
                    {item.providerName && (
                      <span className="text-[11px] text-[#526267] flex items-center gap-1">
                        by <strong className="text-[#102124]">{item.providerName}</strong>
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/projects/${item.slug}`}
                    className="text-base font-bold text-[#102124] hover:text-[#155761] transition-colors line-clamp-1"
                  >
                    {item.title}
                  </Link>

                  <p className="text-xs text-[#526267] line-clamp-1 mt-0.5">
                    {item.shortDescription}
                  </p>

                  <div className="mt-2 text-xs font-bold text-[#155761]">
                    {item.priceMode === "FREE"
                      ? "Free / Open Source"
                      : item.priceMode === "CONTACT_FOR_PRICE"
                      ? "Contact for Pricing"
                      : item.price
                      ? formatPrice(item.price)
                      : "Fixed Price"}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 border-t sm:border-t-0 pt-3 sm:pt-0 border-[#F3F7F7]">
                  <Link
                    href={`/projects/${item.slug}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#155761] hover:underline"
                  >
                    <span>View Details</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove from cart"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary (Right Column) */}
          <div className="space-y-6 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-[#D9E2E4] p-6 shadow-xs space-y-5">
              <h2 className="text-base font-bold text-[#102124] border-b border-[#F3F7F7] pb-3">
                Order &amp; Inquiry Summary
              </h2>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center text-[#526267]">
                  <span>Total Items</span>
                  <span className="font-bold text-[#102124]">{totalCount} projects</span>
                </div>

                <div className="flex justify-between items-center text-[#526267]">
                  <span>Estimated Total (Fixed projects)</span>
                  <span className="text-sm font-bold text-[#155761]">
                    {totalEstimatedPrice > 0
                      ? formatPrice(totalEstimatedPrice)
                      : "Quote upon inquiry"}
                  </span>
                </div>

                <div className="flex justify-between items-center text-[#526267]">
                  <span>Platform Fee</span>
                  <span className="font-bold text-emerald-700">₹0 (Zero Middleman)</span>
                </div>
              </div>

              <div className="pt-2 border-t border-[#F3F7F7] space-y-2">
                <div className="flex items-center gap-2 text-xs text-[#2F7D78]">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Direct builder contact via WhatsApp &amp; Email</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#526267]">
                  <ShieldCheck className="w-4 h-4 text-[#155761] shrink-0" />
                  <span>Verified project source code &amp; handover</span>
                </div>
              </div>

              <div className="pt-3">
                <Link href="/projects" className="block">
                  <Button variant="primary" className="w-full gap-2">
                    <span>Continue Browsing</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Custom Request Banner */}
            <div className="bg-[#DDF4EC] rounded-2xl border border-[#2F7D78]/25 p-5 text-xs text-[#155761] space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Sparkles className="w-4 h-4 text-[#2F7D78]" />
                <span>Need a tailored solution?</span>
              </div>
              <p className="text-[#526267] leading-relaxed">
                If none of the pre-built projects match 100% of your requirements, submit a custom specification.
              </p>
              <Link
                href="/custom-project"
                className="inline-block font-bold text-[#155761] hover:underline pt-1"
              >
                Submit Custom Request →
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
