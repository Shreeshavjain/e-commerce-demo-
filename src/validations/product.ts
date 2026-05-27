import { z } from "zod";

const productMediaSchema = z.object({
  url: z.string().url("Image URL is required"),
  publicId: z.string().min(1, "Image publicId is required"),
  altText: z.string().trim().default(""),
  isPrimary: z.boolean().default(false),
});

const productVariantOptionSchema = z.object({
  variantId: z.string().trim().min(1).optional(),
  label: z.string().trim().min(1, "Variant label is required"),
  price: z.number().min(0),
  compareAtPrice: z.number().min(0).nullable().optional(),
  stock: z.number().int().min(0).default(0),
  sku: z.string().trim().optional(),
  isAvailable: z.boolean().optional(),
});

const productSeoSchema = z.object({
  metaTitle: z.string().trim().default(""),
  metaDescription: z.string().trim().default(""),
  keywords: z.array(z.string().trim().min(1)).default([]),
  canonicalSlug: z.string().trim().default(""),
});

const productColorVariantSchema = z.object({
  name: z.string().trim().min(1, "Color name is required"),
  hexCode: z.string().trim().min(1, "Color hex code is required"),
  images: z.array(productMediaSchema).min(1, "At least one color image is required"),
  variantType: z.enum(["size", "storage"]).default("size"),
  options: z.array(productVariantOptionSchema).min(1, "At least one size or storage option is required"),
});

const optionalBoolean = z.preprocess((value) => {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}, z.boolean().optional());

const optionalString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, z.string().trim().optional());

const objectIdString = z.string().regex(/^[a-fA-F0-9]{24}$/, "A valid MongoDB id is required");
const optionalObjectIdString = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}, objectIdString.optional());

export const productCreateSchema = z
  .object({
    title: z.string().trim().min(3, "Title is required").max(180),
    slug: optionalString.pipe(z.string().trim().min(3).max(220).optional()),
    description: z.string().trim().min(20, "Description is required"),
    shortDescription: z.string().trim().min(10, "Short description is required").max(260),
    brand: z.string().trim().min(1, "Brand is required"),
    category: objectIdString,
    subCategory: optionalObjectIdString.nullable().optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    thumbnail: productMediaSchema.nullable().optional(),
    seo: productSeoSchema.default({
      metaTitle: "",
      metaDescription: "",
      keywords: [],
      canonicalSlug: "",
    }),
    variants: z.array(productColorVariantSchema).min(1, "At least one color variant is required"),
    isFeatured: z.boolean().default(false),
    isPublished: z.boolean().default(false),
  })
  .superRefine((value, context) => {
    value.variants.forEach((variant, variantIndex) => {
      variant.options.forEach((option, optionIndex) => {
        if (option.compareAtPrice !== undefined && option.compareAtPrice !== null && option.compareAtPrice < option.price) {
          context.addIssue({
            code: "custom",
            path: ["variants", variantIndex, "options", optionIndex, "compareAtPrice"],
            message: "Compare-at price should be greater than or equal to the sellable option price",
          });
        }
      });
    });
  });

export const productListQuerySchema = z.object({
  search: optionalString,
  category: optionalObjectIdString,
  subCategory: optionalObjectIdString,
  brand: optionalString,
  isPublished: optionalBoolean,
  isFeatured: optionalBoolean,
  page: z.coerce.number().int().min(1).default(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(12).optional(),
  sortBy: z.enum(["createdAt", "ratingAverage", "title"]).default("createdAt").optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc").optional(),
});

export type ProductCreateInput = z.infer<typeof productCreateSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type ProductMediaInput = z.infer<typeof productMediaSchema>;
export type ProductVariantOptionInput = z.infer<typeof productVariantOptionSchema>;
export type ProductColorVariantInput = z.infer<typeof productColorVariantSchema>;
export type ProductSeoInput = z.infer<typeof productSeoSchema>;

export { productMediaSchema, productVariantOptionSchema, productColorVariantSchema, productSeoSchema };