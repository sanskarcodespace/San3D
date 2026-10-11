import Link from "next/link";
import { siteConfig, whatsappUrl } from "@/config/site";
import { Icon } from "./icon";
export function Footer({
  demo = false,
  corporateCategory = false,
}: {
  demo?: boolean;
  corporateCategory?: boolean;
}) {
  return (
    <footer className="site-footer">
      <div className="shell">
        <div className="footer-top">
          <div>
            <Link className="wordmark" href="/">
              san<span>3D</span>
              <i aria-hidden="true">·</i>
            </Link>
            <p>
              Extraordinary things.
              <br />
              One layer at a time.
            </p>
          </div>
          <div>
            <h2>Explore</h2>
            <Link href="/shop">Shop all</Link>
            <Link href="/custom-gifts">Custom gifts</Link>
            <Link
              href={corporateCategory ? "/category/corporate-bulk" : "/contact"}
            >
              Corporate & bulk
            </Link>
            <Link href="/about">Our story</Link>
          </div>
          <div>
            <h2>Here to help</h2>
            <Link href="/contact">Contact us</Link>
            <Link href="/shipping-returns">Shipping & returns</Link>
            <Link href="/cart">Your bag</Link>
            <a href={whatsappUrl()} target="_blank" rel="noreferrer">
              WhatsApp <span aria-hidden="true">↗</span>
            </a>
          </div>
          <div className="footer-note">
            <h2>Have something in mind?</h2>
            <p>
              A name. A memory. An idea.
              <br />
              Let’s give it a little dimension.
            </p>
            <Link className="text-link" href="/contact">
              Start a conversation <Icon name="arrow" />
            </Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {siteConfig.name}. A world of
            possibilities.
          </span>
          <span>
            {demo
              ? "Demo catalogue · Concept imagery · Payments unavailable"
              : "San3D catalogue · Online payments unavailable"}
          </span>
          <span>INR ₹ / India</span>
        </div>
      </div>
    </footer>
  );
}
