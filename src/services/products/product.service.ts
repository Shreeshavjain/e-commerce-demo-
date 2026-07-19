import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { ProductModel, type ProductDbRecord, type ProductDocument } from "@/models/product";
import { CategoryModel } from "@/models/category";
import type { ProductStatus } from "@/models/constants";
import type { Product, ProductListFilters, ProductListResult, ProductColorVariant, ProductMedia, ProductVariantOption, ProductSeo } from "@/types/product";
import type { ProductColorVariantInput, ProductCreateInput, ProductMediaInput, ProductVariantOptionInput, ProductSeoInput } from "@/validations/product";
import { calculateDiscountedPrice } from "@/server/utils/pricing";
import {
  buildVariantSku,
  createVariantId,
  createVariantSkuSuffix,
  isVariantAvailable,
  normalizeVariantIdentity,
  normalizeVariantSku,
} from "@/services/products/variant.helpers";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeText(value: string) {
  return value.trim();
}

function normalizeMedia(media: ProductMediaInput): ProductMedia {
  return {
    url: normalizeText(media.url),
    publicId: normalizeText(media.publicId),
    altText: normalizeText(media.altText ?? ""),
    isPrimary: Boolean(media.isPrimary),
  };
}

function normalizeSeo(seo: ProductSeoInput): ProductSeo {
  return {
    metaTitle: normalizeText(seo.metaTitle ?? ""),
    metaDescription: normalizeText(seo.metaDescription ?? ""),
    keywords: seo.keywords.map(normalizeText).filter(Boolean),
    canonicalSlug: normalizeText(seo.canonicalSlug ?? ""),
  };
}

function normalizeThumbnail(thumbnail: ProductMediaInput | null | undefined) {
  return thumbnail ? normalizeMedia(thumbnail) : undefined;
}

type VariantOptionDraft = {
  variantId: string;
  label: string;
  sku: string;
  explicitSku: boolean;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  isAvailable: boolean;
};

type ColorVariantDraft = {
  name: string;
  hexCode: string;
  variantType: "size" | "storage";
  images: ProductMedia[];
  options: VariantOptionDraft[];
};

type NormalizedColorVariantPayload = {
  name: string;
  hexCode: string;
  variantType: "size" | "storage";
  images: ProductMedia[];
  options: Array<Omit<VariantOptionDraft, "explicitSku">>;
};

type SerializedProductRecord = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: string;
  category: Types.ObjectId;
  subCategory: Types.ObjectId | null;
  tags: string[];
  thumbnail?: ProductMedia;
  seo: ProductSeo;
  variants: Array<{
    name: string;
    hexCode: string;
    variantType: "size" | "storage";
    images: ProductMedia[];
    options: Array<{
      variantId: string;
      label: string;
      sku: string;
      price: number;
      compareAtPrice: number | null;
      stock: number;
      isAvailable: boolean;
    }>;
  }>;
  isFeatured: boolean;
  isPublished: boolean;
  status: ProductStatus;
  ratingAverage: number;
  ratingCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

type ProductWritePayload = {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: string;
  category: Types.ObjectId;
  subCategory: Types.ObjectId | null;
  tags: string[];
  thumbnail?: ProductMedia;
  seo: ProductSeo;
  variants: NormalizedColorVariantPayload[];
  isFeatured: boolean;
  isPublished: boolean;
  status: ProductStatus;
  ratingAverage: number;
  ratingCount: number;
  createdBy: Types.ObjectId;
};

function normalizeColorVariantDraft(color: ProductColorVariantInput): ColorVariantDraft {
  return {
    name: normalizeText(color.name),
    hexCode: normalizeText(color.hexCode),
    images: color.images.map(normalizeMedia),
    variantType: color.variantType,
    options: color.options.map((option) => {
      const explicitSku = Boolean(option.sku?.trim());
      const normalizedSku = option.sku ? normalizeVariantSku(option.sku) : "";

      return {
        variantId: normalizeVariantIdentity(option.variantId ?? createVariantId()),
        label: normalizeText(option.label),
        sku: normalizedSku,
        explicitSku,
        price: option.price,
        compareAtPrice: option.compareAtPrice ?? null,
        stock: option.stock ?? 0,
        isAvailable: option.isAvailable ?? isVariantAvailable(option.stock ?? 0),
      };
    }),
  };
}

