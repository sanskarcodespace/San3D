import sharp from "sharp";
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
/** Decode before accepting bytes; uploaded names and declared MIME are untrusted. */
export async function prepareCatalogueImage(
  input: Buffer,
  contentType: string,
) {
  if (
    input.length < 1 ||
    input.length > MAX_IMAGE_BYTES ||
    !["image/jpeg", "image/png", "image/webp"].includes(contentType)
  )
    throw new Error("Choose a JPG, PNG or WebP image up to 5 MiB.");
  const decoded = sharp(input, {
    limitInputPixels: 25000000,
    failOn: "warning",
  });
  const metadata = await decoded.metadata();
  const mime = { jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  if (
    !(metadata.format && metadata.format in mime) ||
    mime[metadata.format as keyof typeof mime] !== contentType ||
    (metadata.pages ?? 1) > 1
  )
    throw new Error("Use a valid, still JPG, PNG or WebP image.");
  const body = await decoded
    .rotate()
    .resize({
      width: 2400,
      height: 2400,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 88 })
    .toBuffer();
  if (body.length > MAX_IMAGE_BYTES)
    throw new Error("Resize the image and try again.");
  return body;
}
