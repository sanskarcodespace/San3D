import type { Product } from "../products/types";
import type { CartItem } from "./types";
export function cartKey(item: CartItem) {
  return JSON.stringify([item.productId, item.variantId, item.personalisation]);
}
/** Browser storage is untrusted. Prices always come from the catalogue. */
export function readCart(raw: string, products: Product[]): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const result: CartItem[] = [];
    for (const value of parsed.slice(0, 100)) {
      if (!value || typeof value !== "object") continue;
      const product = products.find((p) => p.id === value.productId);
      const variant = product?.variants.find((v) => v.id === value.variantId);
      if (!product || !variant) continue;
      const limit =
        variant.availability === "stocked"
          ? Math.min(20, variant.quantity ?? 0)
          : 20;
      if (limit < 1) continue;
      if (!Number.isInteger(value.quantity) || value.quantity < 1) continue;
      const personalisation =
        product.personalizable && typeof value.personalisation === "string"
          ? value.personalisation
              .trim()
              .slice(0, product.personalisationLimit ?? 24)
              .trim()
          : "";
      if (product.personalizable && !personalisation) continue;
      const item: CartItem = {
        productId: product.id,
        variantId: value.variantId,
        quantity: Math.min(value.quantity, limit),
        personalisation,
      };
      const existing = result.find((entry) => cartKey(entry) === cartKey(item));
      if (existing)
        existing.quantity = Math.min(limit, existing.quantity + item.quantity);
      else result.push(item);
    }
    return result;
  } catch {
    return [];
  }
}
export function cartTotal(items: CartItem[], products: Product[]) {
  return items.reduce((sum, item) => {
    const variant = products
      .find((p) => p.id === item.productId)
      ?.variants.find((v) => v.id === item.variantId);
    return sum + (variant?.priceInPaise ?? 0) * item.quantity;
  }, 0);
}
