"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ImageIcon, ShoppingBag, ShieldCheck, Truck, RotateCcw } from "lucide-react";
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
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12 bg-white">
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-8 md:mb-12">
        <ArrowLeft className="h-4 w-4" />
        Back to products
      </Link>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start">
        {/* Left Column - Image Gallery */}
        <div className="space-y-6 lg:sticky lg:top-32">
          {/* Main Image */}
          <div className="group relative aspect-square w-full overflow-hidden rounded-[2.5rem] bg-gray-50 flex items-center justify-center border border-gray-100">
            {activeImage ? (
              <Image
                src={activeImage.url}
                alt={activeImage.altText}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-contain p-8 transition-transform duration-700 ease-out group-hover:scale-110"
              />
            ) : (
              <ImageIcon className="h-16 w-16 text-slate-200" />
            )}
          </div>

          {/* Thumbnails */}
          {variantImages.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {variantImages.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.25rem] border-2 transition-all duration-300 bg-white",
                    selectedImageIndex === index 
                      ? "border-blue-500 shadow-md shadow-blue-500/10" 
                      : "border-transparent hover:border-gray-200 opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={image.url} alt={image.altText} fill sizes="96px" className="object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="flex flex-col space-y-10">
          {/* Title & Price */}
          <div className="space-y-4">
            {product.brand && (
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{product.brand}</p>
            )}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              {product.title}
            </h1>
            <p className="text-2xl font-semibold text-slate-900">{priceRange?.label ?? "Price unavailable"}</p>
            {product.shortDescription && (
              <p className="text-lg leading-relaxed text-slate-500">{product.shortDescription}</p>
            )}
          </div>

          <div className="h-px w-full bg-slate-100" />

          {/* Color Variants */}
          {product.variants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">Finish</p>
                <p className="text-sm font-medium text-slate-500">{selectedVariant?.name}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant, index) => (
                  <button
                    key={`${variant.name}-${variant.hexCode}`}
                    type="button"
                    onClick={() => handleVariantSelect(index)}
                    aria-label={`Select color ${variant.name}`}
                    className={cn(
                      "relative h-12 w-12 rounded-full transition-all duration-300 flex items-center justify-center",
                      selectedVariantIndex === index
                        ? "ring-2 ring-offset-4 ring-blue-500 scale-110"
                        : "ring-1 ring-gray-200 hover:scale-105 hover:ring-gray-300"
                    )}
                  >
                    <span 
                      className="absolute inset-1 rounded-full shadow-inner" 
                      style={{ backgroundColor: variant.hexCode }} 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Storage / Size Options */}
          {selectedVariant && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900">
                  {selectedVariant.variantType === "storage" ? "Storage" : "Size"}
                </p>
                {selectedOption && (
                  <p className="text-sm font-medium text-slate-500">{selectedOption.label}</p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedVariant.options.map((option, index) => (
                  <button
                    key={option.variantId}
                    type="button"
                    onClick={() => handleOptionSelect(index)}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-[1.5rem] border-2 p-5 text-center transition-all duration-300",
                      selectedOption?.variantId === option.variantId
                        ? "border-blue-500 bg-blue-50/30 text-blue-900 shadow-sm"
                        : "border-gray-200 bg-white text-slate-700 hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-lg font-bold">{option.label}</span>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-medium">{formatPrice(option.price)}</span>
                      {option.compareAtPrice != null && (
                        <span className="text-xs text-slate-400 line-through">{formatPrice(option.compareAtPrice)}</span>
                      )}
                    </div>
                    {(!option.isAvailable || option.stock <= 0) && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-[1.5rem] bg-white/60 backdrop-blur-[1px] text-sm font-bold text-slate-500 uppercase tracking-wider">
                        Out of stock
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add to Cart CTA */}
          <div className="pt-6">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!selectedVariant || !selectedOption || !selectedOption.isAvailable || selectedOption.stock <= 0}
              className={cn(
                "group relative flex w-full items-center justify-center gap-3 rounded-full py-5 text-lg font-bold transition-all duration-300",
                !selectedVariant || !selectedOption || !selectedOption.isAvailable || selectedOption.stock <= 0
                  ? "cursor-not-allowed bg-gray-100 text-slate-400"
                  : "bg-blue-600 text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 hover:shadow-blue-600/30 active:scale-[0.98]"
              )}
            >
              <ShoppingBag className="h-6 w-6 transition-transform group-hover:scale-110" />
              Add to Bag
            </button>
            {selectedOption?.stock > 0 && selectedOption?.stock <= 5 && (
               <p className="text-center text-sm font-medium text-amber-600 mt-4">
                 Only {selectedOption.stock} left in stock - order soon.
               </p>
            )}
          </div>

          {/* Trust Highlights */}
          <div className="grid grid-cols-3 gap-4 border-y border-slate-100 py-8">
            <div className="flex flex-col items-center text-center gap-2">
              <Truck className="h-6 w-6 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">Free Delivery</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <ShieldCheck className="h-6 w-6 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">1 Year Warranty</span>
            </div>
            <div className="flex flex-col items-center text-center gap-2">
              <RotateCcw className="h-6 w-6 text-slate-400" />
              <span className="text-xs font-bold text-slate-700">30-Day Returns</span>
            </div>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="space-y-4 pt-2">
              <h2 className="text-lg font-bold text-slate-900">Product Information</h2>
              <div className="prose prose-slate prose-sm max-w-none text-slate-500 leading-relaxed">
                <p className="whitespace-pre-line">{product.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
