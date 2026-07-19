"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { adminAllowedStatusTargets, type AdminOrderDetail } from "@/types/order";
import type { OrderStatus } from "@/models/constants";

type AdminOrderStatusControlsProps = {
  orderId: string;
  currentStatus: OrderStatus;
  onUpdated?: (order: AdminOrderDetail) => void;
};

type UpdateOrderStatusResponse = {
  success: boolean;
  message: string;
  data?: {
    order: AdminOrderDetail;
    previousStatus: OrderStatus;
  };
  error?: string;
};

export function AdminOrderStatusControls({ orderId, currentStatus, onUpdated }: AdminOrderStatusControlsProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(currentStatus);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTransitions = useMemo(() => {
    const nextStatuses = adminAllowedStatusTargets[currentStatus] ?? [];
    return [currentStatus, ...nextStatuses];
  }, [currentStatus]);

  const canSubmit = !isSubmitting && selectedStatus !== currentStatus;

  async function handleUpdate() {
    if (!canSubmit) {
      return;
    }

    if (typeof window !== "undefined") {
      const approved = window.confirm(`Update order status from ${currentStatus} to ${selectedStatus}?`);
      if (!approved) {
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const payload = (await response.json().catch(() => null)) as UpdateOrderStatusResponse | null;

      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error ?? payload?.message ?? "Unable to update order status");
      }

      toast.success(payload.message || "Order status updated");
      onUpdated?.(payload.data.order);
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update order status";
      toast.error(message);
      setSelectedStatus(currentStatus);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-background/80 p-4 sm:flex-row sm:items-center">
      <label className="text-sm font-medium text-foreground" htmlFor="admin-order-status">
        Update status
      </label>
      <select
        id="admin-order-status"
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value as OrderStatus)}
        disabled={isSubmitting}
        className="rounded-full border border-border bg-card px-4 py-2 text-sm capitalize text-foreground outline-none focus:ring-2 focus:ring-ring"
      >
        {availableTransitions.map((status) => (
          <option key={status} value={status} className="capitalize">
            {status}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={handleUpdate}
        disabled={!canSubmit}
        className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Confirm Update"}
      </button>
    </div>
  );
}
