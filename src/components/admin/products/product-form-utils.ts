import type { Product } from "@/types/product";
import type { ProductColorVariantInput, ProductCreateInput, ProductMediaInput, ProductVariantOptionInput } from "@/validations/product";

export type ProductDraft = ProductCreateInput;
export type ProductMediaDraft = {
  url: string;
  publicId: string;
  altText?: string;
  isPrimary?: boolean;
};

export function createDraftVariantId() {
  const randomSegment = globalThis.crypto?.randomUUID?.().replace(/-/g, "").slice(0, 10) ?? Math.random().toString(36).slice(2, 12);
  return `variant_${randomSegment}`;
}

export function slugifyDraftValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function createEmptyOption(): ProductVariantOptionInput {
  return {
    variantId: createDraftVariantId(),
    label: "",
    price: 0,
    compareAtPrice: null,
    stock: 0,
    sku: "",
    isAvailable: true,
  };
}

export function createEmptyColorVariant(): ProductColorVariantInput {
  return {
    name: "",
    hexCode: "#111111",
    images: [],
    variantType: "size",
    options: [createEmptyOption()],
  };
}

export function createEmptyProductDraft(): ProductDraft {
  return {
    title: "",
    slug: "",
    description: "",
    shortDescription: "",
    brand: "",
    category: "",
    subCategory: undefined,
    tags: [],
    thumbnail: null,
    seo: {
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      canonicalSlug: "",
    },
    variants: [createEmptyColorVariant()],
    isFeatured: false,
    isPublished: false,
  };
}

export function tagsToArray(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function arrayToTagsValue(tags: string[]) {
  return tags.join(", ");
}

export function toMediaAltText(productTitle: string, detail: string) {
  return [productTitle, detail].filter(Boolean).join(" - ");
}

export function normalizeMediaArray(value: ProductMediaInput[] | ProductMediaInput | null | undefined) {
  if (!value) {
    return [] as ProductMediaInput[];
  }

  return Array.isArray(value) ? value : [value];
}

export function createProductDraftFromProduct(product: Product): ProductDraft {
  return {
    title: product.title,
    slug: product.slug,
    description: product.description,
    shortDescription: product.shortDescription,
    brand: product.brand,
    category: product.category,
    subCategory: product.subCategory ?? undefined,
    tags: [...product.tags],
    thumbnail: product.thumbnail
      ? {
          url: product.thumbnail.url,
          publicId: product.thumbnail.publicId,
          altText: product.thumbnail.altText,
          isPrimary: product.thumbnail.isPrimary,
        }
      : null,
    seo: {
      metaTitle: product.seo.metaTitle,
      metaDescription: product.seo.metaDescription,
      keywords: [...product.seo.keywords],
      canonicalSlug: product.seo.canonicalSlug,
    },
    variants: product.variants.map((variant) => ({
      name: variant.name,
      hexCode: variant.hexCode,
      variantType: variant.variantType,
      images: variant.images.map((image) => ({
        url: image.url,
        publicId: image.publicId,
        altText: image.altText,
        isPrimary: image.isPrimary,
      })),
      options: variant.options.map((option) => ({
        variantId: option.variantId,
        label: option.label,
        sku: option.sku,
        price: option.price,
        compareAtPrice: option.compareAtPrice,
        stock: option.stock,
        isAvailable: option.isAvailable,
      })),
    })),
    isFeatured: product.isFeatured,
    isPublished: product.isPublished,
  };
}
