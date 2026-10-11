import { test, expect } from "@playwright/test";
import {
  blankProduct,
  productSchema,
  categorySchema,
  storagePath,
} from "../src/features/admin/schema";

test("drafts allow incomplete content while publication requires a sellable catalogue record", () => {
  const draft = { ...blankProduct(), name: "Vase", slug: "vase" };
  expect(productSchema.safeParse(draft).success).toBe(true);
  expect(
    productSchema.safeParse({ ...draft, status: "published" }).success,
  ).toBe(false);
  expect(productSchema.safeParse({ ...draft, slug: "../unsafe" }).success).toBe(
    false,
  );
  expect(
    productSchema.safeParse({ ...draft, labour_cost_paise: -1 }).success,
  ).toBe(false);
});

test("server validation rejects fractional prices, invalid discounts and duplicate variant identities", () => {
  const variant = {
    id: "30000000-0000-4000-8000-000000000001",
    sku: "VASE-1",
    name: "Ivory",
    colour_name: "Ivory",
    colour_hex: "#ffffff",
    material: "PLA",
    size: "",
    price_paise: 10000,
    compare_at_price_paise: 12000,
    display_order: 0,
    mode: "stocked",
    quantity: 2,
    low_stock_threshold: 1,
  };
  const draft = {
    ...blankProduct(),
    name: "Vase",
    slug: "vase",
    variants: [variant],
  };
  expect(productSchema.safeParse(draft).success).toBe(true);
  expect(
    productSchema.safeParse({
      ...draft,
      variants: [{ ...variant, price_paise: 10.5 }],
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({
      ...draft,
      variants: [{ ...variant, compare_at_price_paise: 100 }],
    }).success,
  ).toBe(false);
  expect(
    productSchema.safeParse({ ...draft, variants: [variant, variant] }).success,
  ).toBe(false);
});

test("image paths and category images require safe UUID paths and alt text", () => {
  for (const path of [
    "../private.jpg",
    "catalogue/../../secret.webp",
    "https://evil.test/file.png",
    "catalogue/file.svg",
  ])
    expect(storagePath.safeParse(path).success).toBe(false);
  const path = "catalogue/20000000-0000-4000-8000-000000000001.webp";
  const category = {
    name: "Home",
    slug: "home",
    short_name: "Home",
    description: "",
    image_path: path,
    image_alt: "",
    display_order: 0,
  };
  expect(categorySchema.safeParse(category).success).toBe(false);
  expect(
    categorySchema.safeParse({ ...category, image_alt: "Ivory vase" }).success,
  ).toBe(true);
});
