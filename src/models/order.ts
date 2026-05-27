import { Schema, type HydratedDocument, type InferSchemaType } from "mongoose";
import { getModel } from "@/database/model";
import {
  orderStatuses,
  paymentMethods,
  paymentStatuses,
  type OrderStatus,
  type PaymentMethod,
  type PaymentStatus,
} from "@/models/constants";
import { addressSchema, orderItemSchema, type Address, type OrderItem } from "@/models/shared";

const orderSchema = new Schema(
  {
    // Orders belong to a user so we can trace purchase history and customer support actions.
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    items: { type: [orderItemSchema], required: true },
    // Shipping address is stored inside the order so historical checkout data never changes if the user edits their profile.
    shippingAddress: { type: addressSchema, required: true },
    billingAddress: { type: addressSchema, default: null },
    paymentMethod: { type: String, enum: paymentMethods, required: true, default: "razorpay" },
    paymentStatus: { type: String, enum: paymentStatuses, default: "pending" },
    razorpayOrderId: { type: String, default: "", trim: true },
    razorpayPaymentId: { type: String, default: "", trim: true },
    transactionId: { type: String, default: "", trim: true },
    paidAt: { type: Date },
    status: { type: String, enum: orderStatuses, default: "pending" },
    subtotal: { type: Number, required: true, min: 0 },
    discountAmount: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: "", trim: true },
  },
  {
    timestamps: true,
  }
);

export type Order = InferSchemaType<typeof orderSchema> & {
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  shippingAddress: Address;
  billingAddress: Address | null;
  items: OrderItem[];
};

export type OrderDocument = HydratedDocument<Order>;

export const OrderModel = getModel<Order>("Order", orderSchema);