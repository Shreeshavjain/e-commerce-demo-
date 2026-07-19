import { cn } from "@/lib/utils";
import type { PaymentStatus } from "@/models/constants";

type PaymentStatusBadgeProps = {
  status: PaymentStatus;
};

const paymentStatusStyles: Record<PaymentStatus, string> = {
  pending: "border-amber-500/30 bg-amber-500/10 text-amber-700",
  paid: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700",
  failed: "border-rose-500/30 bg-rose-500/10 text-rose-700",
  refunded: "border-zinc-500/30 bg-zinc-500/10 text-zinc-700",
};

export function PaymentStatusBadge({ status }: PaymentStatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold capitalize", paymentStatusStyles[status])}>
      {status}
    </span>
  );
}
