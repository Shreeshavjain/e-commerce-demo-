import { Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import { getModel } from "@/database/model";
import { reviewStatuses, type ReviewStatus } from "@/models/constants";

const reviewSchema = new Schema(
  {
    // Reviews connect the customer to the product, and the product can aggregate them for rating summaries.
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: "", trim: true },
    comment: { type: String, required: true, trim: true },
    isVerifiedPurchase: { type: Boolean, default: false },
    status: { type: String, enum: reviewStatuses, default: "pending" },
    helpfulVotes: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
  }
);

reviewSchema.index({ product: 1, user: 1 }, { unique: true });

export type Review = InferSchemaType<typeof reviewSchema> & {
  status: ReviewStatus;
};

export type ReviewDocument = HydratedDocument<Review>;

export const ReviewModel = getModel<Review>("Review", reviewSchema);