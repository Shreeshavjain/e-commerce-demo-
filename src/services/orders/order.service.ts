import crypto from "node:crypto";
import { Types } from "mongoose";
import { connectToDatabase } from "@/database/mongoose";
import { OrderModel } from "@/models/order";
import { ProductModel } from "@/models/product";
import {
  createRazorpayOrder,
  verifyRazorpaySignature,
} from "@/services/razorpay";
import type { CheckoutCartItem, RecalculatedCart, RecalculatedLineItem } from "@/types/order";
import type { CreateOrderInput, VerifyPaymentInput } from "@/validations/order";
import type { Address } from "@/models/shared";

// ─── Idempotency ─────────────────────────────────────────────────────
// Hash of userId + sorted cart items to detect duplicate order submissions.
// Two identical carts from the same user within the same time window produce
// the same key, so the second request short-circuits with the existing order.

async function generateIdempotencyKey(userId: string, items: CheckoutCartItem[]): Promise<string> {
  const sorted = [...items]
    .sort((a, b) => `${a.productId}:${a.variantId}`.localeCompare(`${b.productId}:${b.variantId}`))
    .map((item) => `${item.productId}:${item.variantId}:${item.quantity}`)
    .join("|");

  // A 5-minute window groups rapid retries under the same key.
  const timeWindow = Math.floor(Date.now() / (5 * 60 * 1000));

  // Include the count of completed (non-pending) orders. 
  // This automatically shifts the key after a successful payment, 
  // allowing the user to purchase the same cart again immediately.
  const completedOrdersCount = await OrderModel.countDocuments({ 
    user: userId, 
    paymentStatus: { $ne: "pending" } 
  });

  const raw = `${userId}|${sorted}|${timeWindow}|${completedOrdersCount}`;

  return crypto.createHash("sha256").update(raw).digest("hex");
}

// ─── Price recalculation ─────────────────────────────────────────────
// NEVER trust frontend prices. Fetch each product + variant from MongoDB
// and recompute unit prices and line totals from the canonical source.

export async function recalculateCartFromDb(
  items: CheckoutCartItem[]
): Promise<RecalculatedCart> {
  await connectToDatabase();

  // Batch-fetch all referenced products in a single query.
  const productIds = [...new Set(items.map((item) => item.productId))];
  const products = await ProductModel.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  const recalculatedItems: RecalculatedLineItem[] = [];

  for (const cartItem of items) {
    const product = productMap.get(cartItem.productId);

    if (!product) {
      throw new Error(`Product not found: ${cartItem.productId}`);
    }

    if (!product.isPublished || product.status !== "active") {
      throw new Error(`Product "${product.title}" is no longer available`);
    }

    // Walk through all color variants to find the matching option by variantId.
    let matchedOption: { price: number; stock: number; isAvailable: boolean; label: string } | null = null;
    let matchedColor = "";

    for (const colorVariant of product.variants) {
      for (const option of colorVariant.options) {
        if (option.variantId === cartItem.variantId) {
          matchedOption = option;
          matchedColor = colorVariant.name;
          break;
        }
      }
      if (matchedOption) break;
    }

    if (!matchedOption) {
      throw new Error(`Variant "${cartItem.variantId}" not found for product "${product.title}"`);
    }

    if (!matchedOption.isAvailable) {
      throw new Error(`Variant "${matchedOption.label}" of "${product.title}" is currently unavailable`);
    }

    if (matchedOption.stock < cartItem.quantity) {
      throw new Error(
        `Insufficient stock for "${product.title}" (${matchedOption.label}). Available: ${matchedOption.stock}, requested: ${cartItem.quantity}`
      );
    }

    const unitPrice = matchedOption.price;
    const lineTotal = Number((unitPrice * cartItem.quantity).toFixed(2));

    // Resolve the best product image for the order snapshot.
    const productImage =
      product.thumbnail?.url ??
      product.variants.flatMap((v) => v.images).find((img) => img.isPrimary)?.url ??
      product.variants[0]?.images[0]?.url ??
      "";

    recalculatedItems.push({
      product: cartItem.productId,
      productName: product.title,
      productImage,
      variantId: cartItem.variantId,
      size: matchedOption.label,
      color: matchedColor,
      quantity: cartItem.quantity,
      unitPrice,
      lineTotal,
    });
  }

  const subtotal = Number(
    recalculatedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)
  );

  // Shipping and tax are zero for now — plug in calculation functions here later.
  const totalAmount = subtotal;

  return { items: recalculatedItems, subtotal, totalAmount };
}

// ─── Create order ────────────────────────────────────────────────────
// Recalculates prices, creates a Razorpay order, and persists a pending
// Order document in MongoDB. Returns the data the frontend needs to open
// the Razorpay checkout modal.

