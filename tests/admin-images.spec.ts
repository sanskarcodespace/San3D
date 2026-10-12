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


test("request limits reject chunked bodies and dishonest Content-Length", async () => {
  const { boundedBody, BodyTooLargeError } = await import("../src/features/admin/bounded-body");
  for (const headers of [{}, { "content-length": "1" }]) {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(new Uint8Array(8)); },
      cancel() { cancelled = true; },
    });
    const request = new Request("http://localhost/upload", {
      method: "POST", body: stream, headers, duplex: "half",
    } as RequestInit);
    await expect(boundedBody(request, 10)).rejects.toBeInstanceOf(BodyTooLargeError);
    expect(cancelled).toBe(true);
  }
  const accepted = new Request("http://localhost/upload", { method: "POST", body: "valid" });
  expect(new TextDecoder().decode(await boundedBody(accepted, 5))).toBe("valid");
});

test("bounded upload parsing preserves valid multipart file bytes", async () => {
  const { boundedBody } = await import("../src/features/admin/bounded-body");
  const input = await sharp({
    create: { width: 10, height: 10, channels: 3, background: "white" },
  }).png().toBuffer();
  const form = new FormData();
  form.set("file", new File([new Uint8Array(input)], "image.png", { type: "image/png" }));
  const request = new Request("http://localhost/upload", { method: "POST", body: form });
  const bytes = await boundedBody(request, 6 * 1024 * 1024);
  const decoded = await new Response(bytes, {
    headers: { "Content-Type": request.headers.get("content-type")! },
  }).formData();
  const file = decoded.get("file");
  expect(file).toBeInstanceOf(File);
  const upload = file as File;
  const result = await prepareCatalogueImage(Buffer.from(await upload.arrayBuffer()), upload.type);
  expect((await sharp(result).metadata()).format).toBe("webp");
});
