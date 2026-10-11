export interface Category {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
  imageAlt?: string;
}
export interface ProductVariant {
  id: string;
  name: string;
  color: string;
  priceInPaise: number;
  compareAtPriceInPaise?: number;
  material?: string;
  size?: string;
  availability?: "stocked" | "made_to_order";
  quantity?: number;
}
/** Storefront read model. Map database rows to this contract in the repository. */
export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  category: string;
  image: string;
  imageAlt: string;
  material: string;
  dimensions: string;
  variants: ProductVariant[];
  personalizable?: boolean;
  featured?: boolean;
  badge?: string;
  isDemo: boolean;
  images?: ProductImage[];
  personalisationLimit?: number;
  productionLeadDays?: number;
  bestseller?: boolean;
  tags?: string[];
  seoTitle?: string;
  metaDescription?: string;
}

export interface ProductImage {
  url: string;
  alt: string;
}
