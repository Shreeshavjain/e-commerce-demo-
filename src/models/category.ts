import { Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import { getModel } from "@/database/model";
import { categoryStatuses, type CategoryStatus } from "@/models/constants";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "", trim: true },
    // Parent category enables nested ecommerce navigation like Men > Shoes > Sneakers.
    parentCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    isActive: { type: Boolean, default: true },
    status: { type: String, enum: categoryStatuses, default: "active" },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export type Category = InferSchemaType<typeof categorySchema> & {
  status: CategoryStatus;
};

export type CategoryDocument = HydratedDocument<Category>;

export const CategoryModel = getModel<Category>("Category", categorySchema);