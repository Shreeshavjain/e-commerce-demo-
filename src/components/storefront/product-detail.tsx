"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ImageIcon, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { calculateDiscountedPrice } from "@/server/utils/pricing";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/product";
import {
  formatPrice,
  getProductPriceRange,
  getThumbnailFallback,
  getVariantImages,
} from "@/components/storefront/product-display-utils";

type ProductDetailProps = {
  product: Product;
};

export function ProductDetail({ product }: ProductDetailProps) {
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const addItem = useCartStore((state) => state.addItem);

  const priceRange = getProductPriceRange(product);
  const thumbnailFallback = getThumbnailFallback(product);
  const selectedVariant = product.variants[selectedVariantIndex] ?? product.variants[0];
  const selectedOption = selectedVariant?.options[selectedOptionIndex] ?? selectedVariant?.options[0];
  const variantImages = selectedVariant
    ? getVariantImages(selectedVariant, product.title, thumbnailFallback)
    : thumbnailFallback
      ? [thumbnailFallback]
      : [];
  const activeImage = variantImages[selectedImageIndex] ?? variantImages[0] ?? null;

  function handleVariantSelect(index: number) {
    setSelectedVariantIndex(index);
    setSelectedOptionIndex(0);
    setSelectedImageIndex(0);
  }

  function handleOptionSelect(index: number) {
    setSelectedOptionIndex(index);
  }

  function handleAddToCart() {
    if (!selectedVariant || !selectedOption) {
      return;
    }

    addItem({
      productId: product.id,
      productSlug: product.slug,
      productTitle: product.title,
      productBrand: product.brand,
      productImage: product.thumbnail
        ? {
            url: product.thumbnail.url,
            altText: product.thumbnail.altText || product.title,
          }
        : null,
      variantId: selectedOption.variantId,
      variantLabel: selectedOption.label,
      variantName: selectedVariant.name,
      quantity: 1,
      price: {
        unitPrice: selectedOption.price,
        compareAtPrice: selectedOption.compareAtPrice,
        discountedPrice: selectedOption.discountedPrice ?? calculateDiscountedPrice(selectedOption.price, selectedOption.compareAtPrice),
      },
    });

    toast.success("Added to cart");
  }

  return (
    <div className="space-y-8">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-[1.75rem] border border-border bg-muted">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.altText}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-10 w-10" />
              </div>
            )}
          </div>

          {variantImages.length > 1 ? (
            <div className="grid grid-cols-4 gap-3">
              {variantImages.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative aspect-square overflow-hidden rounded-2xl border bg-muted transition",
                    selectedImageIndex === index ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                  )}
                >
                  <Image src={image.url} alt={image.altText} fill sizes="120px" className="object-cover" />
                </button>
              ))}
            </div>
          ) : null}

          {product.variants.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Color</p>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((variant, index) => (
                  <button
                    key={`${variant.name}-${variant.hexCode}`}
                    type="button"
                    onClick={() => handleVariantSelect(index)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
                      selectedVariantIndex === index
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    )}
                  >
                    <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: variant.hexCode }} />
                    {variant.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="space-y-3">
            {product.brand ? <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{product.brand}</p> : null}
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{product.title}</h1>
            <p className="text-2xl font-semibold text-foreground">{priceRange?.label ?? "Price unavailable"}</p>
            {product.shortDescription ? <p className="text-base leading-7 text-muted-foreground">{product.shortDescription}</p> : null}
          </div>

          {selectedVariant ? (
            <div className="space-y-4 rounded-[1.5rem] border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                {selectedVariant.variantType === "storage" ? "Storage options" : "Size options"}
              </h2>

              <div className="grid gap-2 sm:grid-cols-2">
                {selectedVariant.options.map((option, index) => (
                  <button
                    key={option.variantId}
                    type="button"
                    onClick={() => handleOptionSelect(index)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition",
                      selectedOption?.variantId === option.variantId
                        ? "border-primary bg-primary/10"
                        : "border-border bg-background hover:border-primary/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{option.label}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {option.isAvailable && option.stock > 0 ? `${option.stock} in stock` : "Out of stock"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-semibold text-foreground">{formatPrice(option.price)}</p>
                        {option.compareAtPrice != null ? (
                          <p className="text-xs text-muted-foreground line-through">{formatPrice(option.compareAtPrice)}</p>
                        ) : null}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="rounded-[1.5rem] border border-border bg-card/70 p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected variant</p>
                <p className="mt-2 text-base font-medium text-foreground">
                  {selectedVariant?.name ?? "Select a color"}
                  {selectedOption ? ` · ${selectedOption.label}` : ""}
                </p>
                {selectedOption ? <p className="mt-1 text-sm text-muted-foreground">{formatPrice(selectedOption.price)}</p> : null}
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedVariant || !selectedOption || !selectedOption.isAvailable || selectedOption.stock <= 0}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
                  !selectedVariant || !selectedOption || !selectedOption.isAvailable || selectedOption.stock <= 0
                    ? "cursor-not-allowed bg-muted text-muted-foreground"
                    : "bg-foreground text-background hover:opacity-90"
                )}
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </button>
            </div>
          </div>

          {product.description ? (
            <div className="space-y-3 rounded-[1.5rem] border border-border bg-card/70 p-5">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">Description</h2>
              <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.description}</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