async function findExistingVariantValues(candidateSkus: string[], candidateVariantIds: string[], excludedProductId?: string) {
  if (candidateSkus.length === 0 && candidateVariantIds.length === 0) {
    return {
      skus: new Set<string>(),
      variantIds: new Set<string>(),
    };
  }

  const queryConditions: Array<Record<string, unknown>> = [];

  if (candidateSkus.length > 0) {
    queryConditions.push({ "variants.options.sku": { $in: candidateSkus } });
  }

  if (candidateVariantIds.length > 0) {
    queryConditions.push({ "variants.options.variantId": { $in: candidateVariantIds } });
  }

  const query = excludedProductId ? { _id: { $ne: new Types.ObjectId(excludedProductId) }, $or: queryConditions } : { $or: queryConditions };

  const products = await ProductModel.find(query, { "variants.options.sku": 1, "variants.options.variantId": 1 }).lean<
    Array<{ variants?: Array<{ options?: Array<{ sku?: string; variantId?: string }> }> }>
  >();

  const skus = new Set<string>();
  const variantIds = new Set<string>();

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      for (const option of variant.options ?? []) {
        if (option.sku) {
          skus.add(option.sku);
        }

        if (option.variantId) {
          variantIds.add(option.variantId);
        }
      }
    }
  }

  return { skus, variantIds };
}

function resolveVariantIdentity(candidateId: string, existingIds: Set<string>, seenIds: Set<string>) {
  let resolvedId = candidateId || createVariantId();

  while (existingIds.has(resolvedId) || seenIds.has(resolvedId)) {
    if (candidateId) {
      throw new Error(`Variant ID already exists: ${resolvedId}`);
    }

    resolvedId = createVariantId();
  }

  seenIds.add(resolvedId);
  return resolvedId;
}

function resolveVariantSku(
  option: VariantOptionDraft,
  context: { productTitle: string; colorName: string; variantType: "size" | "storage" },
  existingSkus: Set<string>,
  seenSkus: Set<string>
) {
  const fallbackSku = buildVariantSku([context.productTitle, context.colorName, context.variantType, option.label]);
  const normalizedBaseSku = normalizeVariantSku(option.sku || fallbackSku);

  if (!normalizedBaseSku) {
    throw new Error(`Unable to generate a SKU for ${context.colorName} / ${option.label}`);
  }

  if (option.explicitSku) {
    if (existingSkus.has(normalizedBaseSku) || seenSkus.has(normalizedBaseSku)) {
      throw new Error(`Duplicate SKU detected: ${normalizedBaseSku}`);
    }

    seenSkus.add(normalizedBaseSku);
    return normalizedBaseSku;
  }

  let resolvedSku = normalizedBaseSku;

  if (existingSkus.has(resolvedSku) || seenSkus.has(resolvedSku)) {
    const suffix = createVariantSkuSuffix(option.variantId);
    resolvedSku = `${normalizedBaseSku}-${suffix}`;
    let attempt = 2;

    while (existingSkus.has(resolvedSku) || seenSkus.has(resolvedSku)) {
      resolvedSku = `${normalizedBaseSku}-${suffix}-${attempt}`;
      attempt += 1;
    }
  }

  seenSkus.add(resolvedSku);
  return resolvedSku;
}

function serializeMedia(media: ProductMedia): ProductMedia {
  return {
    url: media.url,
    publicId: media.publicId,
    altText: media.altText ?? "",
    isPrimary: Boolean(media.isPrimary),
  };
}

