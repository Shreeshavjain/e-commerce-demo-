import { z } from "zod";

// ─── Checkout cart item ──────────────────────────────────────────────
// Only IDs and quantity are accepted — the server fetches prices from MongoDB.

const checkoutCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1").max(10, "Maximum 10 per item"),
});

// ─── Shipping address ────────────────────────────────────────────────

const checkoutShippingAddressSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters").max(100).trim(),
  phoneNumber: z
    .string()
    .min(10, "Phone number is required")
    .max(15)
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian phone number")
    .trim(),
  line1: z.string().min(1, "Address line 1 is required").max(200).trim(),
  line2: z.string().max(200).trim().optional().default(""),
  city: z.string().min(2, "City is required").max(100).trim(),
  state: z.string().min(2, "State is required").max(100).trim(),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, "Enter a valid 6-digit pincode")
    .trim(),
  country: z.string().min(2).max(100).trim().optional().default("India"),
  landmark: z.string().max(200).trim().optional().default(""),
});

// ─── Create order schema ─────────────────────────────────────────────

export const createOrderSchema = z.object({
  items: z
    .array(checkoutCartItemSchema)
    .min(1, "Cart must have at least one item")
    .max(50, "Cart cannot exceed 50 items"),
  shippingAddress: checkoutShippingAddressSchema,
  notes: z.string().max(500).trim().optional().default(""),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

// ─── Verify payment schema ──────────────────────────────────────────

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "Razorpay order ID is required"),
  razorpayPaymentId: z.string().min(1, "Razorpay payment ID is required"),
  razorpaySignature: z.string().min(1, "Razorpay signature is required"),
});

export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>;
