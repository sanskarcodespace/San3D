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
  const limit =
    variant.availability === "stocked"
      ? Math.min(20, variant.quantity ?? 0)
      : 20;
  const gallery = product.images?.length
    ? product.images.map((image, index) => ({
        value: String(index),
        label: `View image ${index + 1}`,
        image: image.url,
        alt: image.alt,
      }))
    : [
        {
          value: "full",
          label: "Full view",
          image: product.image,
          alt: product.imageAlt,
        },
        {
          value: "detail",
          label: "Texture detail",
          image: product.image,
          alt: product.imageAlt,
        },
      ];
  const currentImage = gallery.find((i) => i.value === view) ?? gallery[0];
  return (
    <div className="detail-grid">
      <div className="gallery">
        <div className={`gallery-main ${view === "detail" ? "zoomed" : ""}`}>
          <Image
            src={currentImage.image}
            alt={`${currentImage.alt}${view === "detail" ? ", texture detail crop" : ""}`}
            fill
            sizes="(max-width: 800px) 100vw, 55vw"
            priority
          />
          {product.isDemo && (
            <span className="product-badge">Concept image</span>
          )}
        </div>
        <div className="gallery-thumbs">
          {gallery.map(({ value, label, image }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              aria-pressed={currentImage.value === value}
              className={currentImage.value === value ? "selected" : ""}
            >
              <span className={value === "detail" ? "thumb-crop" : ""}>
                <Image src={image} alt="" width={72} height={72} />
              </span>
              {label}
            </button>
          ))}
        </div>
        <p className="fine-print">
          {product.isDemo
            ? "AI concept visual. Finish selections and personalisation are saved in your bag; the image is not a live preview."
            : "Images show the product design. Your variant and personalisation requests are saved in your bag."}
        </p>
      </div>
      <div className="detail-copy">
        <p className="eyebrow">THE SAN3D OBJECT COLLECTION</p>
        <h1>{product.name}</h1>
        <p className="detail-subtitle">{product.subtitle}</p>
        <p className="detail-price">
          {formatPrice(variant.priceInPaise)}{" "}
          {product.isDemo ? (
            <span>Illustrative price</span>
          ) : variant.compareAtPriceInPaise ? (
            <s>{formatPrice(variant.compareAtPriceInPaise)}</s>
          ) : null}
        </p>
        <p className="body-copy" style={{ whiteSpace: "pre-wrap" }}>
          {product.description}
        </p>
        {!product.isDemo && (
          <p className="fine-print">
            {variant.availability === "made_to_order"
              ? "Made to order"
              : `${variant.quantity ?? 0} available`}{" "}
            · Production lead time: {product.productionLeadDays ?? 0} days
            {variant.size ? ` · ${variant.size}` : ""}
            {variant.material ? ` · ${variant.material}` : ""}
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (product.personalizable && !personalisation.trim()) {
              setNotice("Please enter a name or initials.");
              return;
            }
            if (limit < 1) {
              setNotice("This variant is currently unavailable.");
              return;
            }
            add({
              productId: product.id,
              variantId,
              quantity: Math.min(quantity, limit),
              personalisation: personalisation.trim(),
            });
            setNotice(
              product.isDemo
                ? "Saved to your demo bag. Maximum 20 of each selection."
                : `Saved to your bag. Up to ${limit} of this selection can be saved.`,
            );
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
                      setQuantity(1);
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
                maxLength={product.personalisationLimit ?? 24}
                required
                value={personalisation}
                onChange={(event) => {
                  setPersonalisation(event.target.value);
                  setNotice("");
                }}
                placeholder={`Make it yours (up to ${product.personalisationLimit ?? 24} characters)`}
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
                disabled={quantity >= limit}
                aria-label="Increase quantity"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Icon name="plus" size={16} />
              </button>
            </div>
            <button className="button dark" type="submit" disabled={limit < 1}>
              {limit < 1
                ? "Currently unavailable"
                : product.isDemo
                  ? "Add to demo bag"
                  : "Add to bag"}{" "}
              <Icon name="bag" size={18} />
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
            `Hi San3D! I'd like to ask about the ${product.name}${product.isDemo ? " concept" : ""}.`,
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
              {product.isDemo
                ? "Specifications are illustrative and will be confirmed before sale."
                : "Contact us if your project needs a particular specification."}
            </p>
          </details>
          <details>
            <summary>Care & materials</summary>
            <p>
              Keep printed objects away from high heat. Dust with a soft cloth.
              Objects are decorative; food, water, electrical, and child-safety
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