function serializeOption(option: SerializedProductRecord["variants"][number]["options"][number]): ProductVariantOption {
  return {
    variantId: option.variantId,
    label: option.label,
    sku: option.sku,
    price: option.price,
    compareAtPrice: option.compareAtPrice ?? null,
    stock: option.stock,
    isAvailable: option.isAvailable,
    discountedPrice: calculateDiscountedPrice(option.price, option.compareAtPrice),
  };
}

function serializeColorVariant(color: SerializedProductRecord["variants"][number]): ProductColorVariant {
  return {
    name: color.name,
    hexCode: color.hexCode,
    images: color.images.map(serializeMedia),
    variantType: color.variantType,
    options: color.options.map(serializeOption),
  };
}

async function normalizeProductPayload(
  input: ProductCreateInput,
  options: { createdBy: string; excludedProductId?: string; currentStatus?: ProductStatus } 
): Promise<ProductWritePayload> {
  const baseSlug = input.slug ? slugify(input.slug) : slugify(input.title);
  const variantDrafts = input.variants.map(normalizeColorVariantDraft);
  const candidateSkus = variantDrafts.flatMap((variant) =>
    variant.options.map((option) => option.sku || buildVariantSku([input.title, variant.name, variant.variantType, option.label]))
  );
  const candidateVariantIds = variantDrafts.flatMap((variant) => variant.options.map((option) => option.variantId));
  const { skus: existingSkus, variantIds: existingVariantIds } = await findExistingVariantValues(candidateSkus, candidateVariantIds, options.excludedProductId);
  const seenSkus = new Set<string>();
  const seenVariantIds = new Set<string>();

  const normalizedPayload: ProductWritePayload = {
    title: normalizeText(input.title),
    slug: baseSlug,
    description: normalizeText(input.description),
    shortDescription: normalizeText(input.shortDescription),
    brand: normalizeText(input.brand),
    category: new Types.ObjectId(input.category),
    subCategory: input.subCategory ? new Types.ObjectId(input.subCategory) : null,
    tags: input.tags.map(normalizeText).filter(Boolean),
    thumbnail: normalizeThumbnail(input.thumbnail),
    seo: normalizeSeo(input.seo),
    variants: variantDrafts.map((variant) => ({
      name: variant.name,
      hexCode: variant.hexCode,
      variantType: variant.variantType,
      images: variant.images,
      options: variant.options.map((option) => ({
        variantId: resolveVariantIdentity(option.variantId, existingVariantIds, seenVariantIds),
        label: option.label,
        sku: resolveVariantSku(option, { productTitle: input.title, colorName: variant.name, variantType: variant.variantType }, existingSkus, seenSkus),
        price: option.price,
        compareAtPrice: option.compareAtPrice,
        stock: option.stock,
        isAvailable: option.isAvailable,
      })),
    })),
    isFeatured: input.isFeatured ?? false,
    isPublished: input.isPublished ?? false,
    status: options.currentStatus === "archived" ? "archived" : input.isPublished ? "active" : "draft",
    ratingAverage: 0,
    ratingCount: 0,
    createdBy: new Types.ObjectId(options.createdBy),
  };

  return normalizedPayload;
}

async function generateUniqueSlug(baseSlug: string, excludedProductId?: string) {
  const normalizedBaseSlug = baseSlug || `product-${Date.now()}`;
  let candidateSlug = normalizedBaseSlug;
  let suffix = 2;

  while (
    await ProductModel.exists(
      excludedProductId ? { slug: candidateSlug, _id: { $ne: new Types.ObjectId(excludedProductId) } } : { slug: candidateSlug }
    )
  ) {
    candidateSlug = `${normalizedBaseSlug}-${suffix}`;
    suffix += 1;
  }

  return candidateSlug;
}

