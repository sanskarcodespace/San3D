import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ProductDetail } from "@/components/storefront/product-detail";
import { ProductCard } from "@/components/storefront/product-card";
import {
  getProduct,
  getProducts,
  getCategory,
} from "@/features/products/repository";
type Props = { params: Promise<{ slug: string }> };
export async function generateStaticParams() {
  return (await getProducts()).map(({ slug }) => ({ slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  return {
    title: product?.name ?? "Object not found",
    description: product
      ? `${product.subtitle} Explore this San3D demo product, its concept finishes and design details.`
      : undefined,
  };
}
export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();
  const category = await getCategory(product.category);
  return (
    <div className="shell page-section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/shop">Shop</Link>
        <span>/</span>
        <Link href={`/category/${product.category}`}>{category?.name}</Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>
      <ProductDetail key={product.id} product={product} />
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">KEEP EXPLORING</p>
            <h2>Good company for your space.</h2>
          </div>
        </div>
        <div className="product-grid">
          {(await getProducts())
            .filter((item) => item.id !== product.id)
            .slice(0, 4)
            .map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
        </div>
      </section>
    </div>
  );
}
