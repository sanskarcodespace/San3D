# San3D

A premium 3D-printing catalogue and administrator studio built with Next.js App Router, React, TypeScript, Tailwind CSS and Supabase. The storefront retains its ivory, charcoal and muted green identity while catalogue content is managed through forms.

Repository: [sanskarcodespace/San3D](https://github.com/sanskarcodespace/San3D).

## Current status

Phase 3 implementation adds Supabase PostgreSQL, cookie-based authentication, protected catalogue administration and Storage image management. Both migrations and the first application administrator role are verified on the hosted project. Signed-in category creation and imagery, product creation/editing/duplication, multiple image uploads/replacement/deletion, preview, publication, archiving and fresh login/logout have passed browser verification. See [setup instructions](docs/supabase-setup.md).

The catalogue defaults to live Supabase data. An empty database shows an empty collection; it does not silently substitute demo products. There are no live payments, order creation, fake reviews or automatic stock reservations. Editorial concept imagery is labelled as illustrative. Contact links use the owner's confirmed WhatsApp number and email address.

## Local setup

Use Node.js 24 LTS (`.nvmrc`) and npm. Development was also checked with the workstation's Node.js 26 runtime.

```bash
nvm use
npm ci
# Only if .env.local does not already exist:
cp .env.example .env.local
npm run dev
```

Enter your Supabase URL and publishable key in `.env.local`, then apply the two versioned migrations in order and create your administrator membership. Do not overwrite an existing `.env.local`. No service-role key is required. The file and `node_modules` are ignored by Git.

- Storefront: [localhost:3000](http://localhost:3000)
- Studio: [localhost:3000/admin](http://localhost:3000/admin)
- Login: [localhost:3000/admin/login](http://localhost:3000/admin/login)

For deliberate local demo development, set `SAN3D_CATALOGUE_SOURCE=demo`. Production-mode browser tests set `SAN3D_ALLOW_DEMO_PREVIEW=true` only for their isolated local server. Do not enable these demo settings on hosting. Live database failures show an error, never an invented catalogue.

## Catalogue studio

- Overview: published/draft/category counts, low-stock published products and recent audit activity.
- Products: create, edit, search, duplicate, preview, publish, unpublish, archive and permanently delete with confirmation. Copies begin as drafts with stock reset to zero.
- Product fields: SEO, category, tags, descriptions, dimensions, colour/size/material variants, integer-paise selling/compare-at prices, stock or made-to-order mode, personalisation limits, production lead days, featured and bestseller flags.
- Private production planning: filament grams, print minutes and material/labour costs.
- Categories: names, unique slugs, descriptions, image/alt text and display order.
- Images: multiple uploads, alt text, reordering and replacement; an independent media library removes unused uploads. Shared images cannot be deleted while referenced.

Read [the admin guide](docs/admin-guide.md) before publishing your first product. Prices and costs are entered as integer paise: ₹499 is `49900`. Publishing requires a category, detailed description, at least one image with alt text, and a valid variant with inventory settings.

## Pages and architecture

Public routes include `/`, `/shop`, `/category/[slug]`, `/products/[slug]`, `/custom-gifts`, `/cart`, `/about`, `/contact` and `/shipping-returns`. Products and categories resolve at request time; publishing does not require a commit or rebuild. Search includes names, descriptions and tags; filters and sorting preserve the existing storefront interactions.

```text
src/
  app/(storefront)/          Public pages, metadata and shop loading state
  app/admin/                Login, protected studio, responsive admin styling
  app/api/admin/images/     Authenticated image upload/deletion endpoints
  components/storefront/    Existing premium presentation components
  features/admin/           Role checks, actions, validation, editors and data access
  features/products/        Supabase repository and stable storefront types
    data/demo-catalog.ts    Explicit development fallback only
  features/cart/            Browser-local selections and catalogue-based pricing
  lib/supabase/server.ts    Request-scoped session and public read clients
  proxy.ts                  Admin session refresh and no-store response headers
supabase/migrations/        Schema/RLS/storage and transactional save function
public/images/              Editorial concept assets and neutral category placeholder
tests/                      Storefront, cart, access, validation and image tests
  database/                 Real PostgreSQL policy and transaction tests via PGlite
docs/                       Architecture, admin operations and setup instructions
```

See [architecture](docs/architecture.md) for data boundaries and future payment requirements.

## Security

Every admin read and mutation checks a verified Supabase user and current administrator membership. RLS independently protects tables and Storage. Ordinary authenticated users cannot grant roles. Product saves are transactional and reject stale editor versions. Database constraints validate slugs, paise values and complete publication; immutable audit records capture changes.

Material/labour costs and operational records live in an admin-only table. Public reads expose published products and a restricted availability projection. Public catalogue images are not confidential; future personal photos have a separate private bucket with no client access policies.

Uploads validate size, actual decoded format, declared MIME and pixel limits, then re-encode to WebP with metadata removed. Object paths are generated UUIDs. Auth cookies are HTTP-only and use Secure on production HTTPS; `SUPABASE_COOKIE_SECURE=false` is only for a local HTTP production preview. Server Actions provide Next.js origin protection; image routes also validate Origin.

## Verification

| Command             | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `npm run lint`      | ESLint with zero warnings                                               |
| `npm run typecheck` | TypeScript validation                                                   |
| `npm run test:db`   | PostgreSQL CRUD, RLS, publication, transaction and Storage policy tests |
| `npm run build`     | Production compilation                                                  |
| `npm test`          | Playwright storefront/cart/access and server-validation tests           |

Install Chromium once with `npx playwright install chromium`. Build before running Playwright. Tests start their own explicit demo-mode server on port 3100 and stop it afterwards. The development preview on port 3000 is independent.

PGlite runs actual PostgreSQL policies and constraints with fixture Supabase Auth/Storage infrastructure. It does not exercise hosted authentication, PostgREST or Storage HTTP behaviour. Anonymous access, public hosted reads and the signed-in core catalogue workflow have been checked. See [verification results and remaining coverage](docs/phase-3-verification.md). Chromium regression coverage does not establish full accessibility conformance or Safari/Firefox support.

## Limitations and deployment

The bag stores selections locally and recalculates prices from the loaded catalogue. It removes unpublished/deleted variants and caps stocked selections against available quantity. It does not reserve stock, guarantee a quote or accept an order. Future checkout must revalidate every price, quantity and personalisation rule on the server.

The current small-catalogue foundation loads all published products for filtering and cart reconciliation. Database requests are paginated to avoid silent row truncation; a substantially larger catalogue should move searching and cart hydration to narrower queries. Product editors support up to 100 variants, 30 images and 30 tags. Concurrent product edits reject stale saves; category edits currently use last-write-wins.

The site retains its pre-launch `noindex` policy until real catalogue and trading information are approved. Razorpay, customer accounts/photos, orders, taxes and shipping calculations remain out of scope. The feature branch has been pushed with approval. The Phase 3 pull request is open; merging and deployment require separate approval. Phase 4 hardening is local on `codex/phase4-security`, with a pending session-security migration. See [Phase 4 results and launch gates](docs/phase-4-verification.md); current launch status is NOT READY until those gates are cleared.

The existing nested `San3D/` and newly observed `San3D-1/` folders are excluded from this work and left untouched. Never stage them with a blanket `git add .`.

The known npm audit findings in the development lint dependency chain remain tracked from Phase 2; do not use an incompatible `npm audit fix --force` downgrade. Check `npm audit --omit=dev` independently when preparing deployment.
