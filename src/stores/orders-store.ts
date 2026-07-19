import { create } from "zustand";
import type {
  OrderSummary,
  OrderDetail,
  OrdersPagination,
  PaginatedOrdersResponse,
} from "@/types/order";
import type { ApiSuccessResponse } from "@/server/utils/api-response";

// ─── State shape ─────────────────────────────────────────────────────

type OrdersStatus = "idle" | "loading" | "error";

type OrdersState = {
  orders: OrderSummary[];
  currentOrder: OrderDetail | null;
  pagination: OrdersPagination;
  listStatus: OrdersStatus;
  detailStatus: OrdersStatus;
  error: string | null;
};

type OrdersActions = {
  fetchOrders: (page?: number) => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  reset: () => void;
};

const initialPagination: OrdersPagination = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 1,
};

const initialState: OrdersState = {
  orders: [],
  currentOrder: null,
  pagination: initialPagination,
  listStatus: "idle",
  detailStatus: "idle",
  error: null,
};

// ─── Store ───────────────────────────────────────────────────────────

export const useOrdersStore = create<OrdersState & OrdersActions>((set, get) => ({
  ...initialState,

  fetchOrders: async (page = 1) => {
    set({ listStatus: "loading", error: null });

    try {
      const limit = get().pagination.limit;
      const res = await fetch(`/api/orders/my-orders?page=${page}&limit=${limit}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        set({
          listStatus: "error",
          error: json.message ?? "Failed to load orders",
        });
        return;
      }

      const data = (json as ApiSuccessResponse<PaginatedOrdersResponse>).data;

      set({
        orders: data.orders,
        pagination: data.pagination,
        listStatus: "idle",
        error: null,
      });
    } catch {
      set({
        listStatus: "error",
        error: "Something went wrong while loading your orders",
      });
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ detailStatus: "loading", error: null, currentOrder: null });

    try {
      const res = await fetch(`/api/orders/my-orders/${orderId}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        set({
          detailStatus: "error",
          error: json.message ?? "Failed to load order details",
        });
        return;
      }

      const data = (json as ApiSuccessResponse<OrderDetail>).data;

      set({
        currentOrder: data,
        detailStatus: "idle",
        error: null,
      });
    } catch {
      set({
        detailStatus: "error",
        error: "Something went wrong while loading order details",
      });
    }
  },

  reset: () => set(initialState),
}));
