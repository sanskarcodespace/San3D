# Phase 3 verification — 10 October 2026

## Passed locally

- `npm run lint`: zero warnings/errors.
- `npm run build`: successful production compilation and TypeScript check. Storefront and admin routes render dynamically; public product/category slugs are not fixed at build time.
- `npm run test:db`: 11 passing PGlite/PostgreSQL tests covering admin CRUD/audits, anonymous/non-admin denial, role escalation prevention, price/slug constraints, hidden drafts/costs, publication integrity, archiving, cascading deletion, Storage paths/reference protection, atomic rollback, stale-version rejection and role revocation.
- `npm test`: 22 passing Playwright/validation tests covering existing storefront interactions and responsive widths, cart persistence and live stock bounds, anonymous admin redirects, upload/delete origin/auth denial, decoded image formats and limits, form validation, metadata, links and missing-slug HTTP 404s.
- `npm audit --omit=dev`: zero vulnerabilities. The previously known development lint dependency findings remain outside this production-only result.
- `.env.local` is Git-ignored. No service-role or secret API key is used by catalogue administration.

## Hosted read-only checks

The user reported the first SQL migration succeeded. The configured publishable key returned HTTP 200 for products, categories and the availability projection. The live local homepage, shop and admin login responded with HTTP 200; a nonexistent product responded with HTTP 404. No demo products were seeded into Supabase.

## Hosted administrator setup — 11 October 2026

The second migration was verified installed. After explicit approval, the first administrator received the San3D application role; a subsequent owner-run read-only SQL query confirmed membership. No Supabase organisation or database login privileges were granted. The same query confirmed RLS is enabled on all ten catalogue/admin tables and Storage objects, the customer-photo bucket is private, and anonymous SELECT access to production costs is denied. No passwords or secret API keys were requested or exposed.

## Hosted workflow verification — 11 October 2026

Using the administrator's own signed-in browser session, verified:

- Successful login and access to the overview and protected editors.
- Creation of the Home Decorations category with its slug and description.
- Creation of a clearly labelled verification product as a draft. Its public URL returned HTTP 404.
- Multiple PNG uploads through the admin UI to Supabase Storage, image alt text, reordering and persistence after saving.
- Product edits persisted: selling price changed from 49900 to 54900 paise; a synthetic private material cost was saved separately.
- Private product preview showed both images, the updated price and zero stock.
- Publishing changed the catalogue status and immediately exposed the product on the existing storefront without rebuilding or deploying. The public gallery switched images correctly and the zero-stock purchase control was disabled.
- Archiving removed public access; the product URL returned HTTP 404 again. The test product and its referenced images remain recoverable in the archived catalogue. Nothing was permanently deleted.
- The catalogue layout was visually checked at the available 709px browser width without horizontal overflow. A requested 390px override was not applied by the browser, so this does not establish a mobile admin visual pass.

## Remaining validation and launch work

- Hosted permanent deletion, image replacement/deletion, duplication, logout/revocation and category-image upload were not exercised in this session. Related database/validation checks above passed locally.
- Review the signed-in dashboard and editor on actual mobile and wide desktop viewports.
- Add real catalogue products and complete deployment-specific Auth URL/environment configuration before launch. Payments and order processing are outside this phase.

Local PostgreSQL tests use fixture Auth/Storage infrastructure; they complement the hosted browser checks above. No password or secret key was captured. No push, merge, deployment or live payment integration has occurred.
