import Image from "next/image";
import Link from "next/link";
import { ImageIcon, Star, ShoppingBag, Eye } from "lucide-react";
import type { Product } from "@/types/product";
import { getPrimaryImage, getProductPriceRange } from "@/components/storefront/product-display-utils";
import { cn } from "@/lib/utils";

type ProductCardProps = {
  product: Product;
  featured?: boolean;
};

export function ProductCard({ product, featured }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product);
  const priceRange = getProductPriceRange(product);
  
  const hasDiscount = product.variants.some(v => v.options.some(o => o.compareAtPrice && o.compareAtPrice > o.price));
  const isOutOfStock = product.variants.every(v => v.options.every(o => !o.isAvailable || o.stock <= 0));

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col bg-white relative rounded-[2rem] transition-all duration-500 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] hover:-translate-y-1 p-3"
    >
      <div className={cn(
        "relative overflow-hidden rounded-[1.5rem] bg-gray-50/50 aspect-[4/5] mb-5 transition-all duration-500"
      )}>
        {/* Liquid Glass Badges */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
          {hasDiscount && (
            <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur-md border border-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-600 shadow-sm">
              Sale
            </span>
          )}
          {isOutOfStock && (
            <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur-md border border-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 shadow-sm">
              Sold Out
            </span>
          )}
          {featured && (
            <span className="inline-flex items-center rounded-full bg-white/80 backdrop-blur-md border border-white/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-900 shadow-sm">
              Featured
            </span>
          )}
        </div>

        {/* Rating Glass Badge */}
        <div className="absolute top-3 right-3 z-20">
          <div className="flex items-center gap-1 bg-white/80 backdrop-blur-md border border-white/60 px-2 py-1.5 rounded-full shadow-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-700">{product.ratingAverage > 0 ? product.ratingAverage.toFixed(1) : "5.0"}</span>
          </div>
        </div>

        {/* Image */}
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.thumbnail?.altText || product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-200">
            <ImageIcon className="h-10 w-10" />
          </div>
        )}
        
        {/* Quick View Liquid Glass Overlay (Desktop only) */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-all duration-500 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 hidden md:block z-20">
          <div className="flex items-center justify-center gap-2 rounded-full bg-white/90 backdrop-blur-lg border border-white/50 px-4 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-black/5 hover:bg-blue-600 hover:text-white hover:border-blue-500 transition-colors">
            <Eye className="h-4 w-4" />
            Quick View
          </div>
        </div>
        
        {/* Mobile Quick Action Glass Button */}
        <div className="absolute bottom-3 right-3 md:hidden z-20">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 backdrop-blur-md border border-white/50 shadow-md text-slate-900">
            <ShoppingBag className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-2 pb-1">
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {product.brand ? (
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 truncate">
              {product.brand}
            </p>
          ) : <div />}
        </div>
        
        <h2 className="line-clamp-2 text-base font-bold text-slate-900 leading-[1.3] group-hover:text-blue-600 transition-colors">
          {product.title}
        </h2>
        
        <div className="mt-3 flex items-center gap-2">
          <p className="text-base font-black text-slate-900">
            {priceRange?.label ?? "Price unavailable"}
          </p>
          {hasDiscount && priceRange && (
            <p className="text-xs font-semibold text-slate-400 line-through">
              {product.variants[0]?.options[0]?.compareAtPrice ? 
                new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(product.variants[0].options[0].compareAtPrice)
                : null
              }
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
