"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ImageIcon, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/components/storefront/product-display-utils";
import { useCartStore } from "@/stores/cart-store";

function CheckoutEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <ShoppingCart className="h-6 w-6" />
      </div>
      <p className="mt-5 text-lg font-semibold text-foreground">Redirecting to products...</p>
      <p className="mt-2 text-sm text-muted-foreground">Your cart is empty, so we are taking you back to the catalog.</p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

function CheckoutItemRow({
  productImage,
  productTitle,
  productBrand,
  variantName,
  variantLabel,
  quantity,
  unitPrice,
  lineTotal,
}: {
  productImage: { url: string; altText: string } | null;
  productTitle: string;
  productBrand: string;
  variantName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}) {
  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-border bg-card/80 p-4 sm:grid-cols-[92px_minmax(0,1fr)_auto] sm:items-center">
      <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-muted">
        {productImage?.url ? (
          <Image src={productImage.url} alt={productImage.altText || productTitle} fill sizes="92px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="space-y-2">
        {productBrand ? <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{productBrand}</p> : null}
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-foreground">{productTitle}</h2>
          <p className="text-sm text-muted-foreground">Color: {variantName}</p>
          <p className="text-sm text-muted-foreground">Storage / Variant: {variantLabel}</p>
        </div>
      </div>

      <div className="grid gap-3 text-sm sm:justify-items-end">
        <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-1 sm:text-right">
          <span className="text-muted-foreground">Qty</span>
          <span className="font-medium text-foreground">{quantity}</span>

          <span className="text-muted-foreground">Unit price</span>
          <span className="font-medium text-foreground">{formatPrice(unitPrice)}</span>

          <span className="text-muted-foreground">Line total</span>
          <span className="font-semibold text-foreground">{formatPrice(lineTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((state) => state.items);
  const totalItems = useCartStore((state) => state.getTotalItems());
  const subtotal = useCartStore((state) => state.getSubtotal());
  const hasHydrated = useSyncExternalStore(
    (onStoreChange) => useCartStore.persist.onFinishHydration(onStoreChange),
    () => useCartStore.persist.hasHydrated(),
    () => false
  );

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    if (items.length === 0) {
      router.replace("/products");
    }
  }, [hasHydrated, items.length, router]);

  if (!hasHydrated) {
    return null;
  }

  if (items.length === 0) {
    return (
      <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <CheckoutEmptyState />
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Storefront</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Checkout</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Review your cart before proceeding to login and completing the checkout flow later.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          {items.map((item) => (
            <CheckoutItemRow
              key={`${item.productId}:${item.variantId}`}
              productImage={item.productImage}
              productTitle={item.productTitle}
              productBrand={item.productBrand}
              variantName={item.variantName}
              variantLabel={item.variantLabel}
              quantity={item.quantity}
              unitPrice={item.price.unitPrice}
              lineTotal={item.lineTotal}
            />
          ))}
        </section>

        <aside className="h-fit rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order summary</p>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
              <span>Total items</span>
              <span className="font-medium text-foreground">{totalItems}</span>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
              <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
              <span className="text-lg font-semibold text-foreground">{formatPrice(subtotal)}</span>
            </div>
          </div>

          <button
            type="button"
            disabled
            title="Login flow will be connected later"
            className={cn(
              "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
              "cursor-not-allowed bg-muted text-muted-foreground"
            )}
          >
            Proceed to Login
            <ArrowRight className="h-4 w-4" />
          </button>
        </aside>
      </div>
    </main>
  );
}