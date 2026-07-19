import { z } from "zod";
import { orderStatuses, paymentStatuses } from "@/models/constants";

const adminManageableOrderStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] as const;

export const adminOrderStatusSchema = z.enum(orderStatuses);
export const adminPaymentStatusSchema = z.enum(paymentStatuses);
export const adminManageableOrderStatusSchema = z.enum(adminManageableOrderStatuses);

const dateInputSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .optional();

export const adminOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(120).optional(),
    sortBy: z.enum(["createdAt", "totalAmount", "status", "paymentStatus"]).default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    status: z.union([adminOrderStatusSchema, z.literal("all")]).optional(),
    paymentStatus: z.union([adminPaymentStatusSchema, z.literal("all")]).optional(),
    fromDate: dateInputSchema,
    toDate: dateInputSchema,
  })
  .superRefine((value, ctx) => {
    if (value.fromDate && value.toDate && value.fromDate > value.toDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "fromDate cannot be greater than toDate",
        path: ["fromDate"],
      });
    }
  });

export const adminUpdateOrderStatusSchema = z.object({
  status: adminManageableOrderStatusSchema,
});

export type AdminOrderListQueryInput = z.infer<typeof adminOrderListQuerySchema>;
export type AdminManageableOrderStatus = z.infer<typeof adminManageableOrderStatusSchema>;
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;
