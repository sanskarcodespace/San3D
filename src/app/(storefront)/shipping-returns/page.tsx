import type { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Shipping & Returns Information",
  description:
    "Current San3D launch status and information about future shipping, delivery and returns. Live orders are not open yet.",
};
export default function ShippingPage() {
  return (
    <div className="shell page-section policy-page">
      <header className="page-heading">
        <p className="eyebrow">CLEAR FROM THE START</p>
        <h1>The details matter.</h1>
        <p>Shipping & returns information</p>
      </header>
      <div className="policy-notice">
        We’re preparing for launch. This website currently showcases demo
        products and does not accept orders or payments.
      </div>
      <section>
        <h2>Shipping & delivery</h2>
        <p>
          Serviceable locations, delivery charges, production lead times, and
          estimated transit times are being finalised. We have not published
          delivery guarantees. For a potential custom project, contact us to
          discuss feasibility and timing before making any commitment.
        </p>
      </section>
      <section>
        <h2>Returns & cancellations</h2>
        <p>
          A final returns, cancellation, damage-reporting, and refund policy
          will be published before online sales begin. No return window or
          eligibility promise is made by this demo storefront.
        </p>
      </section>
      <section>
        <h2>Personalised pieces</h2>
        <p>
          Names, finishes, prices, and specifications shown here are
          illustrative. A custom brief, design approval, quote, and applicable
          terms will need to be confirmed before an actual order.
        </p>
      </section>
      <section>
        <h2>Your demo bag</h2>
        <p>
          Your selections are stored in your browser. Adding an item does not
          reserve inventory, create an order, or trigger a charge. You can
          remove any item from your bag at any time.
        </p>
      </section>
      <Link className="button dark" href="/contact">
        Ask us a question →
      </Link>
    </div>
  );
}
