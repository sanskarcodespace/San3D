import type { Metadata } from "next";
import { siteConfig, whatsappUrl } from "@/config/site";
import { Icon } from "@/components/storefront/icon";
export const metadata: Metadata = {
  title: "Contact & WhatsApp Support",
  description:
    "Contact San3D about 3D printed products, custom gift ideas and corporate orders by WhatsApp or email.",
};
export default function ContactPage() {
  return (
    <div className="shell page-section">
      <header className="page-heading">
        <p className="eyebrow">GOOD THINGS START WITH A CONVERSATION</p>
        <h1>What’s on your mind?</h1>
        <p>
          A question. A custom idea. Something for your whole team.
          <br />
          We’d love to hear it.
        </p>
      </header>
      <div className="contact-grid">
        <section className="contact-card dark-card">
          <Icon name="spark" size={32} />
          <h2>Let’s talk on WhatsApp.</h2>
          <p>Share your idea or ask about a concept from the collection.</p>
          <a
            className="button light"
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer"
          >
            Open WhatsApp <Icon name="arrow" />
          </a>
          <span>{siteConfig.phone}</span>
        </section>
        <section className="contact-card">
          <p className="eyebrow">A LITTLE MORE DETAIL?</p>
          <h2>Put it in an email.</h2>
          <p>For design briefs, corporate gifting, or a longer conversation.</p>
          <a
            className="text-link email-link"
            href={`mailto:${siteConfig.email}`}
          >
            {siteConfig.email} <Icon name="arrow" />
          </a>
          <p className="fine-print">
            Links open your own messaging app. Nothing is sent automatically.
          </p>
        </section>
      </div>
      <section className="faq-section">
        <p className="eyebrow">BEFORE YOU SAY HELLO</p>
        <h2>A few useful details.</h2>
        <details>
          <summary>Can I place an order on this website?</summary>
          <p>
            Not yet. This is a demo storefront. You can explore products and
            save selections in a local bag, but payments and order placement are
            unavailable. Message us to discuss an idea.
          </p>
        </details>
        <details>
          <summary>What should I include in a custom request?</summary>
          <p>
            Tell us the object you have in mind, preferred size and colour, any
            text, the quantity, and your desired date. We’ll discuss feasibility
            before any commitment.
          </p>
        </details>
        <details>
          <summary>Can you help with corporate or bulk gifts?</summary>
          <p>
            We welcome enquiries. Include your quantity, brand requirements,
            budget, and date so we can discuss the brief. No minimum quantity or
            delivery promise is established on this demo site.
          </p>
        </details>
      </section>
    </div>
  );
}
