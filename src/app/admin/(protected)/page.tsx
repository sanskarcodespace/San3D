import Link from "next/link";
import { adminOverview } from "@/features/admin/repository";
export const metadata = { title: "Overview" };
export default async function Overview() {
  const data = await adminOverview();
  return (
    <>
      <header className="admin-heading">
        <div>
          <p className="eyebrow">YOUR STUDIO, AT A GLANCE</p>
          <h1>Make room for ideas.</h1>
          <p>A clear view of your catalogue and what needs your attention.</p>
        </div>
        <Link className="admin-primary" href="/admin/products/new">
          + Add product
        </Link>
      </header>
      <div className="admin-stats">
        {[
          ["Published products", data.published],
          ["Draft products", data.drafts],
          ["Categories", data.categories],
          [
            "Low-stock products",
            new Set(data.lowStock.map((i) => i.variants.products.id)).size,
          ],
        ].map(([label, value]) => (
          <div className="admin-stat" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
          </div>
        ))}
      </div>
      <div className="admin-two-column">
        <section className="admin-panel">
          <h2>Stock to keep an eye on</h2>
          {data.lowStock.length ? (
            data.lowStock.map((i, index) => (
              <Link
                className="admin-list-row"
                key={index}
                href={`/admin/products/${i.variants.products.id}`}
              >
                <span>
                  {i.variants.products.name}
                  <small>{i.variants.name}</small>
                </span>
                <strong>{i.quantity} left</strong>
              </Link>
            ))
          ) : (
            <p className="admin-empty">
              No published variants are below their stock threshold.
            </p>
          )}
        </section>
        <section className="admin-panel">
          <h2>Recent catalogue activity</h2>
          {data.activity.length ? (
            data.activity.map((a) => (
              <div className="admin-list-row" key={a.id}>
                <span>
                  {a.action.toLowerCase()} · {a.table_name.replaceAll("_", " ")}
                </span>
                <time>
                  {new Date(a.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </time>
              </div>
            ))
          ) : (
            <p className="admin-empty">
              Your first catalogue changes will appear here.
            </p>
          )}
        </section>
      </div>
    </>
  );
}
