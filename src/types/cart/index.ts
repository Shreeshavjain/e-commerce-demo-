export type CartScope = "guest" | "user";

export type CartItemId = {
  productId: string;
  variantId: string;
};

export type CartItemImage = {
  url: string;
  altText: string;
};

export type CartItemPrice = {
  unitPrice: number;
  compareAtPrice: number | null;
  discountedPrice: number | null;
};

export type CartItemSnapshot = CartItemId & {
  productSlug: string;
  productTitle: string;
  productBrand: string;
  productImage: CartItemImage | null;
  variantLabel: string;
  variantName: string;
  price: CartItemPrice;
};

export type CartItemInput = CartItemSnapshot & {
  quantity?: number;
};

export type CartItem = CartItemSnapshot & {
  quantity: number;
  lineTotal: number;
};

export type CartTotals = {
  totalItems: number;
  subtotal: number;
};

export type CartHydrationState = {
  scope: CartScope;
  items: CartItem[];
};

export type CartStorageState = {
  version: 1;
  state: CartHydrationState;
};

export type CartState = CartHydrationState & {
  addItem: (item: CartItemInput) => void;
  removeItem: (productId: string, variantId: string) => void;
  increaseQuantity: (productId: string, variantId: string) => void;
  decreaseQuantity: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getSubtotal: () => number;
};