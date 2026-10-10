import { test, expect } from "@playwright/test";
import { readCart, cartTotal } from "../src/features/cart/model";
import { demoProducts } from "../src/features/products/data/demo-catalog";

test("cart rejects malformed, unknown, and invalid quantities", () => {
  expect(readCart("not json", demoProducts)).toEqual([]);
  expect(readCart('{"items":[]}', demoProducts)).toEqual([]);
  expect(
    readCart(
      JSON.stringify([
        null,
        { productId: "missing", variantId: "ripple-ivory", quantity: 1 },
        { productId: "ripple", variantId: "missing", quantity: 1 },
        { productId: "ripple", variantId: "ripple-ivory", quantity: -2 },
        { productId: "ripple", variantId: "ripple-ivory", quantity: 1.5 },
      ]),
      demoProducts,
    ),
  ).toEqual([]);
});
test("cart merges identical selections, caps quantities and ignores supplied prices", () => {
  const item = {
    productId: "ripple",
    variantId: "ripple-clay",
    quantity: 12,
    priceInPaise: 1,
  };
  const items = readCart(JSON.stringify([item, item]), demoProducts);
  expect(items).toHaveLength(1);
  expect(items[0].quantity).toBe(20);
  expect(cartTotal(items, demoProducts)).toBe(99900 * 20);
});
test("personalised items require text and preserve distinct names", () => {
  const item = {
    productId: "signature",
    variantId: "signature-ivory",
    quantity: 1,
  };
  const items = readCart(
    JSON.stringify([
      { ...item, personalisation: "  " },
      { ...item, personalisation: "  Sam " },
      { ...item, personalisation: "Alex" },
    ]),
    demoProducts,
  );
  expect(items).toHaveLength(2);
  expect(items.map((entry) => entry.personalisation)).toEqual(["Sam", "Alex"]);
});
