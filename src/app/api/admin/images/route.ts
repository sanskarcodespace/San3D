import { NextRequest, NextResponse } from "next/server";
import { prepareCatalogueImage } from "@/features/admin/image-validation";
import { requireAdmin, AdminAccessError } from "@/features/admin/auth";
import { storagePath } from "@/features/admin/schema";
import { boundedBody, BodyTooLargeError } from "@/features/admin/bounded-body";
export const runtime = "nodejs";
function sameOrigin(request: NextRequest) {
  return request.headers.get("origin") === request.nextUrl.origin;
}
export async function POST(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const { client } = await requireAdmin();
    const bytes = await boundedBody(request, 6 * 1024 * 1024);
    const form = await new Response(bytes, {
      headers: { "Content-Type": request.headers.get("content-type") ?? "" },
    }).formData();
    const file = form.get("file");
    if (
      !(file instanceof File) ||
      !["image/jpeg", "image/png", "image/webp"].includes(file.type) ||
      file.size < 1 ||
      file.size > 5 * 1024 * 1024
    )
      return NextResponse.json(
        { error: "Choose a JPG, PNG or WebP image up to 5 MiB." },
        { status: 400 },
      );
    const input = Buffer.from(await file.arrayBuffer());
    const body = await prepareCatalogueImage(input, file.type);
    const path = `catalogue/${crypto.randomUUID()}.webp`;
    const { error } = await client.storage
      .from("catalogue-images")
      .upload(path, body, { contentType: "image/webp", upsert: false });
    if (error) throw error;
    return NextResponse.json({
      path,
      url: client.storage.from("catalogue-images").getPublicUrl(path).data
        .publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof BodyTooLargeError
            ? "Maximum file size is 5 MiB."
            : error instanceof AdminAccessError
              ? "Administrator sign-in required."
              : "Image upload failed. Check the file and your connection.",
      },
      {
        status: error instanceof BodyTooLargeError
          ? 413
          : error instanceof AdminAccessError ? 403 : 400,
      },
    );
  }
}
export async function DELETE(request: NextRequest) {
  if (!sameOrigin(request))
    return NextResponse.json(
      { error: "Invalid request origin." },
      { status: 403 },
    );
  try {
    const { client } = await requireAdmin();
    const { path } = JSON.parse(
      new TextDecoder().decode(await boundedBody(request, 4096)),
    );
    const validPath = storagePath.parse(path);
    const { data, error } = await client.storage
      .from("catalogue-images")
      .remove([validPath]);
    if (error || !data?.length)
      return NextResponse.json(
        { error: "File is still referenced or could not be deleted." },
        { status: 409 },
      );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete this image." },
      { status: 403 },
    );
  }
}