export async function createOrder(
  input: CreateOrderInput,
  userId: string
) {
  await connectToDatabase();

  const cart = await recalculateCartFromDb(input.items);

  if (cart.items.length === 0) {
    throw new Error("Cart is empty after validation");
  }

  // ── Idempotency check ──────────────────────────────────────────────
  const idempotencyKey = await generateIdempotencyKey(userId, input.items);
  const existingOrder = await OrderModel.findOne({
    idempotencyKey,
    user: userId,
    paymentStatus: "pending",
  });

  if (existingOrder) {
    // Return the existing pending order instead of creating a duplicate.
    return {
      razorpayOrderId: existingOrder.razorpayOrderId,
      amount: existingOrder.totalAmount,
      currency: "INR",
      orderId: existingOrder._id.toString(),
    };
  }

  // ── Razorpay order ─────────────────────────────────────────────────
  // Amount must be in paise (₹100 = 10000 paise).
  const amountInPaise = Math.round(cart.totalAmount * 100);

  const razorpayOrder = await createRazorpayOrder({
    amount: amountInPaise,
    receipt: `order_${Date.now()}`,
    notes: { userId },
  });

  // ── Map shipping address to the schema shape ───────────────────────
  const shippingAddress: Address = {
    fullName: input.shippingAddress.fullName,
    phoneNumber: input.shippingAddress.phoneNumber,
    line1: input.shippingAddress.line1,
    line2: input.shippingAddress.line2 ?? "",
    city: input.shippingAddress.city,
    state: input.shippingAddress.state,
    postalCode: input.shippingAddress.postalCode,
    country: input.shippingAddress.country ?? "India",
    landmark: input.shippingAddress.landmark ?? "",
  };

  // ── Persist the pending order ──────────────────────────────────────
  const order = await OrderModel.create({
    user: userId,
    items: cart.items.map((item) => ({
      ...item,
      product: new Types.ObjectId(item.product),
    })),
    shippingAddress,
    paymentMethod: "razorpay",
    paymentStatus: "pending",
    idempotencyKey,
    razorpayOrderId: razorpayOrder.id,
    subtotal: cart.subtotal,
    totalAmount: cart.totalAmount,
    notes: input.notes ?? "",
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: cart.totalAmount,
    currency: "INR",
    orderId: order._id.toString(),
  };
}

// ─── Verify & fulfill payment ────────────────────────────────────────
// Called after the Razorpay checkout modal returns a successful payment.
// 1. Verify the HMAC SHA-256 signature
// 2. Find the pending order
// 3. Mark as paid
// 4. Deduct inventory atomically

export async function verifyAndFulfillPayment(
  input: VerifyPaymentInput,
  userId: string
) {
  // ── Signature verification ─────────────────────────────────────────
  const isValid = verifyRazorpaySignature({
    orderId: input.razorpayOrderId,
    paymentId: input.razorpayPaymentId,
    signature: input.razorpaySignature,
  });

  if (!isValid) {
    throw new Error("Payment signature verification failed — possible tampering detected");
  }

  await connectToDatabase();

  // ── Find and update the pending order atomically ───────────────────
  // The combination of razorpayOrderId + user + pending status ensures
  // we only fulfill orders that belong to this user and haven't been paid yet.
  const order = await OrderModel.findOneAndUpdate(
    {
      razorpayOrderId: input.razorpayOrderId,
      user: userId,
      paymentStatus: "pending",
    },
    {
      $set: {
        razorpayPaymentId: input.razorpayPaymentId,
        razorpaySignature: input.razorpaySignature,
        paymentStatus: "paid",
        status: "confirmed",
        paidAt: new Date(),
      },
    },
    { new: true }
  );

  if (!order) {
    throw new Error("Order not found or already processed");
  }

  // ── Deduct inventory ───────────────────────────────────────────────
  await deductInventory(order.items);

  return {
    orderId: order._id.toString(),
    message: "Payment verified and order confirmed",
  };
}

// ─── Inventory deduction ─────────────────────────────────────────────
// Uses bulkWrite to atomically decrement stock for each purchased variant.
// If stock reaches zero, the variant is marked as unavailable.

async function deductInventory(
  items: Array<{ product: unknown; quantity: number; size: string; color: string }>
) {
  const bulkOps = items.map((item) => ({
    updateOne: {
      // Match the specific product and variant option by the product ID and option label + color.
      filter: {
        _id: item.product,
        "variants.name": item.color,
        "variants.options.label": item.size,
      },
      update: {
        $inc: { "variants.$[colorVar].options.$[opt].stock": -item.quantity },
      },
      arrayFilters: [
        { "colorVar.name": item.color },
        { "opt.label": item.size, "opt.stock": { $gte: item.quantity } },
      ],
    },
  }));

  const result = await ProductModel.bulkWrite(bulkOps);

  if (result.modifiedCount !== items.length) {
    // Some items could not be decremented — possibly a race condition.
    // In production, this should trigger an alert for manual review.
    console.error(
      `Inventory deduction mismatch: expected ${items.length} modifications, got ${result.modifiedCount}`
    );
  }

  // Mark variants as unavailable if stock hit zero.
  await ProductModel.updateMany(
    { "variants.options.stock": { $lte: 0 }, "variants.options.isAvailable": true },
    { $set: { "variants.$[].options.$[opt].isAvailable": false } },
    { arrayFilters: [{ "opt.stock": { $lte: 0 } }] }
  );
}
