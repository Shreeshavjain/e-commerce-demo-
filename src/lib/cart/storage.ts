import type { StateStorage } from "zustand/middleware";
import type { CartHydrationState, CartScope, CartStorageState } from "@/types/cart";

const CART_STORAGE_PREFIX = "ecomerce.cart";
const CART_STORAGE_VERSION = 1;

function getFallbackStorage(): StateStorage {
  return {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  };
}

export function isCartStorageAvailable() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getCartStorageKey(scope: CartScope = "guest") {
  return `${CART_STORAGE_PREFIX}.${scope}.v${CART_STORAGE_VERSION}`;
}

export function createCartStorage(): StateStorage {
  if (!isCartStorageAvailable()) {
    return getFallbackStorage();
  }

  return window.localStorage;
}

export function readCartStorage(scope: CartScope = "guest"): CartHydrationState | null {
  if (!isCartStorageAvailable()) {
    return null;
  }

  try {
    const rawValue = window.localStorage.getItem(getCartStorageKey(scope));

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<CartStorageState> | null;

    if (!parsedValue || parsedValue.version !== CART_STORAGE_VERSION || !parsedValue.state) {
      return null;
    }

    return parsedValue.state;
  } catch {
    return null;
  }
}

export function writeCartStorage(state: CartHydrationState) {
  if (!isCartStorageAvailable()) {
    return;
  }

  const payload: CartStorageState = {
    version: CART_STORAGE_VERSION,
    state,
  };

  window.localStorage.setItem(getCartStorageKey(state.scope), JSON.stringify(payload));
}

export function clearCartStorage(scope: CartScope = "guest") {
  if (!isCartStorageAvailable()) {
    return;
  }

  window.localStorage.removeItem(getCartStorageKey(scope));
}