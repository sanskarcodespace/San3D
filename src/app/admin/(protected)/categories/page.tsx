import { adminCategories } from "@/features/admin/repository";
import { CategoryEditor } from "@/features/admin/components/category-editor";
export const metadata = { title: "Categories" };
export default async function CategoriesPage() {
  const categories = await adminCategories();
  return (
    <>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">LITTLE WORLDS TO EXPLORE</p>
          <h1>Your collections.</h1>
          <p>
            Shape the way people discover your catalogue. Lower display numbers
            appear first.
          </p>
        </div>
      </header>
      <div className="admin-two-column">
        <CategoryEditor
          initial={{
            name: "",
            slug: "",
            short_name: "",
            description: "",
            image_path: null,
            image_alt: "",
            display_order: 0,
          }}
        />
        {categories.map((c) => (
          <CategoryEditor key={JSON.stringify(c)} initial={c} />
        ))}
      </div>
    </>
  );
}
