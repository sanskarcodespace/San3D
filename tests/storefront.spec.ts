import { test, expect } from "@playwright/test";

test("catalogue search, category filters, sort and empty state", async ({
  page,
}) => {
  await page.goto("/shop");
  await expect(page.locator(".product-card")).toHaveCount(7);
  await page
    .getByRole("button", { name: "Home Decorations", exact: true })
    .click();
  await expect(page.locator(".product-card")).toHaveCount(1);
  await expect(page.locator(".product-card")).toContainText("Ripple Vase");
  await page.getByRole("button", { name: "All objects", exact: true }).click();
  await page
    .getByRole("searchbox", { name: "Search products", exact: true })
    .fill("not-a-product");
  await expect(
    page.getByRole("heading", { name: "No objects found." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByLabel("Sort by").selectOption("price-low");
  await expect(page.locator(".product-card").first()).toContainText(
    "Signature Keychain",
  );
  await page.getByLabel("Sort by").selectOption("price-high");
  await expect(page.locator(".product-card").first()).toContainText(
    "Luma Lamp",
  );
});

test("variant pricing, gallery, persistent cart and quantity controls", async ({
  page,
}) => {
  await page.goto("/products/ripple-sculptural-vase");
  await page.getByRole("radio", { name: "Clay", exact: true }).check();
  await expect(page.locator(".detail-price")).toContainText("₹999");
  await page.getByRole("button", { name: "Texture detail" }).click();
  await expect(page.locator(".gallery-main")).toHaveClass(/zoomed/);
  await page
    .getByRole("button", { name: "Increase quantity", exact: true })
    .click();
  await page.getByRole("button", { name: "Add to demo bag" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "Saved" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "View bag" }).click();
  await expect(page.locator(".summary-row")).toContainText("₹1,998");
  await page.reload();
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.locator(".cart-item")).toContainText("Clay");
  await page
    .getByRole("button", { name: "Increase Ripple Vase quantity" })
    .click();
  await expect(page.locator(".summary-row")).toContainText("₹2,997");
  await page
    .getByRole("button", { name: "Decrease Ripple Vase quantity" })
    .click();
  await expect(page.locator(".summary-row")).toContainText("₹1,998");
  await expect(
    page.getByRole("link", { name: "Discuss on WhatsApp" }),
  ).toHaveAttribute("href", /wa.me\/917250307422/);
  await expect(page.locator(".cart-summary")).toContainText(
    "Checkout is not available yet",
  );
  await page.getByRole("button", { name: "Remove Ripple Vase" }).click();
  await expect(
    page.getByRole("heading", { name: "A little room for possibility." }),
  ).toBeVisible();
});

test("personalisation required and preserved in bag", async ({ page }) => {
  await page.goto("/products/signature-name-keychain");
  await page.getByRole("button", { name: "Add to demo bag" }).click();
  await expect(
    page.getByRole("link", { name: "Shopping bag, 0 items" }),
  ).toBeVisible();
  await page.getByLabel("Your name or initials").fill("Maya");
  await page.getByRole("button", { name: "Add to demo bag" }).click();
  await page.getByRole("link", { name: "View bag" }).click();
  await expect(page.locator(".cart-item")).toContainText("Maya");
});

test("cart remains usable when browser storage is blocked", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(Storage.prototype, "setItem", {
      value() {
        throw new Error("Storage blocked");
      },
    });
    Object.defineProperty(Storage.prototype, "getItem", {
      value() {
        throw new Error("Storage blocked");
      },
    });
  });
  await page.goto("/products/ripple-sculptural-vase");
  await page.getByRole("button", { name: "Add to demo bag" }).click();
  await page.getByRole("link", { name: "View bag" }).click();
  await expect(page.locator(".cart-item")).toContainText("Ripple Vase");
});

test("mobile navigation supports opening, closing and route selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  const toggle = page.getByRole("button", { name: "Open navigation" });
  await toggle.click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(toggle).toBeFocused();
  await toggle.click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Custom gifts" })
    .click();
  await expect(page).toHaveURL(/custom-gifts/);
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
});

for (const width of [320, 390, 768, 1440]) {
  test(`responsive pages stay within ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const route of [
      "/",
      "/shop",
      "/products/ripple-sculptural-vase",
      "/contact",
      "/cart",
    ]) {
      await page.goto(route);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(fits, route).toBe(true);
      if (route === "/" && [390, 1440].includes(width)) {
        await expect(page.locator(".hero-visual img")).toHaveJSProperty(
          "complete",
          true,
        );
        await page.screenshot({
          path: `test-results/home-${width}.png`,
          animations: "disabled",
        });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("all public routes render with unique titles, descriptions, images and no dead internal links", async ({
  page,
  request,
}) => {
  const routes = [
    "/",
    "/shop",
    "/custom-gifts",
    "/about",
    "/contact",
    "/shipping-returns",
    "/cart",
    ...[
      "custom-keychains",
      "figures-collectibles",
      "lithophanes-lamps",
      "home-decorations",
      "desk-accessories",
      "personalised-gifts",
      "corporate-bulk",
    ].map((s) => `/category/${s}`),
    ...[
      "ripple-sculptural-vase",
      "orbit-astronaut",
      "luma-lithophane-lamp",
      "signature-name-keychain",
      "arc-desk-organizer",
      "keepsake-personalised-tag",
      "studio-team-gift",
    ].map((s) => `/products/${s}`),
  ];
  const titles = new Set<string>();
  const links = new Set<string>();
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    const title = await page.title();
    expect(titles.has(title), title).toBe(false);
    titles.add(title);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /.+/,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    for (const href of await page
      .locator('a[href^="/"]')
      .evaluateAll((els) => els.map((el) => el.getAttribute("href")!)))
      links.add(href.split("#")[0]);
    for (const image of await page
      .locator("img")
      .evaluateAll((els) => els.map((el) => el.getAttribute("src")!)))
      expect((await request.get(image)).status()).toBe(200);
  }
  for (const href of links)
    expect((await request.get(href || "/")).status(), href).toBe(200);
  expect((await request.get("/products/does-not-exist")).status()).toBe(404);
  expect((await request.get("/category/does-not-exist")).status()).toBe(404);
  await page.goto("/contact");
  await expect(
    page.getByRole("link", { name: "Open WhatsApp" }),
  ).toHaveAttribute("href", /wa.me\/917250307422/);
  await expect(
    page.getByRole("link", { name: "sanskarsharma0310@gmail.com" }),
  ).toHaveAttribute("href", "mailto:sanskarsharma0310@gmail.com");
});