// Serializing in one place keeps the API response stable while the MongoDB schema can evolve independently.
export function serializeProduct(product: ProductDocument): Product {
  const rawProduct = product.toObject({ virtuals: true }) as unknown as SerializedProductRecord;

  return {
    id: rawProduct._id.toString(),
    title: rawProduct.title,
    slug: rawProduct.slug,
    description: rawProduct.description,
    shortDescription: rawProduct.shortDescription,
    brand: rawProduct.brand,
    category: rawProduct.category.toString(),
    subCategory: rawProduct.subCategory ? rawProduct.subCategory.toString() : null,
    tags: rawProduct.tags,
    thumbnail: rawProduct.thumbnail ? serializeMedia(rawProduct.thumbnail) : null,
    seo: {
      metaTitle: rawProduct.seo.metaTitle,
      metaDescription: rawProduct.seo.metaDescription,
      keywords: rawProduct.seo.keywords,
      canonicalSlug: rawProduct.seo.canonicalSlug,
    },
    variants: rawProduct.variants.map(serializeColorVariant),
    isFeatured: rawProduct.isFeatured,
    isPublished: rawProduct.isPublished,
    status: rawProduct.status,
    ratingAverage: rawProduct.ratingAverage,
    ratingCount: rawProduct.ratingCount,
    createdBy: rawProduct.createdBy.toString(),
    createdAt: rawProduct.createdAt.toISOString(),
    updatedAt: rawProduct.updatedAt.toISOString(),
  };
}

export async function createProduct(input: ProductCreateInput, createdBy: string): Promise<Product> {
  await connectToDatabase();

  const normalizedPayload = await normalizeProductPayload(input, { createdBy });
  const slug = await generateUniqueSlug(normalizedPayload.slug as string);

  const product = await ProductModel.create({
    ...normalizedPayload,
    slug,
  });

  return serializeProduct(product);
}

export async function listProducts(filters: ProductListFilters = {}): Promise<ProductListResult> {
  await connectToDatabase();

  return listProductsWithVisibility(filters, { includeArchived: false, defaultPublishedOnly: true });
}

export async function listAdminProducts(filters: ProductListFilters = {}): Promise<ProductListResult> {
  await connectToDatabase();

  return listProductsWithVisibility(filters, { includeArchived: true, defaultPublishedOnly: false });
}

type ListVisibilityOptions = {
  includeArchived: boolean;
  defaultPublishedOnly: boolean;
};

async function listProductsWithVisibility(filters: ProductListFilters, visibility: ListVisibilityOptions): Promise<ProductListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(Math.max(filters.limit ?? 12, 1), 100);
  const skip = (page - 1) * limit;

  const query: Record<string, unknown> & { 
    $or?: Array<Record<string, unknown>>;
    $and?: Array<Record<string, unknown>>;
  } = {};

  if (visibility.defaultPublishedOnly) {
    query.isPublished = filters.isPublished ?? true;
  } else if (typeof filters.isPublished === "boolean") {
    query.isPublished = filters.isPublished;
  }

  if (!visibility.includeArchived) {
    query.status = { $ne: "archived" };
  }

  if (filters.category) {
    let categoryId: Types.ObjectId | null = null;
    
    if (Types.ObjectId.isValid(filters.category)) {
      categoryId = new Types.ObjectId(filters.category);
    } else {
      // It might be a slug from the storefront
      const categoryDoc = await CategoryModel.findOne({ slug: filters.category }, { _id: 1 }).lean();
      if (categoryDoc) {
        categoryId = categoryDoc._id;
      }
    }
    
    if (categoryId) {
      // Find all subcategories for this category
      const childCategories = await CategoryModel.find({ parentCategory: categoryId }, { _id: 1 }).lean();
      const childCategoryIds = childCategories.map(c => c._id);
      
      if (childCategoryIds.length > 0) {
        const allCategoryIds = [categoryId, ...childCategoryIds];
        
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { category: { $in: allCategoryIds } },
            { subCategory: { $in: allCategoryIds } }
          ]
        });
      } else {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { category: categoryId },
            { subCategory: categoryId }
          ]
        });
      }
    } else {
      // If a category was requested by slug but doesn't exist, return no products
      query._id = new Types.ObjectId("000000000000000000000000"); 
    }
  }

  if (filters.subCategory) {
    query.subCategory = new Types.ObjectId(filters.subCategory);
  }

  if (filters.brand) {
    query.brand = new RegExp(filters.brand, "i");
  }

  if (typeof filters.isFeatured === "boolean") {
    query.isFeatured = filters.isFeatured;
  }

  if (filters.search) {
    const escapedSearch = filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    query.$or = [
      { title: new RegExp(escapedSearch, "i") },
      { description: new RegExp(escapedSearch, "i") },
      { shortDescription: new RegExp(escapedSearch, "i") },
      { brand: new RegExp(escapedSearch, "i") },
      { tags: new RegExp(escapedSearch, "i") },
      { slug: new RegExp(escapedSearch, "i") },
      { "variants.name": new RegExp(escapedSearch, "i") },
      { "variants.options.label": new RegExp(escapedSearch, "i") },
    ];
  }

  const sortField = filters.sortBy ?? "createdAt";
  const sortDirection = filters.sortOrder === "asc" ? 1 : -1;

  const [total, products] = await Promise.all([
    ProductModel.countDocuments(query),
    ProductModel.find(query).sort({ [sortField]: sortDirection, _id: -1 }).skip(skip).limit(limit),
  ]);

  return {
    products: products.map(serializeProduct),
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  await connectToDatabase();

  const product = await ProductModel.findById(id);

  return product ? serializeProduct(product) : null;
}

