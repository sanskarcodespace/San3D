# Phase 3: Supabase catalogue and admin dashboard

Status: local admin dashboard, secure session handling, live storefront adapter, image management and both migrations implemented. Both hosted migrations and the application administrator role are verified. Final hosted review covered fresh login/logout, product/category/image workflows, duplication, replacement/deletion, preview, publication and archiving, plus 390px/768px/1440px layouts. See phase-3-verification.md for coverage limits.

Branch: `feat/supabase-admin`, created from the pushed Phase 2 commit `ca009a6`.

## Inspection findings

- The product repository currently returns the isolated demo catalogue. No Supabase SDK, schema, clients or authentication exist yet.
- Storefront cards, product details and cart use stable product/variant IDs and integer paise. Preserve these contracts, extending rather than replacing the existing fields.
- Product types currently require `isDemo: true`; imagery, price labels and cart text also assume demo mode. Make those conditional on the data source, while keeping checkout unavailable.
- The current gallery has one concept image plus a texture crop. Extend it to real ordered images with alt text without changing the premium visual layout.
- Public routes currently use generated demo slugs. Published products must also resolve on demand and refresh without a rebuild.
- The current admin and Supabase directories contain planning notes only.
- At initial inspection, `.env.local` was absent. It now contains the configured project URL and publishable key and remains ignored by Git. No usable secret/service-role key was provided or needed.
- The nested `San3D/` repository remains untouched and is outside this implementation.

## Implementation sequence

### 1. Database, integrity and access control

Create version-controlled migrations for categories, products, product images, tags, product/tag relations, variants, inventory, administrator membership and audit logs.

Support names, unique slugs, short/detailed descriptions, category and tags, ordered images and alt text, colour/size/material variants, selling and compare-at prices, filament grams, print minutes, material/labour costs, stock or made-to-order settings, personalisation, lead times, featured/bestseller flags, publication status and SEO metadata. Store money as integer paise with database constraints as well as server validation.

Separate private costing/operational data from the public catalogue read model. Do not assume RLS hides columns: public access must not expose material costs, labour costs, admin roles or audit data. Allow public reads only for published products and the data necessary to display them. Restrict all admin reads/writes through server authorization and RLS. Never allow users to self-assign roles through editable profile metadata.

Use transactional operations for product/variant/tag/image metadata updates, publication and duplication. Validate publishability, including a valid sellable variant, before publication. Record mutations through database audit triggers; clients cannot forge or alter audit entries. Use explicit confirmations for archive/delete operations, with clear dependent-data behaviour.

### 2. Authentication and administrator bootstrap

Implement request-scoped Supabase SSR clients, cookie session refresh and `/admin/login`. Verify the session and current administrator membership for every protected read and mutation, not just in navigation or a route layout. Keep admin responses uncached and handle expired/revoked sessions.

Provide a documented first-admin procedure using a real Supabase Auth user UUID and an owner-run SQL grant after migrations. Do not hard-code an email, password or account ID. Application catalogue operations should use the signed-in user's session and RLS rather than a service-role bypass.

### 3. Admin dashboard

Create a responsive dashboard with published/draft/category counts, low-stock results and recent catalogue activity. Add searchable management lists and form-driven product/category editing, tags, variants, pricing, discounts, costs, production estimates, inventory and publication flags.

Support adding, editing, duplicating, previewing, publishing, unpublishing, archiving and deleting products. Provide category image/description/order management. Include pending, validation, denied-access, failure and empty states. Keep draft preview behind the same administrator checks as editing.

### 4. Storage and image lifecycle

Create a dedicated public catalogue-image bucket with administrator-only writes. Validate authentication, byte limits, JPG/PNG/WebP signatures and decoded image validity server-side. Generate object names server-side; reject arbitrary object paths and foreign bucket URLs. Add Storage policies and bucket type/size restrictions as independent enforcement.

Support multiple uploads, replacement, accessible reorder controls, alt text and deletion with safe database/storage sequencing. Public catalogue assets are not confidential. Future customer personal-photo uploads must use a separate private bucket and scoped access; no customer-upload endpoint is part of this phase.

### 5. Storefront integration

Replace only the data adapter and necessary demo assumptions while preserving the storefront's design, responsive behaviour and cart compatibility. Map approved public fields into existing component contracts. Load multiple images, variants, categories, tags and SEO values from Supabase.

Use server-side reads and publication-aware cache invalidation for lists, categories, individual products and metadata. Resolve newly created slugs without redeployment. Never silently substitute demo data for a live database failure. Keep demo content available only through a clearly labelled, explicit development/test mode.

Handle empty databases, unpublished/archived products, changed variants and sold-out versus made-to-order products honestly. Keep real payment/order placement disabled.

### 6. Verification and delivery

Run lint, production build, TypeScript checks and existing storefront regressions. Add database/integration tests for anonymous and non-admin denial, admin CRUD, role escalation denial, private-field isolation, duplicate slugs, price validation, publication, archive/delete and image upload constraints. Exercise the real Supabase policies rather than treating mocked authorization as proof of security.

Run browser tests for admin login, product/category editing, multiple image management, draft preview and publication appearing on the storefront. Review desktop and mobile layouts. Document which checks require configured Auth accounts/database access and report any that remain unverified.

After implementation and verification, create the local commit `feat: integrate Supabase and admin product management`. Do not push, merge or deploy without user approval.

## Current setup checkpoint

The San3D Supabase project is created and its Auth settings endpoint responded successfully using the configured publishable key. Packages `@supabase/server`, `@supabase/ssr`, `@supabase/supabase-js`, `server-only` and `zod` are installed. PGlite is a development-only dependency for local PostgreSQL tests.

The initial migration is `supabase/migrations/202610100001_catalogue.sql`. Eleven local tests cover database CRUD, RLS, publication integrity, private-field access, image path policies and admin revocation. These execute PostgreSQL with fixture Auth/Storage infrastructure; hosted Auth, PostgREST and Storage uploads have also been exercised through the signed-in UI. The application now uses the live Supabase catalogue by default. The original demo catalogue is isolated behind explicit local development/test configuration. Admin overview, product/category editors, private preview, publication actions and image/media management are implemented.

Both migrations are installed. The user created the Auth account privately and explicitly approved granting its San3D application administrator role. Role membership, RLS, private customer-photo storage and anonymous production-cost denial were verified. Setup instructions remain available in [Supabase setup](supabase-setup.md). No secrets belong in chat, migrations, committed documentation or source code.

References: [Supabase Next.js quickstart](https://supabase.com/docs/guides/auth/quickstarts/nextjs), [SSR client setup](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [API key types](https://supabase.com/docs/guides/getting-started/api-keys).
