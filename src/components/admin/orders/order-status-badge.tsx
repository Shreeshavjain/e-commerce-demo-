import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/models/constants";

type OrderStatusBadgeProps = {
  status: OrderStatus;
};

const orderStatusStyles: Record<OrderStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  confirmed: "border-sky-500/30 bg-sky-500/10 text-sky-700",
  processing: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700",
  shipped: "border-violet-500/30 bg-violet-500/10 text-violet-700",
  delivered: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  cancelled: "border-rose-500/30 bg-rose-500/10 text-rose-700",
  refunded: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700",
};

export function OrderStatusBadge({ status }: OrderStatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize", orderStatusStyles[status])}>
      {status}
    </span>
  );
}
