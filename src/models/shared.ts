import { Schema, type InferSchemaType } from "mongoose";

// These shared sub-schemas keep repeated ecommerce structures consistent across models.
// They are embedded where the data is owned by the parent document, which avoids extra collection lookups.

export const imageSchema = new Schema(
  {
    url: { type: String, required: true, trim: true },
    publicId: { type: String, required: true, trim: true },
    altText: { type: String, default: "", trim: true },
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false }
);

export type ImageAsset = InferSchemaType<typeof imageSchema>;

export const colorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    hexCode: { type: String, required: true, trim: true },
  },
  { _id: false }
);

export type ColorOption = InferSchemaType<typeof colorSchema>;

export const addressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    landmark: { type: String, default: "", trim: true },
  },
  { _id: false }
);

export type Address = InferSchemaType<typeof addressSchema>;

export const orderItemSchema = new Schema(
  {
    // The product reference keeps each order connected to the live catalog.
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    // These snapshots preserve the exact item details at the moment of purchase.
    productName: { type: String, required: true, trim: true },
    productImage: { type: String, required: true, trim: true },
    size: { type: String, default: "", trim: true },
    color: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

export type OrderItem = InferSchemaType<typeof orderItemSchema>;