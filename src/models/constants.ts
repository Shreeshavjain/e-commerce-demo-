export const userRoles = ["customer", "staff", "admin", "super_admin"] as const;
export type UserRole = (typeof userRoles)[number];

export const authProviders = ["google", "otp"] as const;
export type AuthProvider = (typeof authProviders)[number];

export const categoryStatuses = ["active", "inactive"] as const;
export type CategoryStatus = (typeof categoryStatuses)[number];

export const productStatuses = ["draft", "active", "archived"] as const;
export type ProductStatus = (typeof productStatuses)[number];

export const reviewStatuses = ["pending", "published", "hidden"] as const;
export type ReviewStatus = (typeof reviewStatuses)[number];

export const orderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"] as const;
export type OrderStatus = (typeof orderStatuses)[number];

export const paymentMethods = ["razorpay", "cod"] as const;
export type PaymentMethod = (typeof paymentMethods)[number];

export const paymentStatuses = ["pending", "paid", "failed", "refunded"] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];