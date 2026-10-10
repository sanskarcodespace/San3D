import type { Metadata } from "next";
import { CartView } from "@/components/storefront/cart-view";
export const metadata: Metadata = {
  title: "Your Bag",
  description:
    "Review your San3D demo selections, finishes and personalisation. No payments or orders are processed.",
};
export default function CartPage() {
  return (
    <div className="shell page-section">
      <header className="page-heading">
        <p className="eyebrow">THE THINGS THAT FEEL LIKE YOU</p>
        <h1>Your bag.</h1>
        <p>A collection of possibilities. Saved here, just for you.</p>
      </header>
      <CartView />
    </div>
  );
}
