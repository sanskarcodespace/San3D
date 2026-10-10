import { categories, demoProducts } from "./data/demo-catalog";
/** Replace this adapter with Supabase queries; keep UI contracts stable. */
export async function getProducts() {
  return demoProducts;
}
export async function getProduct(slug: string) {
  return demoProducts.find((product) => product.slug === slug);
}
export async function getCategories() {
  return categories;
}
export async function getCategory(slug: string) {
  return categories.find((category) => category.slug === slug);
}
