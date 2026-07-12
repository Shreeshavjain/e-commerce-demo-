"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { calculateDiscountedPrice } from "@/server/utils/pricing";
import { clearCartStorage, createCartStorage, getCartStorageKey } from "@/lib/cart/storage";
import type { CartItem, CartItemInput, CartState } from "@/types/cart";

function clampQuantity(quantity: number | undefined) {
  if (!Number.isFinite(quantity ?? NaN)) {
    return 1;
  }

  return Math.max(1, Math.floor(quantity as number));
}

function getLineItemKey(productId: string, variantId: string) {
  return `${productId}:${variantId}`;
}

function getLineTotal(unitPrice: number, quantity: number) {
  return Number((unitPrice * quantity).toFixed(2));
}

function toCartItem(item: CartItemInput): CartItem {
  const quantity = clampQuantity(item.quantity);
  const discountedPrice = item.price.discountedPrice ?? calculateDiscountedPrice(item.price.unitPrice, item.price.compareAtPrice);

  return {
    ...item,
    quantity,
    price: {
      ...item.price,
      discountedPrice,
    },
    lineTotal: getLineTotal(item.price.unitPrice, quantity),
  };
}

function normalizeItems(items: CartItem[]) {
  return items.map((item) =>
    toCartItem({
      ...item,
      quantity: item.quantity,
    })
  );
}

function findItemIndex(items: CartItem[], productId: string, variantId: string) {
  return items.findIndex((item) => getLineItemKey(item.productId, item.variantId) === getLineItemKey(productId, variantId));
}

function withUpdatedItem(items: CartItem[], productId: string, variantId: string, updater: (item: CartItem) => CartItem) {
  const itemIndex = findItemIndex(items, productId, variantId);

  if (itemIndex === -1) {
    return items;
  }

  return items.map((item, index) => (index === itemIndex ? updater(item) : item));
}

function addOrMergeItem(items: CartItem[], incomingItem: CartItemInput) {
  const nextItem = toCartItem(incomingItem);
  const existingIndex = findItemIndex(items, nextItem.productId, nextItem.variantId);

  if (existingIndex === -1) {
    return [...items, nextItem];
  }

  return items.map((item, index) =>
    index === existingIndex
      ? toCartItem({
          ...item,
          quantity: item.quantity + nextItem.quantity,
        })
      : item
  );
}

function removeLineItem(items: CartItem[], productId: string, variantId: string) {
  return items.filter((item) => getLineItemKey(item.productId, item.variantId) !== getLineItemKey(productId, variantId));
}

function updateLineItemQuantity(items: CartItem[], productId: string, variantId: string, quantity: number) {
  const nextQuantity = clampQuantity(quantity);

  return withUpdatedItem(items, productId, variantId, (item) =>
    toCartItem({
      ...item,
      quantity: nextQuantity,
    })
  );
}

function getTotalItemsFrom(items: CartItem[]) {
  return items.reduce((total, item) => total + item.quantity, 0);
}

function getSubtotalFrom(items: CartItem[]) {
  return Number(items.reduce((total, item) => total + item.lineTotal, 0).toFixed(2));
}

const initialState = {
  scope: "guest" as const,
  items: normalizeItems([]),
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,
      addItem: (item) => {
        set((state) => ({
          ...state,
          items: addOrMergeItem(state.items, item),
        }));
      },
      removeItem: (productId, variantId) => {
        set((state) => ({
          ...state,
          items: removeLineItem(state.items, productId, variantId),
        }));
      },
      increaseQuantity: (productId, variantId) => {
        set((state) => {
          const currentItem = state.items.find((item) => getLineItemKey(item.productId, item.variantId) === getLineItemKey(productId, variantId));

          if (!currentItem) {
            return state;
          }

          return {
            ...state,
            items: updateLineItemQuantity(state.items, productId, variantId, currentItem.quantity + 1),
          };
        });
      },
      decreaseQuantity: (productId, variantId) => {
        set((state) => {
          const currentItem = state.items.find((item) => getLineItemKey(item.productId, item.variantId) === getLineItemKey(productId, variantId));

          if (!currentItem) {
            return state;
          }

          if (currentItem.quantity <= 1) {
            return {
              ...state,
              items: removeLineItem(state.items, productId, variantId),
            };
          }

          return {
            ...state,
            items: updateLineItemQuantity(state.items, productId, variantId, currentItem.quantity - 1),
          };
        });
      },
      updateQuantity: (productId, variantId, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return {
              ...state,
              items: removeLineItem(state.items, productId, variantId),
            };
          }

          return {
            ...state,
            items: updateLineItemQuantity(state.items, productId, variantId, quantity),
          };
        });
      },
      clearCart: () => {
        set((state) => {
          clearCartStorage(state.scope);

          return {
            ...state,
            items: [],
          };
        });
      },
      getTotalItems: () => getTotalItemsFrom(get().items),
      getSubtotal: () => getSubtotalFrom(get().items),
    }),
    {
      name: getCartStorageKey("guest"),
      storage: createJSONStorage(() => createCartStorage()),
      partialize: (state) => ({
        scope: state.scope,
        items: state.items,
      }),
      version: 1,
      merge: (persistedState, currentState) => {
        const nextState = persistedState as Partial<CartState> | undefined;

        if (!nextState) {
          return currentState;
        }

        return {
          ...currentState,
          scope: nextState.scope ?? currentState.scope,
          items: normalizeItems((nextState.items as CartItem[] | undefined) ?? []),
        };
      },
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return;
        }

        state.items = normalizeItems(state.items);
      },
    }
  )
);