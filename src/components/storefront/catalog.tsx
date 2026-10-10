"use client";
import { useMemo, useState } from "react";
import type { Category, Product } from "@/features/products/types";
import { ProductCard } from "./product-card";
import { Icon } from "./icon";
export function Catalog({
  products,
  categories,
  fixedCategory,
}: {
  products: Product[];
  categories: Category[];
  fixedCategory?: string;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(fixedCategory ?? "all");
  const [sort, setSort] = useState("featured");
  const results = useMemo(() => {
    const filtered = products.filter(
      (product) =>
        (category === "all" || product.category === category) &&
        `${product.name} ${product.description}`
          .toLowerCase()
          .includes(query.toLowerCase().trim()),
    );
    const price = (product: Product) =>
      Math.min(...product.variants.map((variant) => variant.priceInPaise));
    return filtered.sort((a, b) =>
      sort === "price-low"
        ? price(a) - price(b)
        : sort === "price-high"
          ? price(b) - price(a)
          : sort === "name"
            ? a.name.localeCompare(b.name)
            : Number(!!b.featured) - Number(!!a.featured),
    );
  }, [products, query, category, sort]);
  return (
    <div className="catalog">
      <div className="catalog-tools">
        <label className="search-field" htmlFor="search">
          <Icon name="search" />
          <span className="sr-only">Search products</span>
          <input
            id="search"
            type="search"
            placeholder="Find your next favourite"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <label className="sort-field">
          Sort by
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="name">Name: A–Z</option>
          </select>
        </label>
      </div>
      {!fixedCategory && (
        <div className="filter-chips" aria-label="Filter by category">
          <button
            className={category === "all" ? "active" : ""}
            onClick={() => setCategory("all")}
            aria-pressed={category === "all"}
          >
            All objects
          </button>
          {categories.map((item) => (
            <button
              key={item.slug}
              className={category === item.slug ? "active" : ""}
              onClick={() => setCategory(item.slug)}
              aria-pressed={category === item.slug}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}
      <div className="catalog-count" aria-live="polite">
        {results.length} {results.length === 1 ? "object" : "objects"}
        <span>Concept products · Illustrative prices</span>
      </div>
      {results.length ? (
        <div className="product-grid">
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <Icon name="search" size={36} />
          <h2>No objects found.</h2>
          <p>Try another search or explore the full collection.</p>
          <button
            className="button dark"
            onClick={() => {
              setQuery("");
              setCategory(fixedCategory ?? "all");
            }}
          >
            Reset filters <Icon name="arrow" />
          </button>
        </div>
      )}
    </div>
  );
}
