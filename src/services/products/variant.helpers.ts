import { randomUUID } from "crypto";

const NON_SKU_CHARS = /[^A-Z0-9-]/g;
const MULTI_HYPHENS = /-{2,}/g;
const WORD_SEPARATORS = /[\s_./]+/g;

// Variant IDs are generated server-side and never exposed as mutable business fields.
// That makes them safe to use later as cart, checkout, analytics, and order-snapshot identifiers.
export function createVariantId() {
  return `variant_${randomUUID().replace(/-/g, "")}`;
}

// SKU normalization keeps human-entered codes consistent before uniqueness checks run.
export function normalizeVariantSku(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/["'’]/g, "")
    .replace(WORD_SEPARATORS, "-")
    .replace(NON_SKU_CHARS, "")
    .replace(MULTI_HYPHENS, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildVariantSku(parts: string[]) {
  return normalizeVariantSku(parts.filter(Boolean).join("-"));
}

export function normalizeVariantIdentity(value: string) {
  return value.trim();
}

export function createVariantSkuSuffix(variantId: string) {
  return variantId.replace(/^variant[_-]?/i, "").slice(-8).toUpperCase();
}

export function isVariantAvailable(stock: number) {
  return stock > 0;
}