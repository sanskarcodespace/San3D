# San3D architecture

## Request and data boundaries

`app/(storefront)` composes the established premium UI. Its server-only product repository maps published PostgreSQL rows into the existing `Product` and `Category` contracts. Additional optional fields cover galleries, SEO, tags, availability, discounts and personalisation limits. Cart selections retain stable product/variant IDs and integer-paise prices.

Storefront routes are dynamically rendered. Public Supabase requests use `cache: no-store`; React `cache` deduplicates reads within a render. Admin actions invalidate the root layout after changes. New slugs and publication changes are therefore visible on subsequent requests without redeployment, including changes made outside the app. Existing open browser tabs refresh on navigation/reload. Missing product/category URLs resolve before streaming and return 404.

`SAN3D_CATALOGUE_SOURCE=demo` explicitly selects the isolated development catalogue. Production-mode local tests also require `SAN3D_ALLOW_DEMO_PREVIEW=true`. There is no automatic fallback on database failure. Do not enable demo mode on hosting.

## Authentication and authorisation

`lib/supabase/server.ts` creates request-scoped Supabase SSR clients. The admin proxy refreshes cookies, but does not serve as the only access check. Every data read, Server Action and image route verifies `auth.getUser()` and the database's `is_catalogue_admin()` function. Roles are UUID-based rows managed only by the database owner. Clients cannot self-promote through profile metadata.

Cookies are HTTP-only, SameSite=Lax, Secure on production HTTPS. The app uses no browser auth client and no service-role credentials. Supabase's hosted authentication handles password verification and auth rate limiting. Next Server Actions and explicit image-route Origin checks protect mutation boundaries. Admin routes are dynamic and use private, no-store headers. Revocation takes effect on the next protected operation.

## PostgreSQL model

| Table                        | Purpose and access                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------------------- |
| products                     | Product content, category, SEO, publication and merchandising flags; published reads public |
| categories, tags             | Public discovery metadata; writes admin-only                                                |
| product_images, product_tags | Ordered alt-tagged assets and tag relations; public only for published parents              |
| variants                     | Stable IDs, SKU, colour/size/material and integer-paise prices; published parents public    |
| inventory                    | Stock/made-to-order settings; direct access admin-only                                      |
| product_production           | Filament weight, print time and material/labour costs; admin-only                           |
| admin_roles                  | Owner-granted UUID membership; users may only read their own role                           |
| audit_logs                   | Trigger-written old/new records; admin reads, no client writes                              |

`catalogue_availability()` exposes only published variant ID, mode and quantity. Private fields are separated into tables; RLS is not relied upon to hide columns. Functions that need owner privileges have fixed empty search paths, qualified object names and restricted execution grants. The atomic save RPC is security-invoker and enforces admin membership plus RLS.

`save_catalogue_product` locks the current product row and compares its version before replacing child metadata in one transaction. Stable variant IDs preserve valid cart selections. Deferred publication checks validate the final state, so failed images/variants/stock cannot leave half-saved published content. Child identity/parent changes are prohibited. Database constraints enforce unique slugs/SKUs, integer prices and bounds. Audit triggers cover mutations and role changes.

## Images

The upload endpoint authenticates before reading multipart files, enforces 5 MiB and 25-million-pixel limits, checks declared MIME against decoded JPEG/PNG/WebP format, rejects animation and re-encodes to WebP. Generated UUID paths prevent traversal and overwrite. Buckets independently restrict size and MIME. No untrusted HTML or SVG uploads are accepted.

`catalogue-images` is public, including draft assets. It must not contain private customer photos. Metadata saves happen before unused object cleanup; policies protect files referenced by products or categories, including duplicated products. Failed/abandoned uploads can be removed in the media library. `customer-photos` is private with no application access policy or endpoint.

## Admin interface

Server-loaded pages use shared role checks; client editors hold unsaved form state. Zod schemas validate unknown mutation payloads server-side, with database validation as a second layer. Product preview is an unsaved, private editorial preview. Publishing/unpublishing changes the public catalogue; archive/delete operations require confirmation. Duplicate creates a draft with fresh variant IDs/SKUs and zero stock.

Categories currently use last-write-wins editing. The UI supports up to 30 product images, 100 variants and 30 tags; database queries paginate when listing records. No bulk imports, order management, customer management or payment operations are included.

## Cart and future checkout

The browser-local bag validates persisted input, looks up authoritative catalogue prices and drops obsolete selections. Inventory limits improve the selection experience but are not stock reservations. Customer personalisation is plain text, bounded by product rules. Image variants are selected as options; gallery images are not simulated personalised renderings.

Future checkout must validate publication, price, personalisation and aggregate stock server-side; reserve/decrement inventory transactionally; calculate shipping and tax; persist immutable order snapshots; create Razorpay orders and verify signatures with idempotent webhooks. Publish approved trading policies before enabling sales. No payment buttons or order endpoints pretend these operations exist now.

## Verification boundaries

PGlite tests execute both migrations and actual PostgreSQL constraints, transactions and role/RLS semantics using fixture `auth.uid()` and Storage system tables. Playwright checks the existing demo-mode storefront, cart compatibility, anonymous admin denial and image endpoint origin/auth denial. Separate validation tests exercise pricing, publication and decoded image rules. Hosted signed-in Auth, product CRUD, file uploads and full dashboard browser flows require the configured admin account and second migration; these remain a setup checkpoint, not an assumed pass.
