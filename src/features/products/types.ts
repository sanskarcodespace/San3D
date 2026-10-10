/** Initial domain contracts; refine alongside the future database schema. */
export type ProductStatus = "draft" | "active" | "archived";

export interface ProductVariant {
  id: string;
  sku: string;
  material: string;
  color: string;
  /** Integer paise. Calculate authoritative prices on the server. */
  priceInPaise: number;
  stockQuantity: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  status: ProductStatus;
  imageUrls: string[];
  variants: ProductVariant[];
}
