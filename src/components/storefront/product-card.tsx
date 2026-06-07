import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";
import type { Product } from "@/types/product";
import { getPrimaryImage, getProductPriceRange } from "@/components/storefront/product-display-utils";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const primaryImage = getPrimaryImage(product);
  const priceRange = getProductPriceRange(product);

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-border bg-card/85 shadow-sm shadow-black/5 transition hover:border-primary/30 hover:shadow-md"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {primaryImage ? (
          <Image
            src={primaryImage}
            alt={product.thumbnail?.altText || product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        {product.brand ? <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">{product.brand}</p> : null}
        <h2 className="line-clamp-2 text-base font-semibold text-foreground">{product.title}</h2>
        <p className="mt-auto text-sm font-medium text-foreground">{priceRange?.label ?? "Price unavailable"}</p>
      </div>
    </Link>
  );
}
