import type { Product, ProductColorVariant } from "@/types/product";

export type ProductImageView = {
  url: string;
  altText: string;
};

export function getPrimaryImage(product: Product) {
  return (
    product.thumbnail?.url ??
    product.variants.flatMap((variant) => variant.images).find((image) => image.isPrimary)?.url ??
    product.variants[0]?.images[0]?.url ??
    null
  );
}

export function getThumbnailFallback(product: Product): ProductImageView | null {
  if (!product.thumbnail?.url) {
    return null;
  }

  return {
    url: product.thumbnail.url,
    altText: product.thumbnail.altText || product.title,
  };
}

export function getVariantImages(variant: ProductColorVariant, productTitle: string, thumbnailFallback?: ProductImageView | null) {
  const images = variant.images.map((image) => ({
    url: image.url,
    altText: image.altText || `${productTitle} ${variant.name}`,
  }));

  if (images.length > 0) {
    return images;
  }

  return thumbnailFallback ? [thumbnailFallback] : [];
}

export function getProductImages(product: Product) {
  const images = new Map<string, ProductImageView>();

  if (product.thumbnail?.url) {
    images.set(product.thumbnail.url, {
      url: product.thumbnail.url,
      altText: product.thumbnail.altText || product.title,
    });
  }

  for (const variant of product.variants) {
    for (const image of variant.images) {
      if (!images.has(image.url)) {
        images.set(image.url, {
          url: image.url,
          altText: image.altText || `${product.title} ${variant.name}`,
        });
      }
    }
  }

  return [...images.values()];
}

export function getProductPriceRange(product: Product) {
  const prices = product.variants
    .flatMap((variant) => variant.options.map((option) => option.price))
    .filter((price) => typeof price === "number");

  if (prices.length === 0) {
    return null;
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  return {
    minPrice,
    maxPrice,
    label: minPrice === maxPrice ? formatPrice(minPrice) : `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`,
  };
}

export function formatPrice(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}
