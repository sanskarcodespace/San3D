import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/features/products/types";
import { formatPrice } from "@/lib/format";
import { Icon } from "./icon";
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link
        href={`/products/${product.slug}`}
        className="product-image"
        aria-label={`Explore ${product.name}`}
      >
        <Image
          src={product.image}
          alt={product.imageAlt}
          fill
          sizes="(max-width: 600px) 46vw, (max-width: 1000px) 45vw, 24vw"
        />
        {product.badge && (
          <span className="product-badge">{product.badge}</span>
        )}
        <span className="product-explore" aria-hidden="true">
          <Icon name="arrow" />
        </span>
      </Link>
      <div className="product-meta">
        <div>
          <Link href={`/products/${product.slug}`}>
            <h3>{product.name}</h3>
          </Link>
          <p>
            {product.personalizable
              ? "Make it personal"
              : "Designed for your everyday"}
          </p>
        </div>
        <span>
          {formatPrice(
            Math.min(
              ...product.variants.map((variant) => variant.priceInPaise),
            ),
          )}
        </span>
      </div>
      <div
        className="card-swatches"
        aria-label={`${product.variants.length} concept finishes`}
      >
        {product.variants.map((variant) => (
          <span key={variant.id} style={{ background: variant.color }} />
        ))}
        <small>Demo price</small>
      </div>
    </article>
  );
}
