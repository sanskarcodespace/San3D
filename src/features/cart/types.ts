/** Client-side intent only; revalidate stock and price during checkout. */
export interface CartItem {
  variantId: string;
  quantity: number;
}
