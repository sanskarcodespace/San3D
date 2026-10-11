import { notFound } from "next/navigation";
import { z } from "zod";
import { adminProduct, adminCategories } from "@/features/admin/repository";
import { ProductEditor } from "@/features/admin/components/product-editor";
export const metadata = { title: "Edit product" };
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [product, categories] = await Promise.all([
    adminProduct(id),
    adminCategories(),
  ]);
  if (!product) notFound();
  return (
    <ProductEditor
      key={`${id}-${product.updated_at}`}
      initial={product}
      categories={categories}
    />
  );
}
