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
    <div className="rounded-[2.5rem] border border-gray-100 bg-white px-6 py-20 text-center shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-300">
        <ShoppingCart className="h-8 w-8" />
      </div>
      <p className="mt-6 text-2xl font-black text-slate-900 tracking-tight">Your cart is empty</p>
      <p className="mt-2 text-base text-slate-500 font-medium">Browse products and add the variant you want to purchase.</p>
      <Link
        href="/products"
        className="mt-8 inline-flex items-center justify-center rounded-full bg-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 transition-all hover:-translate-y-0.5 active:scale-95"
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
    <div className="grid gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.03)] sm:grid-cols-[100px_minmax(0,1fr)_auto] sm:items-center hover:border-gray-200 transition-colors">
      <div className="relative aspect-square overflow-hidden rounded-[1.25rem] border border-gray-100 bg-gray-50 flex items-center justify-center">
        {productImage?.url ? (
          <Image src={productImage.url} alt={productImage.altText || productTitle} fill sizes="100px" className="object-cover" />
        ) : (
          <ImageIcon className="h-8 w-8 text-slate-300" />
        )}
      </div>

      <div className="space-y-1.5">
        {productBrand && <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{productBrand}</p>}
        <div className="space-y-0.5">
          <h2 className="text-lg font-bold text-slate-900">{productTitle}</h2>
          <p className="text-sm font-medium text-slate-500">{variantName} · {variantLabel}</p>
        </div>
      </div>

      <div className="grid gap-4 text-sm sm:justify-items-end mt-4 sm:mt-0">
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-1 sm:text-right">
          <span className="text-slate-400 font-medium sm:hidden">Quantity</span>
          <div className="flex items-center gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => onDecrease(productId, variantId)}
              disabled={quantity <= 1}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
              aria-label={`Decrease quantity for ${productTitle}`}
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <span className="min-w-6 text-center font-bold text-slate-900">{quantity}</span>

            <button
              type="button"
              onClick={() => onIncrease(productId, variantId)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition-colors hover:bg-slate-200"
              aria-label={`Increase quantity for ${productTitle}`}
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-slate-400 font-medium sm:hidden">Unit price</span>
          <span className="font-semibold text-slate-900 sm:hidden">{formatPrice(unitPrice)}</span>

          <span className="text-slate-400 font-medium sm:hidden">Total</span>
          <span className="font-black text-slate-900 text-base">{formatPrice(lineTotal)}</span>
        </div>

        <button
          type="button"
          onClick={() => onRemoveRequest(productId, variantId, `${productTitle} · ${variantName} / ${variantLabel}`)}
          className="inline-flex items-center justify-end gap-2 text-sm font-bold text-red-500 transition-colors hover:text-red-600 sm:mt-2"
        >
          <Trash2 className="h-4 w-4" />
          Remove
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
      <button type="button" aria-label="Close dialog" className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onCancel} />

      <div className="relative z-10 w-full max-w-md rounded-[2rem] border border-gray-100 bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-black tracking-tight text-slate-900">Remove Item</h2>
        <p className="mt-2 text-base font-medium text-slate-500">Are you sure you want to remove this item from your bag?</p>

        <p className="mt-6 rounded-[1rem] bg-gray-50 px-5 py-4 text-sm font-semibold text-slate-700 border border-gray-100">{target.label}</p>

        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center justify-center rounded-full bg-white border border-gray-200 px-6 py-3 text-sm font-bold text-slate-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onRemove(target.productId, target.variantId)}
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-red-700 shadow-md shadow-red-600/20"
          >
            Remove Item
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
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 pt-32">
      <div className="mb-10 space-y-2">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900">Shopping Bag</h1>
        <p className="max-w-2xl text-lg font-medium text-slate-500">
          Review your items before proceeding to secure checkout.
        </p>
      </div>

      {items.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
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

          <aside className="h-fit rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] sticky top-32">
            <h2 className="text-xl font-black text-slate-900">Order Summary</h2>

            <div className="mt-8 space-y-4">
              <div className="flex items-center justify-between text-base font-medium text-slate-500">
                <span>Total Items</span>
                <span className="text-slate-900">{totalItems}</span>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                <span className="text-lg font-bold text-slate-900">Subtotal</span>
                <span className="text-2xl font-black text-slate-900">{formatPrice(subtotal)}</span>
              </div>
              <p className="text-sm font-medium text-slate-400 mt-2">Shipping & taxes calculated at checkout.</p>
            </div>

            <Link
              href="/checkout"
              className={cn(
                "mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-base font-bold text-white transition-all shadow-lg shadow-blue-600/30 hover:bg-blue-700 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95"
              )}
            >
              Checkout Now
              <ArrowRight className="h-5 w-5" />
            </Link>

            <Link
              href="/products"
              className="mt-6 block text-center text-sm font-bold text-slate-500 transition-colors hover:text-blue-600"
            >
              Continue Shopping
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