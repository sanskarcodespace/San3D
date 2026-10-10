import Image from "next/image";
import Link from "next/link";
import {
  getCategories,
  getProducts,
  isDemoCatalogue,
} from "@/features/products/repository";
import { ProductCard } from "@/components/storefront/product-card";
import { Icon } from "@/components/storefront/icon";
export default async function HomePage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const demo = isDemoCatalogue();
  const collections = demo
    ? [categories[3], categories[1], categories[2], categories[4]].filter(
        Boolean,
      )
    : categories.slice(0, 4);
  const highlight = products.find((p) => p.featured) ?? products[0];
  return (
    <>
      <section className="hero shell">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="accent-dot" /> SMALL OBJECTS. INFINITE
            POSSIBILITIES.
          </p>
          <h1>
            A little
            <br />
            more <em>you.</em>
          </h1>
          <p>
            Thoughtful objects for your space,
            <br className="desktop-break" /> your people, and your everyday.
            <br className="desktop-break" /> Imagined differently. Printed in
            3D.
          </p>
          <Link className="button dark" href="/shop">
            Explore the collection <Icon name="arrow" />
          </Link>
          <div className="hero-footnote">
            <span className="mini-layer" aria-hidden="true">
              ≋
            </span>
            <span>
              Made of ideas.
              <br />
              <strong>Built layer by layer.</strong>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <Image
            src="/images/hero.png"
            alt="Sculptural ivory vase, terracotta arch and charcoal pencil cup in warm sunlight"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 60vw"
          />
          <span className="image-caption">
            THE EVERYDAY, REIMAGINED — VOL. 01
          </span>
          <Link
            href={highlight ? `/products/${highlight.slug}` : "/shop"}
            className="hero-product"
          >
            <span>
              <small>
                {highlight
                  ? "Discover the collection"
                  : "A new collection is taking shape"}
              </small>
              <strong>{highlight?.name ?? "Explore San3D"}</strong>
            </span>
            <span className="circle-arrow">
              <Icon name="arrow" />
            </span>
          </Link>
        </div>
      </section>
      <div className="principle-strip shell">
        <span>
          <Icon name="spark" size={18} /> Designed to be different
        </span>
        <span>
          <span aria-hidden="true">◎</span> Personal touches, endless
          possibilities
        </span>
        <span>
          <span aria-hidden="true">≋</span> A new dimension of gifting
        </span>
      </div>
      <section className="section shell" id="collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">FIND YOUR KIND OF EXTRAORDINARY</p>
            <h2>Little worlds to explore.</h2>
          </div>
          <Link href="/shop" className="text-link">
            All collections <Icon name="arrow" />
          </Link>
        </div>
        <div className="collection-grid">
          {collections.map((category, i) => (
            <Link
              href={`/category/${category.slug}`}
              className="collection-card"
              key={category.slug}
            >
              <div className="collection-image">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  sizes="(max-width: 600px) 75vw, (max-width: 1000px) 45vw, 24vw"
                />
                <span className="collection-number">0{i + 1}</span>
              </div>
              <div>
                <h3>{category.name}</h3>
                <Icon name="arrow" size={18} />
              </div>
              <p>{category.shortName}</p>
            </Link>
          ))}
        </div>
      </section>
      <section className="favourites-section">
        <div className="shell section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">THE FAVOURITES EDIT</p>
              <h2>Objects with a little more soul.</h2>
            </div>
            <Link href="/shop" className="text-link">
              Find your favourite <Icon name="arrow" />
            </Link>
          </div>
          <p className="section-note">
            {demo
              ? "A preview of our future bestsellers collection. Curated demo picks, not a sales ranking."
              : "A considered edit of featured objects from our studio."}
          </p>
          {products.length === 0 && (
            <p className="section-note">
              Our catalogue is taking shape. Check back for new objects, or
              contact us about your idea.
            </p>
          )}
          <div className="product-grid">
            {products
              .filter((product) => product.featured || product.bestseller)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
        </div>
      </section>
      <section className="section shell">
        <div className="gift-banner">
          <div className="gift-image">
            <Image
              src="/images/keychain.png"
              alt="Personalised name keychain concept in ivory and terracotta"
              fill
              sizes="(max-width: 800px) 100vw, 50vw"
            />
          </div>
          <div className="gift-copy">
            <p className="eyebrow">THOUGHT OF YOU. MADE FOR YOU.</p>
            <h2>
              Some gifts say more.
              <br />
              <em>Make yours personal.</em>
            </h2>
            <p>
              A name. A favourite memory. That wonderfully specific thing only
              they would love. Start with an idea and make it their own.
            </p>
            <Link href="/custom-gifts" className="button light">
              Discover custom gifts <Icon name="arrow" />
            </Link>
            <span className="gift-detail">
              A small object. A very personal story.
            </span>
          </div>
        </div>
      </section>
      <section className="story-section shell">
        <p className="eyebrow">NOT JUST PRINTED. CONSIDERED.</p>
        <h2>
          Good design is in the details.
          <br />
          <span>Ours start with a single layer.</span>
        </h2>
        <div className="story-bottom">
          <p>
            We’re building San3D around a simple idea: the things you surround
            yourself with should feel like you. A meeting of digital possibility
            and everyday personality.
          </p>
          <Link href="/about" className="text-link">
            Get to know San3D <Icon name="arrow" />
          </Link>
        </div>
      </section>
      <div className="demo-banner shell">
        <Icon name="spark" />
        <p>
          {demo
            ? "You’re exploring our first chapter. Products, prices and AI-generated imagery are illustrative. Live orders aren’t open yet."
            : "Explore our catalogue and discuss your ideas with us. Editorial imagery is illustrative. Online orders and payments aren’t open yet."}
        </p>
        <Link href="/contact">
          Let’s talk <Icon name="arrow" size={16} />
        </Link>
      </div>
    </>
  );
}
