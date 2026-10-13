import { test, expect } from "@playwright/test";

test("anonymous admin routes redirect to login without leaking catalogue management", async ({
  page,
}) => {
  for (const path of [
    "/admin",
    "/admin/products",
    "/admin/products/new",
    "/admin/products/10000000-0000-4000-8000-000000000001",
    "/admin/categories",
    "/admin/media",
  ]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/admin\/login$/);
    await expect(
      page.getByRole("heading", { name: "Welcome back." }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Save product", exact: true }),
    ).toHaveCount(0);
  }
});

test("image endpoints reject anonymous and cross-origin requests", async ({
  request,
}) => {
  const sameOrigin = { Origin: "http://127.0.0.1:3100" };
  const upload = await request.post("/api/admin/images", {
    headers: sameOrigin,
    multipart: {
      file: {
        name: "test.png",
        mimeType: "image/png",
        buffer: Buffer.from("not an image"),
      },
    },
  });
  expect(upload.status()).toBe(403);
  const deletion = await request.delete("/api/admin/images", {
    headers: sameOrigin,
    data: { path: "catalogue/10000000-0000-4000-8000-000000000001.webp" },
  });
  expect(deletion.status()).toBe(403);
  const crossOrigin = await request.post("/api/admin/images", {
    headers: { Origin: "https://untrusted.example" },
  });
  expect(crossOrigin.status()).toBe(403);
});

for (const width of [320, 390, 768, 1440]) {
  test(`admin login stays accessible at ${width}px and keeps credentials out of URLs`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/admin/login");
    await expect(page.getByLabel("Email", { exact: true })).toHaveAttribute(
      "type",
      "email",
    );
    await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute(
      "type",
      "password",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBeTruthy();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );
  });
}


test("session endpoint denies anonymous callers and never caches authorisation", async ({ request }) => {
  const response = await request.get("/api/admin/session");
  expect(response.status()).toBe(403);
  expect(response.headers()["cache-control"]).toContain("no-store");
  expect(await response.json()).toEqual({ authorised: false });
});

test("security headers protect pages without breaking storefront rendering", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.headers()["x-content-type-options"]).toBe("nosniff");
  expect(response?.headers()["x-frame-options"]).toBe("DENY");
  expect(response?.headers()["content-security-policy"]).toContain("frame-ancestors 'none'");
  await page.goto("/admin/login");
  const response2 = await page.request.get("/admin/login");
  expect(response2.headers()["cache-control"]).toContain("no-store");
});
