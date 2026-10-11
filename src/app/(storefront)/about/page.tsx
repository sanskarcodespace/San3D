import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/storefront/icon";
export const metadata: Metadata = {
  title: "Our Story",
  description:
    "Meet San3D, a 3D printing business exploring thoughtful everyday objects and personal gifts, one layer at a time.",
};
export default function AboutPage() {
  return (
    <div className="shell page-section">
      <section className="editorial-hero">
        <div>
          <p className="eyebrow">HELLO, WE’RE SAN3D</p>
          <h1>
            Big possibilities.
            <br />
            <em>Small beginnings.</em>
          </h1>
          <p>
            We believe an everyday object can be anything but ordinary. That a
            small detail can make a desk feel like yours. And that the best
            gifts begin with paying attention.
          </p>
          <Link className="text-link" href="/shop">
            Explore our first chapter <Icon name="arrow" />
          </Link>
        </div>
        <div className="editorial-image">
          <Image
            src="/images/hero.png"
            alt="San3D concept collection of sculptural printed objects"
            fill
            priority
            sizes="(max-width: 800px) 100vw, 50vw"
          />
        </div>
      </section>
      <section className="story-section">
        <p className="eyebrow">A DIFFERENT WAY TO MAKE</p>
        <h2>
          From a spark of imagination
          <br />
          <span>to something you can hold.</span>
        </h2>
        <div className="story-bottom">
          <p>
            San3D is a 3D printing business exploring the space between
            technology and personality. This first collection is a design
            preview of where we’re headed: sculptural decor, useful desk
            companions, and gifts with a personal story.
          </p>
          <p>
            Our aim is simple: considered forms, expressive details, and an open
            conversation about what’s possible. The products you see here are
            editorial concepts. Product listings show the current catalogue.
          </p>
        </div>
      </section>
      <div className="process-grid">
        <div>
          <span>01 / CURIOSITY</span>
          <h2>Imagine a little further.</h2>
          <p>Explore forms and ideas beyond the familiar.</p>
        </div>
        <div>
          <span>02 / INTENTION</span>
          <h2>Give every detail a reason.</h2>
          <p>Consider how an object feels, functions and fits into your day.</p>
        </div>
        <div>
          <span>03 / PERSONALITY</span>
          <h2>Leave room for you.</h2>
          <p>Make space for names, memories and individual expression.</p>
        </div>
      </div>
      <Link className="button dark" href="/contact">
        Start a conversation <Icon name="arrow" />
      </Link>
    </div>
  );
}
