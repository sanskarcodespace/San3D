# Storefront architecture

## Responsibility boundaries

- `app/(storefront)` composes pages and provides route-level metadata. Product and category routes are generated from the data adapter.
- `components/storefront` contains reusable display and interaction components. Server-side cards and footer do not need client JavaScript; the header, catalogue, product controls and cart opt in to client rendering.
- `features/products/repository.ts` is the replaceable async data source. Only its implementation imports the demo catalogue in application code.
- `features/products/types.ts` defines the stable read model used by cards, product pages and the cart.
- `features/cart/model.ts` validates persisted selections and computes illustrative totals from trusted catalogue data. The browser cannot override a price through local storage.
- `CartProvider` synchronizes a versioned localStorage key through storage events and same-tab notifications. Server snapshots are empty to avoid hydration mismatches. Blocked storage falls back to in-memory state.
- `lib/supabase` and `lib/razorpay` remain documented boundaries. They do not make network calls in Phase 2.

## Product management and a future no-code admin

Suggested persistent entities:

| Entity               | Fields / relationship                                                                                                            |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Category             | Stable ID, unique slug, name, short heading, description, image reference, sort order                                            |
| Product              | Stable ID, unique slug, category relation, title, subtitle, description, material, dimensions, publication status, feature flags |
| Variant              | Stable ID, product relation, SKU, name, colour value, integer price in paise, inventory policy                                   |
| Product media        | Product relation, storage object path, alt text, display order, concept/approved flag                                            |
| Personalisation rule | Product relation, input label, maximum length, validation and design approval requirements                                       |

An admin interface should allow editors to create drafts, upload approved images, edit variants, select featured objects and publish content. Keep schemas, runtime validation and server-side access checks shared by all write paths. Role checks and Supabase row-level security are required; hidden navigation is not access control. Use unique slug constraints, immutable product/variant IDs, audit trails and cache invalidation on publication.

Map those entities to `Product` and `Category` in the repository. Replace the current demo-only marker and visible demo wording only after real data is approved. Expand image lists and per-variant images together rather than pretending the current concept photograph shows every finish. Use pagination/server-side search when a real catalogue grows beyond the small demo set. A larger catalogue should resolve only cart-selected products rather than passing the entire catalogue to the root provider.

## Real ordering prerequisites

1. Implement authentication and an authoritative server-side checkout boundary.
2. Revalidate product publication, chosen variant, personalisation, quantity, inventory and price on every order request.
3. Compute shipping, taxes and totals server-side; persist immutable order snapshots.
4. Add Razorpay order creation and signature verification in server-only modules, with idempotent webhook processing.
5. Publish approved shipping, return, cancellation and privacy information before accepting orders.
6. Add integration tests for duplicate payments, failures, retries, refunds and inventory changes.

The current cart is neither a checkout nor an order record. A WhatsApp draft can include demo selections, but sending it is the visitor's action and does not imply acceptance of an order.

## Quality checks

Run lint and build before browser tests. Playwright starts the production server on port 3100. Tests verify all 21 public pages, internal URLs, image responses and missing-resource 404s, alongside the key interactions and responsive widths. Screenshot artifacts are ignored by Git. Manual browser review complements these tests; automated overflow checks alone do not establish visual quality or full accessibility conformance.
