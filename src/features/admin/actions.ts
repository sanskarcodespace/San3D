"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { sessionClient } from "@/lib/supabase/server";
import { requireAdmin } from "./auth";
import { productSchema, categorySchema } from "./schema";
import { adminProduct } from "./repository";
export type ActionResult = { error?: string; id?: string; success?: string };
function failure(error: unknown): ActionResult {
  if (error instanceof z.ZodError)
    return {
      error: error.issues
        .map((i) => `${i.path.join(".") || "Product"}: ${i.message}`)
        .slice(0, 5)
        .join(" "),
    };
  const e = error as { code?: string; message?: string };
  if (e.code === "23505")
    return { error: "That slug or SKU already exists. Choose a unique value." };
  if (e.code === "40001")
    return {
      error:
        "This product changed or was deleted in another session. Reload before saving.",
    };
  if (e.code === "PGRST202")
    return {
      error: "Apply the atomic product-save migration before saving products.",
    };
  if (e.code === "23514")
    return {
      error:
        "Check publication requirements, prices and image uploads before saving.",
    };
  return {
    error:
      "The action could not be completed. Check your admin session and try again.",
  };
}
function refresh() {
  revalidatePath("/", "layout");
}
export async function signIn(
  _previous: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const parsed = z
    .object({
      email: z.email().max(254),
      password: z.string().min(1).max(1024),
    })
    .safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Enter your email and password." };
  const client = await sessionClient();
  const { error } = await client.auth.signInWithPassword(parsed.data);
  if (error)
    return {
      error: "Unable to sign in. Check your credentials or try again later.",
    };
  try {
    await requireAdmin();
  } catch {
    await client.auth.signOut();
    return { error: "This account is not an authorised administrator." };
  }
  redirect("/admin");
}
export async function signOut() {
  const client = await sessionClient();
  await client.auth.signOut();
  redirect("/admin/login");
}
export async function saveProduct(input: unknown): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const payload = productSchema.parse(input);
    const { data, error } = await client.rpc("save_catalogue_product", {
      payload,
    });
    if (error) throw error;
    refresh();
    return { id: data as string, success: "Product saved." };
  } catch (error) {
    return failure(error);
  }
}
export async function productOperation(
  id: string,
  operation: "archive" | "delete" | "unpublish" | "publish" | "duplicate",
): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    z.uuid().parse(id);
    z.enum(["archive", "delete", "unpublish", "publish", "duplicate"]).parse(
      operation,
    );
    if (operation === "duplicate") {
      const original = await adminProduct(id);
      if (!original) return { error: "Product no longer exists." };
      const suffix = crypto.randomUUID().slice(0, 8);
      const copy = productSchema.parse({
        ...original,
        id: undefined,
        updated_at: undefined,
        name: `${original.name.slice(0, 150)} copy`,
        slug: `${original.slug.slice(0, 140)}-copy-${suffix}`,
        status: "draft",
        images: original.images.map((i) => ({ ...i, id: crypto.randomUUID() })),
        variants: original.variants.map((v) => ({
          ...v,
          id: crypto.randomUUID(),
          sku: `${v.sku.slice(0, 80)}-${suffix}`,
          quantity: 0,
        })),
      });
      return saveProduct(copy);
    }
    const query =
      operation === "delete"
        ? client.from("products").delete()
        : client.from("products").update({
            status:
              operation === "archive"
                ? "archived"
                : operation === "publish"
                  ? "published"
                  : "draft",
          });
    const { data, error } = await query.eq("id", id).select("id");
    if (error) throw error;
    if (!data?.length)
      return { error: "Product no longer exists or access was revoked." };
    refresh();
    return { success: "Catalogue updated." };
  } catch (error) {
    return failure(error);
  }
}
export async function saveCategory(input: unknown): Promise<ActionResult> {
  try {
    const { client } = await requireAdmin();
    const value = categorySchema.parse(input);
    if (value.image_path) {
      const { data, error } = await client.storage
        .from("catalogue-images")
        .info(value.image_path);
      if (error || !data) return { error: "Upload a category image first." };
    }
    const query = value.id
      ? client.from("categories").update(value).eq("id", value.id)
      : client.from("categories").insert(value);
    const { data, error } = await query.select("id").single();
    if (error) throw error;
    refresh();
    return { id: data.id, success: "Category saved." };
  } catch (error) {
    return failure(error);
  }
}
