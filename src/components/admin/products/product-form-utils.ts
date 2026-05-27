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
