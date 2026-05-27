// Keep discount math in one place so model virtuals, services, and future APIs all use the same rule.
export function calculateDiscountedPrice(
  originalPrice: number | null | undefined,
  discountPercentage: number | null | undefined
): number | null {
  if (typeof originalPrice !== "number" || Number.isNaN(originalPrice)) {
    return null;
  }

  const discount = typeof discountPercentage === "number" ? discountPercentage : 0;

  if (discount <= 0) {
    return originalPrice;
  }

  return Number((originalPrice - originalPrice * (discount / 100)).toFixed(2));
}

// Frontend code can use this later to avoid rendering discount badges when the discount is zero.
export function hasDiscount(discountPercentage: number | null | undefined): boolean {
  return typeof discountPercentage === "number" && discountPercentage > 0;
}