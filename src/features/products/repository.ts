import "server-only";
import { cache } from "react";
import { publicClient } from "@/lib/supabase/server";
import { categories, demoProducts } from "./data/demo-catalog";
import type { Category, Product } from "./types";
/** Explicit local/test fallback. Never silently mask a live database error. */
export function isDemoCatalogue() {
  if (process.env.SAN3D_CATALOGUE_SOURCE !== "demo") return false;
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SAN3D_ALLOW_DEMO_PREVIEW !== "true"
  )
    throw new Error(
      "Demo catalogue is restricted to development and explicit local test previews.",
    );
  return true;
}
function imageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogue-images/${path}`;
}
type PublicRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  dimensions: string;
  personalizable: boolean;
  personalisation_limit: number;
  production_lead_days: number;
  featured: boolean;
  bestseller: boolean;
  seo_title: string;
  meta_description: string;
  categories: { slug: string };
  product_images: {
    storage_path: string;
    alt_text: string;
    display_order: number;
  }[];
  variants: {
    id: string;
    name: string;
    colour_hex: string;
    price_paise: number;
    compare_at_price_paise: number | null;
    material: string;
    size: string;
    display_order: number;
  }[];
  product_tags: { tags: { name: string } }[];
};
export const getProducts = cache(async (): Promise<Product[]> => {
  if (isDemoCatalogue()) return demoProducts;
  const client = publicClient();
  const rows: PublicRow[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client
      .from("products")
      .select(
        "id,slug,name,short_description,description,dimensions,personalizable,personalisation_limit,production_lead_days,featured,bestseller,seo_title,meta_description,categories!inner(slug),product_images(storage_path,alt_text,display_order),variants(id,name,colour_hex,price_paise,compare_at_price_paise,material,size,display_order),product_tags(tags(name))",
      )
      .eq("status", "published")
      .order("id")
      .range(offset, offset + 99);
    if (error) throw new Error("The catalogue is temporarily unavailable.");
    rows.push(...(data as unknown as PublicRow[]));
    if (data.length < 100) break;
  }
  const available = new Map<
    string,
    { mode: "stocked" | "made_to_order"; quantity: number }
  >();
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client
      .rpc("catalogue_availability")
      .order("variant_id")
      .range(offset, offset + 999);
    if (error)
      throw new Error("Product availability is temporarily unavailable.");
    for (const i of data as {
      variant_id: string;
      mode: "stocked" | "made_to_order";
      quantity: number;
    }[])
      available.set(i.variant_id, i);
    if (data.length < 1000) break;
  }
  return rows
    .map((p) => {
      const images = p.product_images
        .sort((a, b) => a.display_order - b.display_order)
        .map((i) => ({ url: imageUrl(i.storage_path), alt: i.alt_text }));
      return {
        id: p.id,
        slug: p.slug,
        name: p.name,
        subtitle: p.short_description,
        description: p.description,
        category: p.categories.slug,
        image: images[0]?.url ?? "/images/placeholder.svg",
        imageAlt: images[0]?.alt ?? p.name,
        images,
        material: p.variants[0]?.material ?? "",
        dimensions: p.dimensions,
        personalizable: p.personalizable,
        personalisationLimit: p.personalisation_limit,
        productionLeadDays: p.production_lead_days,
        featured: p.featured,
        bestseller: p.bestseller,
        badge: p.bestseller ? "Bestseller" : undefined,
        tags: p.product_tags.map((t) => t.tags.name),
        seoTitle: p.seo_title,
        metaDescription: p.meta_description,
        isDemo: false,
        variants: p.variants
          .sort((a, b) => a.display_order - b.display_order)
          .map((v) => ({
            id: v.id,
            name: v.name,
            color: v.colour_hex,
            priceInPaise: v.price_paise,
            compareAtPriceInPaise: v.compare_at_price_paise ?? undefined,
            material: v.material,
            size: v.size,
            availability: available.get(v.id)?.mode ?? "stocked",
            quantity: available.get(v.id)?.quantity ?? 0,
          })),
      };
    })
    .filter((p) => p.variants.length > 0);
});
export const getCategories = cache(async (): Promise<Category[]> => {
  if (isDemoCatalogue()) return categories;
  const client = publicClient();
  const result: Category[] = [];
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client
      .from("categories")
      .select("slug,name,short_name,description,image_path,image_alt")
      .order("display_order")
      .order("id")
      .range(offset, offset + 99);
    if (error) throw new Error("Collections are temporarily unavailable.");
    result.push(
      ...data.map((c) => ({
        slug: c.slug,
        name: c.name,
        shortName: c.short_name,
        description: c.description,
        image: c.image_path
          ? imageUrl(c.image_path)
          : "/images/placeholder.svg",
        imageAlt: c.image_alt || c.name,
      })),
    );
    if (data.length < 100) break;
  }
  return result;
});
export async function getProduct(slug: string) {
  return (await getProducts()).find((p) => p.slug === slug);
}
export async function getCategory(slug: string) {
  return (await getCategories()).find((c) => c.slug === slug);
}
