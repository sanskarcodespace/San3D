import { adminCategories } from "@/features/admin/repository";
import { blankProduct } from "@/features/admin/schema";
import { ProductEditor } from "@/features/admin/components/product-editor";
export const metadata = { title: "Add product" };
export default async function NewProduct() {
  return (
    <ProductEditor
      initial={blankProduct()}
      categories={await adminCategories()}
    />
  );
}
