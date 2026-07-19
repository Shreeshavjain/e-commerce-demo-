"use client";

import { useShallow } from "zustand/react/shallow";
import { useOrdersStore } from "@/stores/orders-store";

export function useOrdersState() {
  return useOrdersStore(
    useShallow((state) => ({
      orders: state.orders,
      pagination: state.pagination,
      listStatus: state.listStatus,
      error: state.error,
    }))
  );
}

export function useOrderDetailState() {
  return useOrdersStore(
    useShallow((state) => ({
      currentOrder: state.currentOrder,
      detailStatus: state.detailStatus,
      error: state.error,
    }))
  );
}

export function useOrdersActions() {
  return useOrdersStore(
    useShallow((state) => ({
      fetchOrders: state.fetchOrders,
      fetchOrderById: state.fetchOrderById,
      reset: state.reset,
    }))
  );
}
