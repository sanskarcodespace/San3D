"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState } from "react";
import { useCart } from "@/features/cart/cart-provider";
import { Icon } from "./icon";
const links = [
  ["/shop", "Shop all"],
  ["/#collections", "Collections"],
  ["/custom-gifts", "Custom gifts"],
  ["/about", "Our story"],
];
export function Header({ demo = false }: { demo?: boolean }) {
  const pathname = usePathname();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  return (
    <>
      <div className="announcement">
        A little imagination. A whole new dimension.{" "}
        <Link href="/shop" onClick={() => setOpen(false)}>
          Explore our {demo ? "demo collection" : "collection"}{" "}
          <span aria-hidden="true">↗</span>
        </Link>
      </div>
      <header
        className="site-header"
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            setOpen(false);
            toggle.current?.focus();
          }
        }}
      >
        <div className="shell header-inner">
          <Link
            className="wordmark"
            href="/"
            aria-label="San3D home"
            onClick={() => setOpen(false)}
          >
            san<span>3D</span>
            <i aria-hidden="true">·</i>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(([href, name]) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {name}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link
              href="/shop#search"
              className="icon-button"
              aria-label="Search products"
              onClick={() => setOpen(false)}
            >
              <Icon name="search" />
            </Link>
            <Link
              href="/cart"
              className="bag-link"
              onClick={() => setOpen(false)}
              aria-label={`Shopping bag, ${count} ${count === 1 ? "item" : "items"}`}
            >
              <Icon name="bag" />
              <span className="bag-label">Bag</span>
              <span className="bag-count">{count}</span>
            </Link>
            <button
              ref={toggle}
              type="button"
              className="icon-button mobile-toggle"
              aria-expanded={open}
              aria-controls="mobile-navigation"
              aria-label={open ? "Close navigation" : "Open navigation"}
              onClick={() => setOpen(!open)}
            >
              <Icon name={open ? "close" : "menu"} />
            </button>
          </div>
        </div>
        {open && (
          <nav
            id="mobile-navigation"
            className="mobile-nav shell"
            aria-label="Mobile navigation"
          >
            {[...links, ["/contact", "Contact & support"]].map(
              ([href, name]) => (
                <Link key={href} href={href} onClick={() => setOpen(false)}>
                  {name}
                  <Icon name="arrow" />
                </Link>
              ),
            )}
          </nav>
        )}
      </header>
    </>
  );
}
