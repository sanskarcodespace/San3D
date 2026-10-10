import { Header } from "@/components/storefront/header";
import { Footer } from "@/components/storefront/footer";
import { CartProvider } from "@/features/cart/cart-provider";
import {
  getProducts,
  getCategories,
  isDemoCatalogue,
} from "@/features/products/repository";
export const dynamic = "force-dynamic";
export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  return (
    <CartProvider products={products}>
      <Header demo={isDemoCatalogue()} />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer
        demo={isDemoCatalogue()}
        corporateCategory={categories.some((c) => c.slug === "corporate-bulk")}
      />
    </CartProvider>
  );
}