export async function updateProduct(id: string, input: ProductCreateInput): Promise<Product | null> {
  await connectToDatabase();

  const currentProduct = await ProductModel.findById(id);

  if (!currentProduct) {
    return null;
  }

  const normalizedPayload = await normalizeProductPayload(input, {
    createdBy: currentProduct.createdBy.toString(),
    excludedProductId: currentProduct.id,
    currentStatus: currentProduct.status,
  });
  const slug = await generateUniqueSlug(normalizedPayload.slug as string, currentProduct.id);
  const nextStatus: ProductStatus = currentProduct.status === "archived" ? "archived" : normalizedPayload.status;

  currentProduct.set({
    ...normalizedPayload,
    slug,
    status: nextStatus,
    createdBy: currentProduct.createdBy,
    ratingAverage: currentProduct.ratingAverage,
    ratingCount: currentProduct.ratingCount,
  });

  const savedProduct = await currentProduct.save();
  return serializeProduct(savedProduct);
}

export async function publishProduct(id: string): Promise<Product | null> {
  await connectToDatabase();

  const product = await ProductModel.findById(id);

  if (!product) {
    return null;
  }

  product.isPublished = true;
  product.status = "active";

  const savedProduct = await product.save();
  return serializeProduct(savedProduct);
}

export async function unpublishProduct(id: string): Promise<Product | null> {
  await connectToDatabase();

  const product = await ProductModel.findById(id);

  if (!product) {
    return null;
  }

  product.isPublished = false;
  product.status = "draft";

  const savedProduct = await product.save();
  return serializeProduct(savedProduct);
}

export async function archiveProduct(id: string): Promise<Product | null> {
  await connectToDatabase();

  const product = await ProductModel.findById(id);

  if (!product) {
    return null;
  }

  product.status = "archived";
  product.isPublished = false;

  const savedProduct = await product.save();
  return serializeProduct(savedProduct);
}

export async function restoreProduct(id: string): Promise<Product | null> {
  await connectToDatabase();

  const product = await ProductModel.findById(id);

  if (!product) {
    return null;
  }

  product.isPublished = false;
  product.status = "draft";

  const savedProduct = await product.save();
  return serializeProduct(savedProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await connectToDatabase();

  const normalizedSlug = slugify(slug);
  const product = await ProductModel.findOne({ slug: normalizedSlug, isPublished: true, status: "active" });

  return product ? serializeProduct(product) : null;
}