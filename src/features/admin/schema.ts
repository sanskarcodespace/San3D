import { z } from "zod";
export const storagePath = z
  .string()
  .regex(
    /^catalogue\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/,
  );
const text = (max: number) => z.string().trim().max(max);
const integer = (max: number) => z.number().int().min(0).max(max);
const slug = (max: number) =>
  text(max)
    .min(1)
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      "Use lowercase letters, numbers and single hyphens.",
    );
export const variantSchema = z
  .object({
    id: z.uuid(),
    sku: text(100).min(1),
    name: text(160).min(1),
    colour_name: text(80),
    colour_hex: z.string().regex(/^#[a-fA-F0-9]{6}$/),
    size: text(100),
    material: text(160),
    price_paise: integer(100000000).min(1),
    compare_at_price_paise: integer(100000000).nullable(),
    display_order: integer(1000),
    mode: z.enum(["stocked", "made_to_order"]),
    quantity: integer(1000000),
    low_stock_threshold: integer(1000000),
  })
  .refine(
    (v) =>
      v.compare_at_price_paise === null ||
      v.compare_at_price_paise > v.price_paise,
    "Compare-at price must exceed selling price.",
  );
export const productSchema = z
  .object({
    id: z.uuid().optional(),
    updated_at: z.string().optional(),
    name: text(160).min(1),
    slug: slug(160),
    short_description: text(500),
    description: text(20000),
    category_id: z.union([z.uuid(), z.literal("")]),
    dimensions: text(200),
    personalizable: z.boolean(),
    personalisation_limit: integer(200).min(1),
    production_lead_days: integer(365),
    featured: z.boolean(),
    bestseller: z.boolean(),
    status: z.enum(["draft", "published", "archived"]),
    seo_title: text(160),
    meta_description: text(320),
    filament_weight_grams: z.number().min(0).max(99999999.99),
    printing_time_minutes: integer(525600),
    material_cost_paise: integer(100000000),
    labour_cost_paise: integer(100000000),
    images: z
      .array(
        z.object({
          id: z.uuid(),
          storage_path: storagePath,
          alt_text: text(300).min(1),
          display_order: integer(1000),
        }),
      )
      .max(30),
    variants: z.array(variantSchema).max(100),
    tags: z.array(z.object({ name: text(60).min(1), slug: slug(80) })).max(30),
  })
  .superRefine((p, ctx) => {
    if (
      p.status === "published" &&
      (!p.category_id ||
        !p.description ||
        !p.images.length ||
        !p.variants.length)
    )
      ctx.addIssue({
        code: "custom",
        message:
          "Publishing requires a category, description, image and variant.",
      });
    if (
      new Set(p.variants.map((v) => v.id)).size !== p.variants.length ||
      new Set(p.variants.map((v) => v.sku)).size !== p.variants.length
    )
      ctx.addIssue({
        code: "custom",
        message: "Each variant needs a unique ID and SKU.",
      });
  });
export const categorySchema = z
  .object({
    id: z.uuid().optional(),
    name: text(100).min(1),
    slug: slug(120),
    short_name: text(160),
    description: text(5000),
    image_path: storagePath.nullable(),
    image_alt: text(300),
    display_order: integer(100000),
  })
  .refine(
    (c) => !c.image_path || c.image_alt.length > 0,
    "Add alt text for the category image.",
  );
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export function blankProduct(): ProductInput {
  return {
    name: "",
    slug: "",
    short_description: "",
    description: "",
    category_id: "",
    dimensions: "",
    personalizable: false,
    personalisation_limit: 24,
    production_lead_days: 0,
    featured: false,
    bestseller: false,
    status: "draft",
    seo_title: "",
    meta_description: "",
    filament_weight_grams: 0,
    printing_time_minutes: 0,
    material_cost_paise: 0,
    labour_cost_paise: 0,
    images: [],
    variants: [],
    tags: [],
  };
}
export function toSlug(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
