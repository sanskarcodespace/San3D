"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCategory } from "../actions";
import { type CategoryInput, toSlug } from "../schema";
import { Images, cleanupImages } from "./images";
export function CategoryEditor({ initial }: { initial: CategoryInput }) {
  const [value, set] = useState(initial);
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  return (
    <form
      className="admin-panel admin-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const result = await saveCategory(value);
          if (result.error) {
            setMessage(result.error);
            return;
          }
          if (initial.image_path && initial.image_path !== value.image_path)
            await cleanupImages([initial.image_path]);
          setMessage("Category saved.");
          router.refresh();
          if (!initial.id) set({ ...initial });
        });
      }}
    >
      <fieldset disabled={pending || busy}>
        <h2>{initial.id ? initial.name : "Create a collection"}</h2>
        <div className="admin-form-grid">
          <label>
            Name
            <input
              value={value.name}
              maxLength={100}
              required
              onChange={(e) => set({ ...value, name: e.target.value })}
            />
          </label>
          <label>
            Slug
            <input
              value={value.slug}
              maxLength={120}
              required
              onChange={(e) => set({ ...value, slug: e.target.value })}
            />
            <button
              type="button"
              onClick={() => set({ ...value, slug: toSlug(value.name) })}
            >
              Generate from name
            </button>
          </label>
          <label>
            Short label
            <input
              value={value.short_name}
              maxLength={160}
              onChange={(e) => set({ ...value, short_name: e.target.value })}
            />
          </label>
          <label>
            Display order
            <input
              type="number"
              min={0}
              max={100000}
              required
              value={value.display_order}
              onChange={(e) =>
                set({ ...value, display_order: Number(e.target.value) })
              }
            />
          </label>
        </div>
        <label>
          Description
          <textarea
            rows={3}
            maxLength={5000}
            value={value.description}
            onChange={(e) => set({ ...value, description: e.target.value })}
          />
        </label>
        <Images
          max={1}
          onBusy={setBusy}
          images={
            value.image_path
              ? [
                  {
                    id: "category",
                    storage_path: value.image_path,
                    alt_text: value.image_alt,
                    display_order: 0,
                  },
                ]
              : []
          }
          onChange={(images) =>
            set({
              ...value,
              image_path: images[0]?.storage_path ?? null,
              image_alt: images[0]?.alt_text ?? "",
            })
          }
        />
      </fieldset>
      <p role="status">{message}</p>
      <button disabled={pending || busy} className="admin-primary">
        {pending ? "Saving…" : "Save category"}
      </button>
    </form>
  );
}
