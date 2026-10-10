import Link from "next/link";
import { adminProducts } from "@/features/admin/repository";
import { ProductList } from "@/features/admin/components/product-list";
export const metadata = { title: "Products" };
export default async function ProductsPage() {
  return (
    <>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">THE OBJECT COLLECTION</p>
          <h1>Your catalogue.</h1>
          <p>From first draft to the storefront, every detail in one place.</p>
        </div>
        <Link className="admin-primary" href="/admin/products/new">
          + Add product
        </Link>
      </header>
      <ProductList products={await adminProducts()} />
    </>
  );
}
