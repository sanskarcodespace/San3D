"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/features/cart/cart-provider";
import { cartKey } from "@/features/cart/model";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/config/site";
import { Icon } from "./icon";
export function CartView() {
  const { items, products, count, total, update, remove } = useCart();
  if (!items.length)
    return (
      <div className="empty-state">
        <Icon name="bag" size={44} />
        <h2>A little room for possibility.</h2>
        <p>Your bag is empty. Find an object that feels like you.</p>
        <Link className="button dark" href="/shop">
          Explore the collection <Icon name="arrow" />
        </Link>
      </div>
    );
  const inquiry = `Hi San3D! I'd like to discuss these demo selections (not place an order):\n${items
    .map((item) => {
      const p = products.find((p) => p.id === item.productId)!;
      const v = p.variants.find((v) => v.id === item.variantId)!;
      return `${p.name}, ${v.name}, qty ${item.quantity}${item.personalisation ? `, text: ${item.personalisation}` : ""}`;
    })
    .join("\n")}`;
  return (
    <div className="cart-layout">
      <div>
        <p className="catalog-count" aria-live="polite">
          {count} {count === 1 ? "item" : "items"} in your demo bag
        </p>
        {items.map((item) => {
          const product = products.find(
            (product) => product.id === item.productId,
          )!;
          const variant = product.variants.find(
            (variant) => variant.id === item.variantId,
          )!;
          const key = cartKey(item);
          return (
            <article className="cart-item" key={key}>
              <Link href={`/products/${product.slug}`} className="cart-image">
                <Image
                  src={product.image}
                  alt={product.imageAlt}
                  fill
                  sizes="140px"
                />
              </Link>
              <div className="cart-item-info">
                <Link href={`/products/${product.slug}`}>
                  <h2>{product.name}</h2>
                </Link>
                <p>
                  {variant.name}
                  {item.personalisation && <> · “{item.personalisation}”</>}
                </p>
                <div className="cart-item-actions">
                  <div className="quantity">
                    <button
                      disabled={item.quantity <= 1}
                      aria-label={`Decrease ${product.name} quantity`}
                      onClick={() => update(key, item.quantity - 1)}
                    >
                      <Icon name="minus" size={14} />
                    </button>
                    <output aria-label={`${product.name} quantity`}>
                      {item.quantity}
                    </output>
                    <button
                      disabled={item.quantity >= 20}
                      aria-label={`Increase ${product.name} quantity`}
                      onClick={() => update(key, item.quantity + 1)}
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                  <button
                    className="remove-link"
                    onClick={() => remove(key)}
                    aria-label={`Remove ${product.name}`}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <span className="line-price">
                {formatPrice(variant.priceInPaise * item.quantity)}
              </span>
            </article>
          );
        })}
        <Link className="text-link" href="/shop">
          Continue exploring <Icon name="arrow" />
        </Link>
      </div>
      <aside className="cart-summary">
        <p className="eyebrow">YOUR SELECTION</p>
        <h2>A little more you.</h2>
        <div className="summary-row">
          <span>Demo subtotal</span>
          <strong>{formatPrice(total)}</strong>
        </div>
        <p>
          Illustrative prices only. Shipping and any applicable taxes have not
          been calculated.
        </p>
        <div className="demo-note">
          <Icon name="spark" />
          <p>
            Checkout is not available yet. Your bag is saved in this browser
            when storage is available. It does not reserve stock or place an
            order.
          </p>
        </div>
        <a
          className="button dark"
          href={whatsappUrl(inquiry)}
          target="_blank"
          rel="noreferrer"
        >
          Discuss on WhatsApp <Icon name="arrow" />
        </a>
        <small>
          Opens a message draft with your selections. You choose whether to send
          it.
        </small>
      </aside>
    </div>
  );
}
