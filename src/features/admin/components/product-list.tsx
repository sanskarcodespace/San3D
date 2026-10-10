"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { productOperation } from "../actions";
export function ProductList({
  products,
}: {
  products: { id: string; name: string; slug: string; status: string }[];
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  function operate(
    id: string,
    operation: Parameters<typeof productOperation>[1],
    name: string,
  ) {
    if (
      (operation === "delete" || operation === "archive") &&
      !window.confirm(
        `${operation === "delete" ? "Permanently delete" : "Archive"} “${name}”? ${operation === "delete" ? "This cannot be undone." : "It will be hidden from the storefront."}`,
      )
    )
      return;
    start(async () => {
      const result = await productOperation(id, operation);
      setMessage(
        result.error ??
          result.success ??
          "Draft copy created with stock reset to zero.",
      );
      if (result.id) router.push(`/admin/products/${result.id}`);
      else router.refresh();
    });
  }
  const visible = products.filter(
    (p) =>
      (status === "all" || p.status === status) &&
      `${p.name} ${p.slug}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <div className="admin-toolbar">
        <label>
          Search products
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or slug"
          />
        </label>
        <label>
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            {["all", "draft", "published", "archived"].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <p role="status">{message}</p>
      <div className="admin-panel">
        {visible.length ? (
          visible.map((p) => (
            <article className="admin-product-row" key={p.id}>
              <div>
                <Link href={`/admin/products/${p.id}`}>
                  <h2>{p.name}</h2>
                </Link>
                <span className={`admin-pill ${p.status}`}>{p.status}</span>
                <small>/{p.slug}</small>
              </div>
              <div className="admin-row-actions">
                <Link href={`/admin/products/${p.id}`}>Edit & preview</Link>
                <button
                  disabled={pending}
                  onClick={() => operate(p.id, "duplicate", p.name)}
                >
                  Duplicate
                </button>
                <button
                  disabled={pending}
                  onClick={() =>
                    operate(
                      p.id,
                      p.status === "published" ? "unpublish" : "publish",
                      p.name,
                    )
                  }
                >
                  {p.status === "published" ? "Unpublish" : "Publish"}
                </button>
                <button
                  disabled={pending || p.status === "archived"}
                  onClick={() => operate(p.id, "archive", p.name)}
                >
                  Archive
                </button>
                <button
                  disabled={pending}
                  onClick={() => operate(p.id, "delete", p.name)}
                  className="admin-danger"
                >
                  Delete
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="admin-empty">
            No products here yet. Add your first object or change the filters.
          </p>
        )}
      </div>
    </>
  );
}
