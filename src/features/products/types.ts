export interface Category {
  slug: string;
  name: string;
  shortName: string;
  description: string;
  image: string;
}
export interface ProductVariant {
  id: string;
  name: string;
  color: string;
  priceInPaise: number;
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
  isDemo: true;
}
