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

## Still required

1. Apply `202610100002_atomic_product_save.sql` in the hosted SQL Editor, once.
2. Create the first Supabase Auth user and grant its UUID membership in `admin_roles` using the owner-run instructions.
3. Sign in at `/admin/login` and verify the dashboard counts, create/edit/category/image workflow, draft preview, publication appearing on the live storefront, archive/delete, and logout/revocation behaviour through the hosted services.
4. Visually inspect the signed-in dashboard/editor at desktop and mobile widths after account setup.

Local PostgreSQL tests use fixture Auth/Storage infrastructure. They do not substitute for hosted Auth and Storage HTTP tests. No authenticated hosted end-to-end success is claimed. No push, merge, deployment or live payment integration has occurred.
