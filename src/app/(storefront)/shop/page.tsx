import type { Metadata } from "next";
import { Catalog } from "@/components/storefront/catalog";
import { getProducts, getCategories } from "@/features/products/repository";
export const metadata: Metadata = {
  title: "Shop All — 3D Printed Objects",
  description:
    "Explore San3D’s collection of sculptural decor, personalised gifts, lamps and desk accessories.",
};
export default async function ShopPage() {
  return (
    <div className="shell page-section">
      <header className="page-heading">
        <p className="eyebrow">THE OBJECT COLLECTION</p>
        <h1>Find a little more you.</h1>
        <p>
          For your favourite corner. Your favourite person. Or just because.
        </p>
      </header>
      <Catalog
        products={await getProducts()}
        categories={await getCategories()}
      />
    </div>
  );
}
