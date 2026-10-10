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
      if (!product || !product.variants.some((v) => v.id === value.variantId))
        continue;
      if (!Number.isInteger(value.quantity) || value.quantity < 1) continue;
      const personalisation =
        product.personalizable && typeof value.personalisation === "string"
          ? value.personalisation.trim().slice(0, 24)
          : "";
      if (product.personalizable && !personalisation) continue;
      const item: CartItem = {
        productId: product.id,
        variantId: value.variantId,
        quantity: Math.min(value.quantity, 20),
        personalisation,
      };
      const existing = result.find((entry) => cartKey(entry) === cartKey(item));
      if (existing)
        existing.quantity = Math.min(20, existing.quantity + item.quantity);
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
