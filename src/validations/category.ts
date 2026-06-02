import { z } from "zod";

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

export const categoryCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z.string().trim().min(1, "Slug is required").max(160),
  description: optionalString.default(""),
  image: optionalString.url("Image URL must be valid").optional(),
  parentCategory: optionalObjectIdString.nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const categoryUpdateSchema = categoryCreateSchema
  .partial()
  .extend({
    parentCategory: optionalObjectIdString.nullable().optional(),
  });

export type CategoryCreateInput = z.infer<typeof categoryCreateSchema>;
export type CategoryUpdateInput = z.infer<typeof categoryUpdateSchema>;
