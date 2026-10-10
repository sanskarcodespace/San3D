"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveProduct } from "../actions";
import { type ProductInput, type CategoryInput, toSlug } from "../schema";
import { Images, imageUrl, cleanupImages } from "./images";
import { formatPrice } from "@/lib/format";
export function ProductEditor({
  initial,
  categories,
}: {
  initial: ProductInput;
  categories: (CategoryInput & { id: string })[];
}) {
  const [product, setProduct] = useState(initial);
  const [tags, setTags] = useState(initial.tags.map((t) => t.name).join(", "));
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  function set<K extends keyof ProductInput>(key: K, value: ProductInput[K]) {
    setProduct((p) => ({ ...p, [key]: value }));
  }
  function field(
    key: keyof ProductInput,
    label: string,
    max: number,
    area = false,
  ) {
    return (
      <label>
        {label}
        {area ? (
          <textarea
            rows={key === "description" ? 7 : 3}
            maxLength={max}
            value={String(product[key] ?? "")}
            onChange={(e) => set(key, e.target.value)}
          />
        ) : (
          <input
            maxLength={max}
            value={String(product[key] ?? "")}
            onChange={(e) => set(key, e.target.value)}
            required={key === "name" || key === "slug"}
          />
        )}
      </label>
    );
  }
  function number(
    key: keyof ProductInput,
    label: string,
    max: number,
    step = 1,
  ) {
    return (
      <label>
        {label}
        <input
          type="number"
          min={0}
          max={max}
          step={step}
          required
          value={Number(product[key])}
          onChange={(e) => set(key, Number(e.target.value))}
        />
      </label>
    );
  }
  function variant(
    index: number,
    key: keyof ProductInput["variants"][number],
    value: string | number | null,
  ) {
    set(
      "variants",
      product.variants.map((v, i) =>
        i === index ? { ...v, [key]: value } : v,
      ),
    );
  }
  function save() {
    if (
      product.status === "archived" &&
      initial.status !== "archived" &&
      !window.confirm(
        "Archive this product? It will be hidden from the storefront.",
      )
    )
      return;
    setMessage("");
    start(async () => {
      const payload = {
        ...product,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((name) => ({ name, slug: toSlug(name) })),
      };
      const result = await saveProduct(payload);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      const removed = initial.images
        .filter(
          (i) => !product.images.some((n) => n.storage_path === i.storage_path),
        )
        .map((i) => i.storage_path);
      const cleaned = await cleanupImages(removed);
      setMessage(
        cleaned
          ? "Saved successfully."
          : "Saved. Shared or unused images can be managed in Media.",
      );
      if (result.id) {
        router.replace(`/admin/products/${result.id}`);
        router.refresh();
      }
    });
  }
  return (
    <>
      <header className="admin-heading">
        <div>
          <Link href="/admin/products">← Catalogue</Link>
          <h1>
            {initial.id
              ? "Consider every detail."
              : "A new idea, taking shape."}
          </h1>
          <p>
            {initial.id
              ? "Edit your product and save when everything feels right."
              : "Start with a draft. Publish when your images and details are ready."}
          </p>
        </div>
        <button
          type="button"
          className="admin-secondary"
          onClick={() => setPreview(!preview)}
        >
          {preview ? "Close preview" : "Preview product"}
        </button>
      </header>
      {preview && (
        <section
          className="admin-panel admin-preview"
          aria-label="Product preview"
        >
          <p className="eyebrow">UNSAVED PREVIEW · NOT PUBLIC</p>
          <div className="detail-grid">
            <div>
              {product.images[0] ? (
                <Image
                  src={imageUrl(product.images[0].storage_path)}
                  alt={product.images[0].alt_text || "Product preview"}
                  width={600}
                  height={600}
                  unoptimized
                />
              ) : (
                <div className="admin-empty">
                  Upload your product photography
                </div>
              )}
              <div className="admin-preview-thumbs">
                {product.images.slice(1).map((i) => (
                  <Image
                    key={i.id}
                    src={imageUrl(i.storage_path)}
                    alt={i.alt_text || "Product preview"}
                    width={100}
                    height={100}
                    unoptimized
                  />
                ))}
              </div>
            </div>
            <div>
              <h2>{product.name || "Your product name"}</h2>
              <p>{product.short_description}</p>
              <p className="body-copy">{product.description}</p>
              {product.variants.map((v) => (
                <p key={v.id}>
                  {v.name} · {v.size} · {v.material} —{" "}
                  {formatPrice(v.price_paise)}
                  {v.compare_at_price_paise && (
                    <>
                      {" "}
                      <s>{formatPrice(v.compare_at_price_paise)}</s>
                    </>
                  )}
                  <br />
                  <small>
                    {v.mode === "made_to_order"
                      ? "Made to order"
                      : `${v.quantity} available`}
                  </small>
                </p>
              ))}
              <p>{product.personalizable ? "Personalisation available" : ""}</p>
              <p>Production lead time: {product.production_lead_days} days</p>
            </div>
          </div>
        </section>
      )}
      <form
        className="admin-form"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <fieldset
          disabled={pending || uploading}
          className="admin-editor-fields"
        >
          <div className="admin-editor-grid">
            <div>
              <section className="admin-panel">
                <h2>The essentials</h2>
                {field("name", "Product name", 160)}
                <div className="admin-inline">
                  {field("slug", "SEO slug", 160)}
                  <button
                    type="button"
                    onClick={() => set("slug", toSlug(product.name))}
                  >
                    Use name
                  </button>
                </div>
                {field("short_description", "Short description", 500, true)}
                {field("description", "Detailed description", 20000, true)}
                {field("dimensions", "Dimensions", 200)}
              </section>
              <section className="admin-panel">
                <h2>Product photography</h2>
                <Images
                  images={product.images}
                  onChange={(images) => set("images", images)}
                  onBusy={setUploading}
                />
              </section>
              <section className="admin-panel">
                <div className="admin-heading">
                  <h2>Variants & pricing</h2>
                  <button
                    type="button"
                    className="admin-secondary"
                    onClick={() =>
                      set("variants", [
                        ...product.variants,
                        {
                          id: crypto.randomUUID(),
                          sku: `SAN-${crypto.randomUUID().slice(0, 8)}`,
                          name: "",
                          colour_name: "",
                          colour_hex: "#e6dfd1",
                          size: "",
                          material: "PLA",
                          price_paise: 0,
                          compare_at_price_paise: null,
                          display_order: product.variants.length,
                          mode: "made_to_order",
                          quantity: 0,
                          low_stock_threshold: 5,
                        },
                      ])
                    }
                  >
                    + Add variant
                  </button>
                </div>
                <p className="admin-help">
                  Prices and costs use integer paise: ₹499 = 49900 paise.
                </p>
                {product.variants.map((v, index) => (
                  <fieldset className="admin-variant" key={v.id}>
                    <legend>Variant {index + 1}</legend>
                    <div className="admin-form-grid">
                      {(
                        [
                          ["name", "Variant name"],
                          ["sku", "Unique SKU"],
                          ["colour_name", "Colour name"],
                          ["size", "Size"],
                          ["material", "Material"],
                        ] as const
                      ).map(([key, label]) => (
                        <label key={key}>
                          {label}
                          <input
                            required={key === "name" || key === "sku"}
                            maxLength={
                              key === "name" || key === "material"
                                ? 160
                                : key === "colour_name"
                                  ? 80
                                  : 100
                            }
                            value={v[key]}
                            onChange={(e) =>
                              variant(index, key, e.target.value)
                            }
                          />
                        </label>
                      ))}
                      <label>
                        Colour swatch
                        <input
                          type="color"
                          value={v.colour_hex}
                          onChange={(e) =>
                            variant(index, "colour_hex", e.target.value)
                          }
                        />
                      </label>
                      <label>
                        Selling price (paise)
                        <input
                          type="number"
                          min={1}
                          max={100000000}
                          step={1}
                          required
                          value={v.price_paise}
                          onChange={(e) =>
                            variant(
                              index,
                              "price_paise",
                              Number(e.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        Compare-at price (optional, paise)
                        <input
                          type="number"
                          min={1}
                          max={100000000}
                          step={1}
                          value={v.compare_at_price_paise ?? ""}
                          onChange={(e) =>
                            variant(
                              index,
                              "compare_at_price_paise",
                              e.target.value === ""
                                ? null
                                : Number(e.target.value),
                            )
                          }
                        />
                      </label>
                      <label>
                        Availability
                        <select
                          value={v.mode}
                          onChange={(e) =>
                            variant(index, "mode", e.target.value)
                          }
                        >
                          <option value="made_to_order">Made to order</option>
                          <option value="stocked">Stocked</option>
                        </select>
                      </label>
                      <label>
                        Available quantity
                        <input
                          type="number"
                          min={0}
                          max={1000000}
                          step={1}
                          required
                          value={v.quantity}
                          onChange={(e) =>
                            variant(index, "quantity", Number(e.target.value))
                          }
                        />
                      </label>
                      <label>
                        Low-stock threshold
                        <input
                          type="number"
                          min={0}
                          max={1000000}
                          step={1}
                          required
                          value={v.low_stock_threshold}
                          onChange={(e) =>
                            variant(
                              index,
                              "low_stock_threshold",
                              Number(e.target.value),
                            )
                          }
                        />
                      </label>
                    </div>
                    <button
                      className="admin-danger"
                      type="button"
                      onClick={() => {
                        if (
                          window.confirm(
                            "Remove this variant? Existing bag selections using it will be removed after saving.",
                          )
                        )
                          set(
                            "variants",
                            product.variants.filter((i) => i.id !== v.id),
                          );
                      }}
                    >
                      Remove variant
                    </button>
                  </fieldset>
                ))}
                {!product.variants.length && (
                  <p className="admin-empty">
                    Add at least one variant before publishing.
                  </p>
                )}
              </section>
              <section className="admin-panel">
                <h2>Production planning</h2>
                <p className="admin-help">
                  Weights, print times and costs are private to administrators.
                </p>
                <div className="admin-form-grid">
                  {number(
                    "filament_weight_grams",
                    "Filament weight (grams)",
                    99999999.99,
                    0.01,
                  )}
                  {number(
                    "printing_time_minutes",
                    "Printing time (minutes)",
                    525600,
                  )}
                  {number(
                    "material_cost_paise",
                    "Material cost (paise)",
                    100000000,
                  )}
                  {number(
                    "labour_cost_paise",
                    "Labour cost (paise)",
                    100000000,
                  )}
                  {number(
                    "production_lead_days",
                    "Production lead time (days)",
                    365,
                  )}
                </div>
              </section>
            </div>
            <aside>
              <section className="admin-panel">
                <h2>Publication</h2>
                <label>
                  Status
                  <select
                    value={product.status}
                    onChange={(e) =>
                      set("status", e.target.value as ProductInput["status"])
                    }
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <p className="admin-help">
                  Published products appear on the website immediately. Drafts
                  and archived products stay private.
                </p>
                {(
                  [
                    ["featured", "Featured on homepage"],
                    ["bestseller", "Bestseller collection"],
                    ["personalizable", "Personalisation available"],
                  ] as const
                ).map(([key, label]) => (
                  <label className="admin-checkbox" key={key}>
                    <input
                      type="checkbox"
                      checked={product[key]}
                      onChange={(e) => set(key, e.target.checked)}
                    />
                    {label}
                  </label>
                ))}
                {product.personalizable &&
                  number(
                    "personalisation_limit",
                    "Personalisation character limit",
                    200,
                  )}
              </section>
              <section className="admin-panel">
                <h2>Organisation</h2>
                <label>
                  Category
                  <select
                    value={product.category_id}
                    onChange={(e) => set("category_id", e.target.value)}
                  >
                    <option value="">Choose category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <Link href="/admin/categories" target="_blank">
                  Manage categories ↗
                </Link>
                <label>
                  Tags (comma separated)
                  <input
                    value={tags}
                    maxLength={1800}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Gifts, Home, Personalised"
                  />
                </label>
              </section>
              <section className="admin-panel">
                <h2>Search appearance</h2>
                {field("seo_title", "SEO title", 160)}
                {field("meta_description", "Meta description", 320, true)}
              </section>
            </aside>
          </div>
        </fieldset>
        <div className="admin-save-bar">
          <p role="status" aria-live="polite">
            {message || "Changes are saved only when you choose Save product."}
          </p>
          <button
            className="admin-primary"
            disabled={pending || uploading}
            type="submit"
          >
            {pending ? "Saving…" : uploading ? "Uploading…" : "Save product"}
          </button>
        </div>
      </form>
    </>
  );
}
