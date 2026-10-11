import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Catalog } from "@/components/storefront/catalog";
import {
  getProducts,
  getCategories,
  getCategory,
} from "@/features/products/repository";
type Props = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return {
    title: category?.name ?? "Collection not found",
    description: category?.description,
  };
}
export default async function CategoryPage({ params }: Props) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  return (
    <div className="shell page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop all</Link>
        <span>/</span>
        <span>{category.name}</span>
      </nav>
      <header className="page-heading">
        <p className="eyebrow">A SAN3D COLLECTION</p>
        <h1>{category.name}</h1>
        <p>{category.description}</p>
        {category.slug === "corporate-bulk" && (
          <Link className="text-link" href="/contact">
            Discuss a bulk gifting brief →
          </Link>
        )}
      </header>
      <Catalog
        products={await getProducts()}
        categories={await getCategories()}
        fixedCategory={category.slug}
      />
    </div>
  );
}
