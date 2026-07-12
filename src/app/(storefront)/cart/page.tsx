"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ImageIcon, ArrowRight, Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/components/storefront/product-display-utils";
import { useCartStore } from "@/stores/cart-store";

function CartEmptyState() {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
        <ShoppingCart className="h-6 w-6" />
      </div>
      <p className="mt-5 text-lg font-semibold text-foreground">Your cart is empty</p>
      <p className="mt-2 text-sm text-muted-foreground">Browse products and add the variant you want to purchase.</p>
      <Link
        href="/products"
        className="mt-6 inline-flex items-center justify-center rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
      >
        Continue Shopping
      </Link>
    </div>
  );
}

function CartItemRow({
  productId,
  variantId,
  productImage,
  productTitle,
  productBrand,
  variantName,
  variantLabel,
  quantity,
  unitPrice,
  lineTotal,
  onIncrease,
  onDecrease,
  onRemoveRequest,
}: {
  productId: string;
  variantId: string;
  productImage: { url: string; altText: string } | null;
  productTitle: string;
  productBrand: string;
  variantName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  onIncrease: (productId: string, variantId: string) => void;
  onDecrease: (productId: string, variantId: string) => void;
  onRemoveRequest: (productId: string, variantId: string, label: string) => void;
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
          <div className="flex items-center gap-2 sm:justify-end">
            <button
              type="button"
              onClick={() => onDecrease(productId, variantId)}
              disabled={quantity <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/40 hover:bg-primary/5"
              aria-label={`Decrease quantity for ${productTitle}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-8 text-center font-medium text-foreground">{quantity}</span>

            <button
              type="button"
              onClick={() => onIncrease(productId, variantId)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-foreground transition hover:border-primary/40 hover:bg-primary/5"
              aria-label={`Increase quantity for ${productTitle}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-muted-foreground">Unit price</span>
          <span className="font-medium text-foreground">{formatPrice(unitPrice)}</span>

          <span className="text-muted-foreground">Line total</span>
          <span className="font-semibold text-foreground">{formatPrice(lineTotal)}</span>
        </div>

        <button
          type="button"
          onClick={() => onRemoveRequest(productId, variantId, `${productTitle} · ${variantName} / ${variantLabel}`)}
          className="inline-flex items-center justify-end gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <Trash2 className="h-4 w-4" />
          Remove item
        </button>
      </div>
    </div>
  );
}

type RemoveTarget = {
  productId: string;
  variantId: string;
  label: string;
};

function RemoveConfirmationDialog({
  target,
  onCancel,
  onRemove,
}: {
  target: RemoveTarget | null;
  onCancel: () => void;
  onRemove: (productId: string, variantId: string) => void;
}) {
  if (!target) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-black/45 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative z-10 w-full max-w-md rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_28px_80px_-34px_rgba(15,23,42,0.55)]">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">Remove Item</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Are you sure you want to remove this item from your cart?</p>

        <p className="mt-4 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground">{target.label}</p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-primary/40 hover:bg-primary/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onRemove(target.productId, target.variantId)}
            className="inline-flex items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CartPage() {
  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.getSubtotal());
  const totalItems = useCartStore((state) => state.getTotalItems());
  const increaseQuantity = useCartStore((state) => state.increaseQuantity);
  const decreaseQuantity = useCartStore((state) => state.decreaseQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const [removeTarget, setRemoveTarget] = useState<RemoveTarget | null>(null);

  function handleRemoveRequest(productId: string, variantId: string, label: string) {
    setRemoveTarget({ productId, variantId, label });
  }

  function handleRemoveConfirm(productId: string, variantId: string) {
    removeItem(productId, variantId);
    setRemoveTarget(null);
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">Storefront</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Cart</h1>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
          Review the selected product variants before moving on to checkout later.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-4">
            {items.map((item) => (
              <CartItemRow
                key={`${item.productId}:${item.variantId}`}
                productId={item.productId}
                variantId={item.variantId}
                productImage={item.productImage}
                productTitle={item.productTitle}
                productBrand={item.productBrand}
                variantName={item.variantName}
                variantLabel={item.variantLabel}
                quantity={item.quantity}
                unitPrice={item.price.unitPrice}
                lineTotal={item.lineTotal}
                onIncrease={increaseQuantity}
                onDecrease={decreaseQuantity}
                onRemoveRequest={handleRemoveRequest}
              />
            ))}
          </section>

          <aside className="h-fit rounded-[1.5rem] border border-border bg-card/85 p-5 shadow-sm shadow-black/5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Order summary</p>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
                <span>Items</span>
                <span className="font-medium text-foreground">{totalItems}</span>
              </div>

              <div className="flex items-center justify-between gap-4 border-t border-border pt-4">
                <span className="text-sm font-medium text-muted-foreground">Subtotal</span>
                <span className="text-lg font-semibold text-foreground">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <Link
              href="/products"
              className={cn(
                "mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background transition hover:opacity-90"
              )}
            >
              Continue Shopping
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>
        </div>
      ) : (
        <CartEmptyState />
      )}

      <RemoveConfirmationDialog target={removeTarget} onCancel={() => setRemoveTarget(null)} onRemove={handleRemoveConfirm} />
    </main>
  );
}