import { test, expect } from "@playwright/test";
import sharp from "sharp";
import {
  MAX_IMAGE_BYTES,
  prepareCatalogueImage,
} from "../src/features/admin/image-validation";

test("accepted image bytes are decoded and normalized to WebP", async () => {
  for (const format of ["jpeg", "png", "webp"] as const) {
    const input = await sharp({
      create: { width: 12, height: 12, channels: 3, background: "#e6dfd1" },
    })
      .toFormat(format)
      .toBuffer();
    const output = await prepareCatalogueImage(input, `image/${format}`);
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe("webp");
    expect(metadata.exif).toBeUndefined();
  }
});

test("spoofed MIME, non-images and oversized images are rejected", async () => {
  const png = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "white" },
  })
    .png()
    .toBuffer();
  await expect(prepareCatalogueImage(png, "image/jpeg")).rejects.toThrow();
  await expect(
    prepareCatalogueImage(
      Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>',
      ),
      "image/png",
    ),
  ).rejects.toThrow();
  await expect(
    prepareCatalogueImage(Buffer.from("not image data"), "image/webp"),
  ).rejects.toThrow();
  await expect(
    prepareCatalogueImage(Buffer.alloc(MAX_IMAGE_BYTES + 1), "image/png"),
  ).rejects.toThrow();
});
