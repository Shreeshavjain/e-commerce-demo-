import type { ProductStatus } from "@/models/constants";

export type ProductMedia = {
  url: string;
  publicId: string;
  altText: string;
  isPrimary: boolean;
};

export type ProductVariantOption = {
  variantId: string;
  label: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isAvailable: boolean;
  discountedPrice: number | null;
};

export type ProductSeo = {
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  canonicalSlug: string;
};

export type ProductColorVariant = {
  name: string;
  hexCode: string;
  variantType: "size" | "storage";
  images: ProductMedia[];
  options: ProductVariantOption[];
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: string;
  category: string;
  subCategory: string | null;
  tags: string[];
  thumbnail: ProductMedia | null;
  seo: ProductSeo;
  variants: ProductColorVariant[];
  isFeatured: boolean;
  isPublished: boolean;
  status: ProductStatus;
  ratingAverage: number;
  ratingCount: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export type ProductListFilters = {
  search?: string;
  category?: string;
  subCategory?: string;
  brand?: string;
  isPublished?: boolean;
  isFeatured?: boolean;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "ratingAverage" | "title";
  sortOrder?: "asc" | "desc";
};

export type ProductListResult = {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};