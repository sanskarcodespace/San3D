import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Catalog } from "@/components/storefront/catalog";
import { Icon } from "@/components/storefront/icon";
import { getProducts, getCategories } from "@/features/products/repository";
export const metadata: Metadata = {
  title: "Custom 3D Gifts",
  description:
    "Explore personalised 3D gift concepts, name keychains and lithophane lamps. Discuss an idea with San3D.",
};
export default async function GiftsPage() {
  return (
    <div className="shell page-section">
      <section className="editorial-hero">
        <div>
          <p className="eyebrow">THE PERSONAL TOUCH</p>
          <h1>
            For someone
            <br />
            <em>like no one else.</em>
          </h1>
          <p>
            Some things mean more when they could only belong to one person.
            Find the beginnings of a gift with their name on it.
          </p>
          <Link className="button dark" href="/contact">
            Tell us your idea <Icon name="arrow" />
          </Link>
        </div>
        <div className="editorial-image">
          <Image
            src="/images/keychain.png"
            alt="Personalised SAN keychain concept"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
      </section>
      <div className="process-grid">
        <div>
          <span>01 / IMAGINE</span>
          <h2>Start with a person.</h2>
          <p>A name, a memory, or a wonderfully specific idea.</p>
        </div>
        <div>
          <span>02 / MAKE IT PERSONAL</span>
          <h2>Add your own detail.</h2>
          <p>Explore a concept finish and save your text in the demo bag.</p>
        </div>
        <div>
          <span>03 / LET’S TALK</span>
          <h2>Shape it together.</h2>
          <p>Discuss feasibility, a quote and timing before any order.</p>
        </div>
      </div>
      <header className="section-heading">
        <div>
          <p className="eyebrow">A FEW PLACES TO START</p>
          <h2>Small gestures. Lasting meaning.</h2>
        </div>
      </header>
      <Catalog
        products={(await getProducts()).filter(
          (p) => p.personalizable || p.id === "luma",
        )}
        categories={await getCategories()}
      />
    </div>
  );
}
