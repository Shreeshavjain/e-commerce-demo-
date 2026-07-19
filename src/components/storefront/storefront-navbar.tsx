"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/stores/cart-store";
import { useAuthUser } from "@/hooks/use-auth";

export function StorefrontNavbar() {
  const [isMounted, setIsMounted] = useState(false);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const user = useAuthUser();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cartLabel = isMounted && totalItems > 0 ? `Cart, ${totalItems} item${totalItems === 1 ? "" : "s"}` : "Cart";

  return (
    <header className="border-b border-border/70 bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/products" className="text-sm font-semibold uppercase tracking-[0.22em] text-foreground">
          Ecommerce
        </Link>

        <div className="flex items-center gap-2">
          {/* My Orders — visible only when authenticated */}
          {isMounted && user && (
            <Link
              href="/my-orders"
              aria-label="My Orders"
              className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/40 hover:bg-primary/5"
            >
              <Package className="h-5 w-5" />
            </Link>
          )}

          <Link
            href="/cart"
            aria-label={cartLabel}
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/40 hover:bg-primary/5"
          >
            <ShoppingCart className="h-5 w-5" />

            {isMounted && totalItems > 0 ? (
              <span
                className={cn(
                  "absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1.5 text-[11px] font-semibold leading-none text-background"
                )}
              >
                {totalItems}
              </span>
            ) : null}
          </Link>
        </div>
      </div>
    </header>
  );
}