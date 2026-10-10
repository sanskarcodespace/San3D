import { test, expect } from "@playwright/test";

test("anonymous admin routes redirect to login without leaking catalogue management", async ({
  page,
}) => {
  for (const path of [
    "/admin",
    "/admin/products",
    "/admin/products/new",
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

test("admin login is accessible at narrow mobile widths and keeps credentials out of URLs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
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
