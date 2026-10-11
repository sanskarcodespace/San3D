import "server-only";
import { allRows } from "./pagination";
import { requireAdminPage } from "./auth";
import { blankProduct, type ProductInput, type CategoryInput } from "./schema";
export async function adminCategories() {
  const { client } = await requireAdminPage();
  const data = await allRows((from, to) =>
    client
      .from("categories")
      .select("*")
      .order("display_order")
      .order("id")
      .range(from, to),
  );
  return data as (CategoryInput & { id: string })[];
}
export async function adminProducts() {
  const { client } = await requireAdminPage();
  const data = await allRows((from, to) =>
    client
      .from("products")
      .select("id,name,slug,status,updated_at")
      .order("updated_at", { ascending: false })
      .order("id")
      .range(from, to),
  );
  return data as {
    id: string;
    name: string;
    slug: string;
    status: string;
    updated_at: string;
  }[];
}
export async function adminProduct(id: string): Promise<ProductInput | null> {
  const { client } = await requireAdminPage();
  const { data, error } = await client
    .from("products")
    .select(
      "*,product_images(*),variants(*,inventory(*)),product_tags(tags(name,slug)),product_production(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Could not load this product.");
  if (!data) return null;
  type Row = Omit<ProductInput, "variants"> & {
    product_images: ProductInput["images"];
    variants: (ProductInput["variants"][number] & {
      inventory: {
        mode: "stocked" | "made_to_order";
        quantity: number;
        low_stock_threshold: number;
      } | null;
    })[];
    product_tags: { tags: ProductInput["tags"][number] }[];
    product_production: Partial<ProductInput> | null;
  };
  const row = data as unknown as Row;
  return {
    ...blankProduct(),
    ...row,
    ...row.product_production,
    id: row.id,
    updated_at: row.updated_at,
    category_id: row.category_id ?? "",
    images: row.product_images.sort(
      (a, b) => a.display_order - b.display_order,
    ),
    tags: row.product_tags.map((t) => t.tags),
    variants: row.variants
      .map((v) => ({
        ...v,
        ...v.inventory,
        mode: v.inventory?.mode ?? "stocked",
        quantity: v.inventory?.quantity ?? 0,
        low_stock_threshold: v.inventory?.low_stock_threshold ?? 5,
      }))
      .sort((a, b) => a.display_order - b.display_order),
  };
}
export async function adminOverview() {
  const { client } = await requireAdminPage();
  const results = await Promise.all([
    client
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "published"),
    client
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("status", "draft"),
    client.from("categories").select("id", { count: "exact", head: true }),
    client
      .from("audit_logs")
      .select("id,action,table_name,created_at")
      .order("created_at", { ascending: false })
      .limit(12),
  ]);
  if (results.some((r) => r.error))
    throw new Error("Could not load dashboard statistics.");
  const stock = await allRows((from, to) =>
    client
      .from("inventory")
      .select(
        "quantity,low_stock_threshold,variants!inner(name,products!inner(id,name,status))",
      )
      .eq("mode", "stocked")
      .eq("variants.products.status", "published")
      .order("variant_id")
      .range(from, to),
  );
  const inventory = stock as unknown as {
    quantity: number;
    low_stock_threshold: number;
    variants: { name: string; products: { id: string; name: string } };
  }[];
  return {
    published: results[0].count ?? 0,
    drafts: results[1].count ?? 0,
    categories: results[2].count ?? 0,
    lowStock: inventory.filter((i) => i.quantity <= i.low_stock_threshold),
    activity: results[3].data as unknown as {
      id: string;
      action: string;
      table_name: string;
      created_at: string;
    }[],
  };
}
