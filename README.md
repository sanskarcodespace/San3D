# San3D

A design-led storefront for a 3D printing business. Built with Next.js App Router, React, TypeScript, and Tailwind CSS, with a warm ivory and charcoal visual identity, original concept imagery, and a working browser-local shopping bag.

Repository: [sanskarcodespace/San3D](https://github.com/sanskarcodespace/San3D).

## Current status

Phase 2 is a **demo storefront**, not a live shop. All seven products, prices, finish options, dimensions, and AI-generated images are illustrative. There are no invented reviews, sales rankings, stock counts, delivery guarantees, live payments, or order submission endpoints.

The homepage includes a clearly labelled preview of a future bestsellers collection. Supabase, Razorpay, and the no-code admin dashboard remain future integrations. Public contact links use the owner's confirmed WhatsApp number and email address.

## Run locally

Use Node.js 24 LTS (`.nvmrc`) and npm. The initial implementation was also verified using the workstation's Node.js 26 runtime.

```bash
nvm use
npm ci
cp .env.example .env.local
npm run dev
```

Open [localhost:3000](http://localhost:3000). No credentials are required for the demo; leave integration settings blank.

| Command             | Purpose                                                  |
| ------------------- | -------------------------------------------------------- |
| `npm run dev`       | Start development server                                 |
| `npm run lint`      | ESLint, zero warnings allowed                            |
| `npm run typecheck` | Check TypeScript                                         |
| `npm run build`     | Generate production application                          |
| `npm start`         | Serve production build                                   |
| `npm test`          | Run Playwright regression tests against production build |

Install the test browser once before the first test run:

```bash
npx playwright install chromium
npm run build
npm test
```

Tests start and stop their own server on port 3100; leave that port available. They cover catalogue filters/search/sorting, gallery selection, variants and prices, personalisation validation, cart quantity/removal/persistence, blocked storage, mobile navigation, page metadata, internal links, assets, 404s, and overflow at 320, 390, 768, and 1440 pixels. Pure cart tests exercise malformed storage, invalid IDs, quantity bounds, merging, and authoritative demo pricing. Browser coverage currently uses Chromium; Safari and Firefox are not covered.

## Pages

| Route               | Experience                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `/`                 | Editorial hero, collections, favourites preview, featured objects, gifting and brand story               |
| `/shop`             | Searchable catalogue, category filters, price/name sorting and empty state                               |
| `/category/[slug]`  | Seven category landing pages                                                                             |
| `/products/[slug]`  | Seven product pages with full/detail gallery views, finishes, quantity, optional text and design details |
| `/custom-gifts`     | Personalised gift collection and enquiry journey                                                         |
| `/cart`             | Persistent demo selections, subtotal and WhatsApp enquiry draft                                          |
| `/about`            | Brand story and design principles                                                                        |
| `/contact`          | WhatsApp, email and common questions                                                                     |
| `/shipping-returns` | Honest pre-launch shipping and returns information                                                       |

The WhatsApp links open a message draft; they do not send it automatically. The cart never reserves inventory or creates an order. Browser storage may be cleared by the visitor; when storage is blocked, the bag works in memory for the current session. Quantity is capped at 20 per unique product/finish/personalisation selection as a demo UI bound, not an inventory statement.

## Project structure

```text
src/
  app/
    (storefront)/
      layout.tsx            # Shared header, footer and cart provider
      page.tsx              # Homepage
      shop/                 # Catalogue
      category/[slug]/      # Category landing pages
      products/[slug]/      # Product detail pages
      custom-gifts/
      cart/
      about/
      contact/
      shipping-returns/
    globals.css             # Design tokens and responsive styling
    layout.tsx              # Document metadata and skip link
    not-found.tsx
    icon.svg
  components/storefront/    # Reusable navigation, cards, catalogue, detail and cart UI
  config/site.ts            # Brand and confirmed contact details
  features/
    products/
      data/demo-catalog.ts  # The only product/category demo data source
      repository.ts         # Async data adapter boundary
      types.ts              # Storefront read model
    cart/                   # Storage validation, totals, state provider and types
    orders/                 # Future order domain contracts
    admin/                  # Future administration boundary
  lib/
    format.ts               # INR display formatting
    supabase/               # Future integration guidance
    razorpay/               # Future integration guidance
public/images/              # Six original concept images, served through next/image
tests/                     # Cart and storefront regression tests
docs/                      # Architecture and image generation provenance
```

`@/*` resolves to `src/*`. Routes load products through the repository module, and interactive components receive typed serializable data. Credentials never reach client components. Generated `AGENTS.md` records the installed Next.js version's agent guidance.

## Future data and admin integration

See [architecture.md](docs/architecture.md) for the product read model, Supabase migration path, admin capabilities, cart boundaries, and payment prerequisites. No database SDK or privileged service is required by this phase.

The future admin dashboard should manage products, categories, variants, media, and publication status without changing page code. Database rows must be mapped into the storefront contract inside `repository.ts`. Customer-facing prices and availability must be revalidated on the server before any real order is accepted.

## Design, images and accessibility

Reusable components use semantic navigation, headings and forms, visible focus styles, a skip link, labelled controls, keyboard-operable finish choices, an Escape-dismissable mobile menu, status messages, and reduced-motion support. Product thumbnails offer a full view and an explicitly labelled texture crop of the same concept visual. Finishes and custom text do not alter the image; this is stated on the product page.

Generated images are committed locally, with source prompts and provenance in [imagery.md](docs/imagery.md). The built-in imagegen tool created all six images; none depicts verified inventory. Replace these assets with approved real product photography before launch. Next.js serves responsive, optimized images without third-party image-host dependencies. Typography uses system fonts, so builds do not need a font service.

## SEO and launch state

Every public route has a descriptive title, description, readable URL and a single main heading. Unknown products/categories return 404. The preview intentionally uses `noindex, follow` to keep illustrative products and prices out of search results. Before a real launch, approve catalogue content, set the final domain and canonical URLs, add a sitemap, and enable indexing. There is no fabricated product availability, review, or offer schema.

## Environment and security

`.env.example` contains sanitized placeholders for future Supabase and Razorpay integrations. `.env.local`, all other environment files, dependency folders, build output, common credential files, and test artifacts are ignored. Public WhatsApp and email details live in `src/config/site.ts` and are intended for publication.

Never put secrets in `NEXT_PUBLIC_*` variables or source code. Add runtime validation, server-only adapters, authentication, row-level security and role checks when services are introduced.

## Known tooling limitations

The full npm audit has five high-severity findings in the development lint dependency chain: `eslint-config-next` → `@next/eslint-plugin-next` → `fast-glob` → `micromatch` → `braces`. At verification time no patched `braces` release was available; the suggested automatic remedy downgraded the Next.js lint config to version 14. Do not apply that incompatible downgrade blindly. Production-only audit reports zero vulnerabilities.

ESLint 9 remains compatible with the React, accessibility, and import plugins but is marked unsupported by npm. Revisit the lint stack together when compatible updates are available.

## Repository handling

The nested `San3D/` folder is a separate, empty Git initialization pointing to the same GitHub repository. It contains `.git/` and `.kilo/` tooling metadata, no commits and no application files. It has been left untouched and excluded from this work's commit. No files were deleted or moved there.

The Phase 2 commit is local. Pushing or deploying is a separate approved action.
