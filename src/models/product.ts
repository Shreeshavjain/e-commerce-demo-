import { Schema, Types, type HydratedDocument, type InferSchemaType } from "mongoose";
import { getModel } from "@/database/model";
import { imageSchema, type ImageAsset } from "@/models/shared";
import { calculateDiscountedPrice } from "@/server/utils/pricing";

const productVariantOptionSchema = new Schema(
  {
    variantId: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true, uppercase: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, default: null, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    isAvailable: { type: Boolean, default: true },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const productColorVariantSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hexCode: { type: String, required: true, trim: true },
    variantType: { type: String, enum: ["size", "storage"], default: "size" },
    images: { type: [imageSchema], default: [] },
    options: { type: [productVariantOptionSchema], default: [] },
  },
  {
    _id: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

const productSeoSchema = new Schema(
  {
    metaTitle: { type: String, default: "", trim: true },
    metaDescription: { type: String, default: "", trim: true },
    keywords: { type: [String], default: [] },
    canonicalSlug: { type: String, default: "", trim: true },
  },
  { _id: false }
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, required: true, trim: true },
    shortDescription: { type: String, required: true, trim: true },
    brand: { type: String, default: "", trim: true, index: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true, index: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    tags: { type: [String], default: [], index: true },
    thumbnail: { type: imageSchema, default: undefined },
    seo: { type: productSeoSchema, default: {} },
    variants: { type: [productColorVariantSchema], default: [] },
    isFeatured: { type: Boolean, default: false, index: true },
    isPublished: { type: Boolean, default: false, index: true },
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Product search benefits from a focused set of indexes instead of one oversized index.
productSchema.index({ title: "text", description: "text", shortDescription: "text", tags: "text", brand: "text", "variants.name": "text", "variants.options.label": "text", "variants.options.sku": "text" });
productSchema.index({ category: 1, subCategory: 1, isPublished: 1, isFeatured: 1, createdAt: -1 });
productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ "variants.options.variantId": 1 }, { unique: true, sparse: true });
productSchema.index({ "variants.options.sku": 1 }, { unique: true, sparse: true });
productSchema.index({ "variants.options.isAvailable": 1, isPublished: 1, category: 1 });

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

export type ProductColorVariant = {
  name: string;
  hexCode: string;
  variantType: "size" | "storage";
  images: ImageAsset[];
  options: ProductVariantOption[];
};

export type ProductSeo = InferSchemaType<typeof productSeoSchema>;

export type ProductDbRecord = {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  brand: string;
  category: Types.ObjectId;
  subCategory: Types.ObjectId | null;
  tags: string[];
  thumbnail?: ImageAsset;
  seo: ProductSeo;
  variants: ProductColorVariant[];
  isFeatured: boolean;
  isPublished: boolean;
  ratingAverage: number;
  ratingCount: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ProductDocument = HydratedDocument<ProductDbRecord>;

productVariantOptionSchema.virtual("discountedPrice").get(function discountedPrice(this: ProductVariantOption) {
  return calculateDiscountedPrice(this.price, this.compareAtPrice);
});

export const ProductModel = getModel<ProductDbRecord>("Product", productSchema);