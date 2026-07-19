"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, ImageIcon, ShoppingBag, ShieldCheck, Truck, RotateCcw, Star, Plus, Minus, ChevronRight, Zap } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { calculateDiscountedPrice } from "@/server/utils/pricing";
import { useCartStore } from "@/stores/cart-store";
import type { Product } from "@/types/product";
import { ProductCard } from "@/components/storefront/product-card";
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
  const router = useRouter();
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedOptionIndex, setSelectedOptionIndex] = useState(0);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<"description" | "specifications" | "shipping" | "reviews">("description");
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
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

  useEffect(() => {
    // Fetch related products (mock fetch from API)
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data && data.products) {
          // Filter out current product and take top 3
          setRelatedProducts(data.products.filter((p: Product) => p.id !== product.id).slice(0, 3));
        }
      })
      .catch(console.error);
  }, [product.id]);

  function handleVariantSelect(index: number) {
    setSelectedVariantIndex(index);
    setSelectedOptionIndex(0);
    setSelectedImageIndex(0);
    setQuantity(1);
  }

  function handleOptionSelect(index: number) {
    setSelectedOptionIndex(index);
    setQuantity(1);
  }

  function decreaseQuantity() {
    if (quantity > 1) setQuantity(q => q - 1);
  }

  function increaseQuantity() {
    if (selectedOption && quantity < selectedOption.stock) {
      setQuantity(q => q + 1);
    }
  }

  function addToCartAction() {
    if (!selectedVariant || !selectedOption) return;

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
      quantity,
      price: {
        unitPrice: selectedOption.price,
        compareAtPrice: selectedOption.compareAtPrice,
        discountedPrice: selectedOption.discountedPrice ?? calculateDiscountedPrice(selectedOption.price, selectedOption.compareAtPrice),
      },
    });
  }

  function handleAddToCart() {
    addToCartAction();
    toast.success("Added to cart");
  }

  function handleBuyNow() {
    addToCartAction();
    router.push("/checkout");
  }

  const isOutOfStock = !selectedOption || !selectedOption.isAvailable || selectedOption.stock <= 0;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 md:py-16 bg-white min-h-screen">
      {/* Breadcrumb / Back Link */}
      <Link href="/products" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 transition-colors mb-12">
        <ArrowLeft className="h-4 w-4" />
        Back to Products
      </Link>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-start mb-24">
        {/* Left Column - Image Gallery */}
        <div className="lg:sticky lg:top-32 flex flex-col-reverse sm:flex-row gap-6">
          {/* Vertical Thumbnails */}
          {variantImages.length > 1 && (
            <div className="flex sm:flex-col gap-4 overflow-x-auto sm:overflow-y-auto sm:max-h-[600px] scrollbar-hide pb-2 sm:pb-0 sm:pr-2">
              {variantImages.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  onClick={() => setSelectedImageIndex(index)}
                  className={cn(
                    "relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-[1.25rem] border-2 transition-all duration-300 bg-white",
                    selectedImageIndex === index 
                      ? "border-blue-500 shadow-[0_0_20px_-5px_rgba(59,130,246,0.3)]" 
                      : "border-transparent hover:border-gray-200 opacity-60 hover:opacity-100"
                  )}
                >
                  <Image src={image.url} alt={image.altText} fill sizes="96px" className="object-contain p-2" />
                </button>
              ))}
            </div>
          )}

          {/* Main Image */}
          <div className="flex-1 group relative aspect-square sm:aspect-auto sm:h-[600px] w-full overflow-hidden rounded-[2.5rem] bg-gray-50/50 flex items-center justify-center border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)]">
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
              <ImageIcon className="h-20 w-20 text-slate-200" />
            )}
          </div>
        </div>

        {/* Right Column - Product Info */}
        <div className="flex flex-col space-y-10">
          {/* Header Info */}
          <div className="space-y-5">
            {product.brand && (
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">{product.brand}</p>
            )}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
              {product.title}
            </h1>
            
            {/* Rating Mock */}
            <div className="flex items-center gap-2">
              <div className="flex items-center text-amber-400">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current text-slate-200" />
              </div>
              <span className="text-sm font-bold text-slate-500 ml-2">4.8 (124 reviews)</span>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <p className="text-3xl font-black text-slate-900">{selectedOption ? formatPrice(selectedOption.price) : priceRange?.label ?? "Price unavailable"}</p>
              {selectedOption?.compareAtPrice != null && selectedOption.compareAtPrice > selectedOption.price && (
                <p className="text-sm font-bold text-slate-400 line-through">MRP: {formatPrice(selectedOption.compareAtPrice)}</p>
              )}
            </div>

            {product.shortDescription && (
              <p className="text-lg leading-relaxed text-slate-500 font-medium">{product.shortDescription}</p>
            )}
            
            {!isOutOfStock ? (
               <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-600">
                 <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                 In Stock
               </div>
            ) : (
               <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-bold text-red-600">
                 Out of Stock
               </div>
            )}
          </div>

          <div className="h-px w-full bg-gray-100" />

          {/* Color Variants (Swatches) */}
          {product.variants.length > 0 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Color</p>
                <p className="text-sm font-bold text-slate-500">{selectedVariant?.name}</p>
              </div>
              <div className="flex flex-wrap gap-4">
                {product.variants.map((variant, index) => (
                  <button
                    key={`${variant.name}-${variant.hexCode}`}
                    type="button"
                    onClick={() => handleVariantSelect(index)}
                    aria-label={`Select color ${variant.name}`}
                    className={cn(
                      "relative h-14 w-14 rounded-full transition-all duration-300 flex items-center justify-center",
                      selectedVariantIndex === index
                        ? "ring-2 ring-offset-4 ring-blue-600 scale-110 shadow-lg shadow-blue-600/20"
                        : "ring-1 ring-gray-200 hover:scale-110 hover:ring-gray-300 hover:shadow-md"
                    )}
                  >
                    <span 
                      className="absolute inset-1.5 rounded-full shadow-inner" 
                      style={{ backgroundColor: variant.hexCode }} 
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Storage / Size Options (Cards) */}
          {selectedVariant && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">
                  {selectedVariant.variantType === "storage" ? "Storage Capacity" : "Size Selection"}
                </p>
                {selectedOption && (
                  <p className="text-sm font-bold text-slate-500">{selectedOption.label}</p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {selectedVariant.options.map((option, index) => (
                  <button
                    key={option.variantId}
                    type="button"
                    onClick={() => handleOptionSelect(index)}
                    className={cn(
                      "relative flex flex-col items-center justify-center rounded-[1.5rem] border-2 p-6 text-center transition-all duration-300",
                      selectedOption?.variantId === option.variantId
                        ? "border-blue-600 bg-blue-50/50 text-blue-900 shadow-[0_10px_30px_-10px_rgba(59,130,246,0.3)]"
                        : "border-gray-100 bg-white text-slate-700 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm"
                    )}
                  >
                    <span className="text-xl font-black tracking-tight">{option.label}</span>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-sm font-bold">{formatPrice(option.price)}</span>
                    </div>
                    {(!option.isAvailable || option.stock <= 0) && (
                      <span className="absolute inset-0 flex items-center justify-center rounded-[1.5rem] bg-white/70 backdrop-blur-[2px] text-sm font-black text-slate-500 uppercase tracking-widest">
                        Sold Out
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Actions */}
          <div className="space-y-6 pt-4 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center">
              {/* Quantity Selector */}
              <div className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-4 rounded-[1.5rem] border border-gray-200 bg-gray-50/50 p-2">
                <button
                  type="button"
                  onClick={decreaseQuantity}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-8 text-center text-lg font-black text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={increaseQuantity}
                  disabled={isOutOfStock || (selectedOption && quantity >= selectedOption.stock)}
                  className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-slate-700 shadow-sm transition-all hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Cart CTA */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "flex-1 relative flex w-full items-center justify-center gap-3 rounded-[1.5rem] h-16 text-lg font-bold transition-all duration-300",
                  isOutOfStock
                    ? "cursor-not-allowed bg-gray-100 text-slate-400"
                    : "bg-blue-600 text-white shadow-[0_20px_40px_-10px_rgba(59,130,246,0.4)] hover:bg-blue-700 hover:shadow-[0_20px_40px_-5px_rgba(59,130,246,0.5)] active:scale-[0.98]"
                )}
              >
                <ShoppingBag className="h-6 w-6" />
                Add to Cart
              </button>
            </div>

            {/* Buy Now CTA */}
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className={cn(
                "w-full flex items-center justify-center gap-3 rounded-[1.5rem] h-16 text-lg font-black transition-all duration-300 border-2",
                isOutOfStock
                  ? "cursor-not-allowed border-gray-100 text-slate-400 bg-gray-50"
                  : "border-slate-900 text-slate-900 bg-white hover:bg-slate-900 hover:text-white hover:shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] active:scale-[0.98]"
              )}
            >
              <Zap className="h-6 w-6" />
              Buy It Now
            </button>
            
            {selectedOption?.stock > 0 && selectedOption?.stock <= 5 && (
               <p className="text-center text-sm font-bold text-amber-600">
                 Hurry! Only {selectedOption.stock} left in stock.
               </p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="max-w-4xl mx-auto mb-24">
        <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-200 gap-8 mb-8">
          {(["description", "specifications", "shipping", "reviews"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-4 text-base font-bold capitalize transition-colors relative whitespace-nowrap",
                activeTab === tab ? "text-slate-900" : "text-slate-400 hover:text-slate-600"
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        <div className="min-h-[200px] animate-in fade-in duration-500">
          {activeTab === "description" && (
             <div className="prose prose-slate prose-lg max-w-none text-slate-600 leading-relaxed font-medium">
               {product.description ? (
                 <p className="whitespace-pre-line">{product.description}</p>
               ) : (
                 <p>No detailed description available.</p>
               )}
             </div>
          )}
          
          {activeTab === "specifications" && (
            <div className="rounded-[2rem] border border-gray-100 bg-gray-50/50 p-8 shadow-sm">
              <ul className="space-y-4 text-slate-600 font-medium">
                <li className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="font-bold text-slate-400">Brand</span>
                  <span className="text-slate-900 font-bold">{product.brand || "N/A"}</span>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="font-bold text-slate-400">Category</span>
                  <span className="text-slate-900 font-bold">{product.category || "N/A"}</span>
                </li>
                <li className="flex justify-between border-b border-gray-200 pb-4">
                  <span className="font-bold text-slate-400">Variants</span>
                  <span className="text-slate-900 font-bold">{product.variants.length} available</span>
                </li>
                <li className="flex justify-between pb-2">
                  <span className="font-bold text-slate-400">Status</span>
                  <span className="text-slate-900 font-bold">{product.status}</span>
                </li>
              </ul>
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="grid sm:grid-cols-3 gap-6">
              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <Truck className="h-6 w-6" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">Free Delivery</h3>
                <p className="text-sm font-medium text-slate-500">On all orders over ₹999. Fast & secure shipping.</p>
              </div>
              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">1 Year Warranty</h3>
                <p className="text-sm font-medium text-slate-500">Official manufacturer warranty included.</p>
              </div>
              <div className="rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm text-center flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                  <RotateCcw className="h-6 w-6" />
                </div>
                <h3 className="font-black text-slate-900 mb-2">30-Day Returns</h3>
                <p className="text-sm font-medium text-slate-500">No questions asked return policy.</p>
              </div>
            </div>
          )}

          {activeTab === "reviews" && (
            <div className="rounded-[2rem] border border-gray-100 bg-white p-12 text-center shadow-sm">
              <Star className="h-12 w-12 text-slate-200 mx-auto mb-4" />
              <h3 className="text-xl font-black text-slate-900 mb-2">Customer Reviews</h3>
              <p className="text-base font-medium text-slate-500">Reviews will be available soon.</p>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-100 pt-16">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-black tracking-tight text-slate-900">You Might Also Like</h2>
            <Link href="/products" className="hidden sm:flex items-center gap-2 text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
