"use client";
import Image from "next/image";
import { useState } from "react";
import type { ProductInput } from "../schema";
export function imageUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/catalogue-images/${path}`;
}
export async function cleanupImages(paths: string[]) {
  const results = await Promise.allSettled(
    paths.map((path) =>
      fetch("/api/admin/images", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path }),
      }),
    ),
  );
  return results.every((r) => r.status === "fulfilled" && r.value.ok);
}
export function Images({
  images,
  onChange,
  max = 30,
  onBusy,
}: {
  images: ProductInput["images"];
  onChange: (value: ProductInput["images"]) => void;
  max?: number;
  onBusy?: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function upload(files: FileList | null) {
    if (!files) return;
    if (images.length + files.length > max) {
      setMessage(`Choose up to ${max} images.`);
      return;
    }
    setBusy(true);
    onBusy?.(true);
    setMessage("");
    const next = [...images];
    try {
      for (const file of Array.from(files)) {
        const body = new FormData();
        body.append("file", file);
        const response = await fetch("/api/admin/images", {
          method: "POST",
          body,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error);
        next.push({
          id: crypto.randomUUID(),
          storage_path: result.path,
          alt_text: "",
          display_order: next.length,
        });
        onChange([...next]);
      }
      setMessage("Uploaded. Add descriptive alt text and save your changes.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      onBusy?.(false);
    }
  }
  function move(index: number, direction: number) {
    const next = [...images];
    [next[index], next[index + direction]] = [
      next[index + direction],
      next[index],
    ];
    onChange(next.map((i, display_order) => ({ ...i, display_order })));
  }
  return (
    <div className="admin-images">
      <label className="admin-upload">
        {busy ? "Uploading…" : "Upload images"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple={max > 1}
          disabled={busy || images.length >= max}
          onChange={(e) => {
            void upload(e.target.files);
            e.target.value = "";
          }}
        />
        <small>
          JPG, PNG or WebP · up to 5 MiB each · public catalogue images
        </small>
      </label>
      <p role="status">{message}</p>
      {images.map((img, index) => (
        <div className="admin-image-row" key={img.id}>
          <Image
            src={imageUrl(img.storage_path)}
            alt={img.alt_text || "Uploaded image awaiting alt text"}
            width={96}
            height={96}
            unoptimized
          />
          <label>
            Image {index + 1} alt text
            <input
              maxLength={300}
              value={img.alt_text}
              onChange={(e) =>
                onChange(
                  images.map((i) =>
                    i.id === img.id ? { ...i, alt_text: e.target.value } : i,
                  ),
                )
              }
            />
          </label>
          <div className="admin-inline">
            <button
              type="button"
              disabled={busy || index === 0}
              onClick={() => move(index, -1)}
              aria-label={`Move image ${index + 1} earlier`}
            >
              ↑
            </button>
            <button
              type="button"
              disabled={busy || index === images.length - 1}
              onClick={() => move(index, 1)}
              aria-label={`Move image ${index + 1} later`}
            >
              ↓
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                onChange(
                  images
                    .filter((i) => i.id !== img.id)
                    .map((i, display_order) => ({ ...i, display_order })),
                )
              }
            >
              Remove
            </button>
          </div>
        </div>
      ))}
      <small>
        To replace an image, remove it and upload the replacement. Changes take
        effect after saving.
      </small>
    </div>
  );
}
