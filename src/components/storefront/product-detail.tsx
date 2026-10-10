"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/features/products/types";
import { useCart } from "@/features/cart/cart-provider";
import { formatPrice } from "@/lib/format";
import { whatsappUrl } from "@/config/site";
import { Icon } from "./icon";
export function ProductDetail({ product }: { product: Product }) {
  const [variantId, setVariantId] = useState(product.variants[0].id);
  const [quantity, setQuantity] = useState(1);
  const [personalisation, setPersonalisation] = useState("");
  const [view, setView] = useState("full");
  const [notice, setNotice] = useState("");
  const { add } = useCart();
  const variant = product.variants.find((item) => item.id === variantId)!;
  return (
    <div className="detail-grid">
      <div className="gallery">
        <div className={`gallery-main ${view === "detail" ? "zoomed" : ""}`}>
          <Image
            src={product.image}
            alt={`${product.imageAlt}${view === "detail" ? ", texture detail crop" : ""}`}
            fill
            sizes="(max-width: 800px) 100vw, 55vw"
            priority
          />
          <span className="product-badge">Concept image</span>
        </div>
        <div className="gallery-thumbs">
          {[
            ["full", "Full view"],
            ["detail", "Texture detail"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setView(value)}
              aria-pressed={view === value}
              className={view === value ? "selected" : ""}
            >
              <span className={value === "detail" ? "thumb-crop" : ""}>
                <Image src={product.image} alt="" width={72} height={72} />
              </span>
              {label}
            </button>
          ))}
        </div>
        <p className="fine-print">
          AI concept visual. Finish selections and personalisation are saved in
          your bag; the image is not a live preview.
        </p>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">THE SAN3D OBJECT COLLECTION</p>
        <h1>{product.name}</h1>
        <p className="detail-subtitle">{product.subtitle}</p>
        <p className="detail-price">
          {formatPrice(variant.priceInPaise)} <span>Illustrative price</span>
        </p>
        <p className="body-copy">{product.description}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (product.personalizable && !personalisation.trim()) {
              setNotice("Please enter a name or initials.");
              return;
            }
            add({
              productId: product.id,
              variantId,
              quantity,
              personalisation: personalisation.trim(),
            });
            setNotice("Saved to your demo bag. Maximum 20 of each selection.");
          }}
        >
          <fieldset className="variant-field">
            <legend>
              Finish <span>— {variant.name}</span>
            </legend>
            <div className="variant-options">
              {product.variants.map((option) => (
                <label key={option.id} title={option.name}>
                  <input
                    type="radio"
                    name="finish"
                    value={option.id}
                    checked={variantId === option.id}
                    onChange={() => {
                      setVariantId(option.id);
                      setNotice("");
                    }}
                  />
                  <span style={{ background: option.color }} />
                  <span className="sr-only">{option.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
          {product.personalizable && (
            <label className="field-label">
              Your name or initials
              <input
                maxLength={24}
                required
                value={personalisation}
                onChange={(event) => {
                  setPersonalisation(event.target.value);
                  setNotice("");
                }}
                placeholder="Make it yours (up to 24 characters)"
              />
              <small>
                Saved as a request; design feasibility is subject to
                confirmation.
              </small>
            </label>
          )}
          <div className="purchase-row">
            <div className="quantity">
              <button
                type="button"
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                onClick={() => setQuantity(quantity - 1)}
              >
                <Icon name="minus" size={16} />
              </button>
              <output aria-label="Quantity">{quantity}</output>
              <button
                type="button"
                disabled={quantity >= 20}
                aria-label="Increase quantity"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
            <button className="button dark" type="submit">
              Add to demo bag <Icon name="bag" size={18} />
            </button>
          </div>
          <p className="cart-feedback" role="status">
            {notice}
            {notice.startsWith("Saved") && (
              <>
                {" "}
                <Link href="/cart">View bag →</Link>
              </>
            )}
          </p>
        </form>
        <div className="demo-note">
          <Icon name="spark" size={18} />
          <p>
            This is a storefront preview. No order is placed and no payment is
            collected.
          </p>
        </div>
        <a
          className="text-link"
          href={whatsappUrl(
            `Hi San3D! I'd like to ask about the ${product.name} concept.`,
          )}
          target="_blank"
          rel="noreferrer"
        >
          Ask about this design <Icon name="arrow" />
        </a>
        <div className="product-accordions">
          <details open>
            <summary>Design details</summary>
            <p>
              {product.material}
              <br />
              {product.dimensions}
              <br />
              Specifications are illustrative and will be confirmed before sale.
            </p>
          </details>
          <details>
            <summary>Care & materials</summary>
            <p>
              Keep printed objects away from high heat. Dust with a soft cloth.
              Concepts are decorative; food, water, electrical, and child-safety
              suitability are not certified.
            </p>
          </details>
          <details>
            <summary>Shipping & returns</summary>
            <p>
              Shipping areas, lead times, charges, and return terms are being
              finalised.{" "}
              <Link href="/shipping-returns">
                Read the current information.
              </Link>
            </p>
          </details>
        </div>
      </div>
    </div>
  );
}
