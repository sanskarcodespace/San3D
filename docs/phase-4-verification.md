# Phase 4 security and launch-readiness review

Review: 11–12 October 2026. Status: **NOT READY** for production launch.

Active application: `/Users/sanskar/Desktop/San3D`, origin `https://github.com/sanskarcodespace/San3D.git`. Local work is on `codex/phase4-security`, based on pushed Phase 3 commit `340b3e4`. The original security commit 85919ee was pushed with approval; PR #2 targets feat/supabase-admin. No merge or deployment has occurred. No production data or accounts were changed. A separate staging project, `tdmiwxraesyzvdcuqclf`, was subsequently created by the user and explicitly approved for migrations. Production `jpzcmamxvcnriejohjwn` remains unchanged. See the staging results below.

## Findings and fixes

1. **Session revocation gap:** membership alone could admit a still-valid JWT after logout removed its Auth session. Migration `202610110001_session_security.sql` replaces the existing private authorization predicate with a live membership, matching session/user, session `not_after`, account ban and soft-delete check. Existing table policies, Storage policies and the public authorization RPC inherit this check. Auth tables are not exposed. Signature and JWT expiry verification remain the responsibility of Supabase's gateway/Auth, not a client-side decoder. The migration is **applied to isolated hosted staging only, not production**. This follows [Supabase's session guidance](https://supabase.com/docs/guides/auth/sessions).
2. **Previously rendered admin pages:** a client boundary checks the uncached server authorization endpoint on navigation, focus and restoration, conceals content while checking, and checks visible tabs every 30 seconds. Hidden tabs conceal content; failures conceal it until recovery. Server actions, API routes and RLS remain independent guards. This cannot erase information already downloaded or screenshots, and an active visible page can display previously loaded content until its next check. Hosted revocation guarantees depend on applying the migration.
3. **Unbounded multipart parsing:** the image endpoint previously relied on optional Content-Length before parsing. Actual streamed bytes are now capped at 6 MiB (including multipart overhead), followed by the existing 5 MiB image and decoded-format limits. Image deletion JSON is capped at 4 KiB. Authorization still precedes body reading.
4. **Logout errors:** provider sign-out errors are no longer ignored. Failed sign-out reaches the error boundary rather than announcing successful logout; successful sign-out redirects normally. Hosted failure injection remains unverified.
5. **Response hardening:** added nosniff, frame denial, referrer and browser-permission restrictions and CSP frame/base/object restrictions. This is deliberately a limited CSP, not a full script nonce/XSS policy. Admin responses remain private/no-store even when configuration is absent.
6. **Nested checkout included in checks:** root ESLint and TypeScript now exclude `San3D/` and `San3D-1/`. Neither nested directory was changed.

## Dependency audit

| Affected installed package | Severity | Reachability |
| --- | --- | --- |
| braces 3.0.3 | High | Root advisory, development lint glob parsing |
| micromatch 4.0.8 | High | Transitive braces dependency |
| fast-glob 3.3.1 | High | Transitive micromatch dependency |
| @next/eslint-plugin-next 16.4.0 | High | Transitive fast-glob dependency |
| eslint-config-next 16.4.0 | High | Direct development dependency |

Before: **5 high, 0 production findings**. After: **5 high, 0 production findings**, confirmed by `npm audit --json` and `npm audit --omit=dev --json`. These are five affected dependency entries for one advisory: [GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm), stack exhaustion from deeply nested brace patterns. The chain is not used by the production application runtime. Untrusted glob patterns/configuration during lint/build can cause denial of service; CI should use bounded execution and minimal permissions.

The registry still reports braces 3.0.3 as latest, without a patched release. Updating fast-glob to 3.3.3 would retain vulnerable micromatch/braces. npm's proposed eslint-config-next 14.2.35 downgrade is incompatible with the current Next 16 setup. No force fix, arbitrary override, new dependency or misleading advisory suppression was applied. Package manifests and lockfile are unchanged.

## Verification results and boundaries

| Check | Result | Environment / limits |
| --- | --- | --- |
| `npm run lint` | Pass, zero warnings | Local active repository only |
| `npm run typecheck` | Pass | Local TypeScript |
| `npm run build` | Pass | Local optimized production build; not a deployment |
| `npm run test:db` | 21/21 pass (16 database + 5 tooling isolation/approval tests) | PGlite PostgreSQL with fixture Auth/Storage infrastructure |
| `npm run test` and `npm test` | 29/29 pass on each run | Chromium against local production-mode demo server |
| Product CRUD, atomic save, stale edit rejection, integer prices, invalid publication rollback, publish/unpublish/archive, child deletion and image-reference protection | Pass | Local database suite; no production mutations |
| Regular-user write denial, no self-grant, private costs/audit denial, all ten application tables retain RLS | Pass | Local PostgreSQL identities, not real hosted test users |
| Missing/malformed/foreign session ID; expired session `not_after`; removed session; banned, soft-deleted and hard-deleted account; active role revocation | Pass | Local database fixtures. Does not prove hosted JWT expiry, refresh-token lifecycle or provider account-deletion timing |
| Image format spoofing, invalid bytes, size limits, stream limit without or with dishonest Content-Length | Pass | Local image/body tests |
| Anonymous admin pages, image API authorization and cross-origin rejection, uncached session endpoint | Pass | Local production HTTP server |
| Search, filtering, sorting, gallery, variants, personalisation, cart persistence, empty state, public routes/internal links and metadata | Pass | Local demo catalogue; database persistence covered separately |
| Public storefront and login responsive tests | Pass at 320, 390, 768, 1440px | Local Chromium; not all browser/device families |
| Existing authenticated dashboard at 390px; product editor at 390, 768, 1440px; navigation through session boundary | Pass, no horizontal overflow | Local dev frontend with existing hosted admin session; read-only navigation. No captured console errors on inspected tab |
| Anonymous production-cost, audit, direct inventory and admin-role reads | HTTP 401, denied | Fresh read-only hosted Supabase requests |
| Invalid bearer token at Auth user endpoint | HTTP 403, denied | Fresh read-only hosted request; no credentials printed |
| Anonymous published-product read | HTTP 200, zero products | Hosted catalogue currently has no published products; not a storefront failure |
| Fresh login/logout, duplication, uploads/replacement/deletion and category imagery | Previously verified in Phase 3 | Historical evidence only; not claimed as fresh Phase 4 hosted mutation tests |
| Real staging admin and regular-user login, seeded private-cost read denial, protected write/upload denial, malformed save and invalid token | Pass | Real hosted staging Auth/PostgreSQL/Storage, publishable-key clients |
| Browser login/logout, old-token denial after global logout, oversized upload 413, malformed image 400, valid uploads and deletion of own unreferenced uploads | Pass | Local frontend on localhost:3200 with real hosted staging backend |
| Session not_after expiry, active role revocation, existing JWT mutation denial, cached dashboard redirect and API 403 | Pass | Real staging session and membership changed with owner access; no production changes |
| Naturally expired signed JWT, hosted banned/deleted account and refresh-token lifecycle | **Not verified on hosted backend** | Local database cases pass; not_after expiry is not signed-JWT expiry |
| Hosted product/category persistence, image replacement/shared-image protection and approved duplicate deletion | Pass | 13 October staging UI runs; exact fixtures and retained data in staging-verification.md |

A new RLS coverage test initially expected eleven tables instead of the actual ten; it was corrected to assert the explicit table-name list. The final database suite passes. No application failure was hidden or test skipped.

## Secrets and configuration

A pattern scan of all five reachable Git commits found no matches for secret Supabase keys, private keys, GitHub token prefixes or assigned service-role credentials. This is a targeted scan, not proof that arbitrary secrets cannot exist. Only `.env.example` is tracked. `.env.local` is ignored and mode 0600; node_modules and generated artifacts are ignored. No credentials were logged or added.

Local configuration uses an HTTPS Supabase URL, a publishable key, live catalogue defaults, no service-role key, no demo-preview override and secure cookies by default in production. The project does not require a service-role key for admin operations. Cookie security on the HTTP Playwright server is explicitly disabled only by test-server configuration.

Storage policy review: public catalogue bucket with constrained admin insertion, generated UUID paths, no object overwrite policy and deletion only when unreferenced. Customer photos use a private bucket with no client policy. Public catalogue assets attached to drafts remain public by design and must never contain private customer photos. The local suite covers these rules; hosted bucket settings were not modified.

## Launch gates / remaining limitations

1. Obtain approval before applying `supabase/migrations/202610110001_session_security.sql` as the database owner. Confirm Auth schema compatibility and the function's owner privileges. Keep RLS enabled; do not grant clients Auth-table access. See the setup guide. Until applied to production after approval, production RLS retains the original session-revocation gap.
2. Staging is provisioned and the real-account smoke suite passed. Complete naturally expired JWT, refresh-token lifecycle and hosted banned/deleted-account checks; these remain local-only. Never perform destructive account tests against the sole production administrator.
3. Repeat full hosted product/category/image workflows in staging, including duplicate/shared images, referenced-object deletion denial, category replacement, archival, deletion and persistence after reload. Local tests are not a substitute for this integration check.
4. Configure and verify the actual HTTPS deployment domain, Supabase Site URL and exact redirect allowlist, production environment variables, secure cookies, Auth rate limits/email delivery, backup/restore and monitoring. Confirm provider/edge cache behavior, upload request limits, HTTPS/HSTS and headers on the deployed origin. No production domain or deployment is verified here. Do not enable demo preview or insecure-cookie overrides on hosting.
5. Approve a real published catalogue and trading information before removing pre-launch noindex. Checkout, payments, customer uploads, orders, shipping/tax calculation and stock reservation are not implemented; the site must not imply otherwise.
6. Full WCAG audit, assistive technology checks, Safari/Firefox, real-device testing and production performance/load measurements remain outstanding. Current automated checks cover labels, navigation and responsive overflow; the design is preserved. The catalogue currently loads all published products for filtering/cart hydration; scale testing and narrower queries are needed for large catalogues. Category edits remain last-write-wins.
7. Track the development-only braces advisory and install a compatible patched lint chain when available. A production audit of zero is not a guarantee of application security.

## Nested directory inventory

- `San3D/`: `.git/` and `.kilo/.gitignore`; one non-Git file, no application files. Separate Git metadata.
- `San3D-1/`: older Phase 2 checkout, 57 non-Git files; `src/`, `public/`, `docs/`, `tests/`, package/configuration files and `.git/`. It is a duplicate checkout, not the active application.

Both remain untracked in the parent repository and untouched. No files were moved or deleted. Stage explicit active-project paths only.

## Staging results — 12 October 2026

The approved staging target is `tdmiwxraesyzvdcuqclf`. All three migrations succeeded after prerequisite review; all ten application tables retain RLS. The private function is postgres-owned, SECURITY DEFINER, with empty search_path and no PUBLIC execute grant. SQL Editor execution does not register CLI migration history; reconcile that before future CLI deployment.

The user privately supplied the staging secret. The provisioning script verified both fixed UUID/email pairs and generated independent passwords stored only in ignored mode-0600 files. No secret entered application code, test logs or the preview process. Ordinary application and test requests use the publishable key, not the provisioning secret.

The complete staging smoke runner passed. Its first three attempts stopped at the upload origin check: Next normalized the loopback request origin, while the test used 127.0.0.1. Running the browser harness at canonical localhost resolved the mismatch without weakening the application's origin check. Those attempts retained three draft fixtures; the successful run retained a fourth draft (`1cba897a-4ae3-4273-892c-70e539dca2d5`). All are synthetic “Staging security QA — not for sale” drafts, never published. Two generated upload objects from the successful run were deleted through the authenticated API. No pre-existing catalogue record was deleted.

The staging test admin's role was removed with explicit user approval and remains revoked. Its active JWT lost database write access, the open dashboard redirected to login and its session API returned 403. Owner-controlled session not_after expiry also denied access. These are real hosted-backend checks with a local frontend, not verification of an HTTPS-deployed application.

PR [#1](https://github.com/sanskarcodespace/San3D/pull/1) remains OPEN and MERGEABLE, `feat/supabase-admin` → `main`, mergedAt null. No merge, push or deployment occurred.

Detailed privilege/rollback review: [session migration review](session-migration-review.md). Reproducible isolated workflow: [staging verification](staging-verification.md).

## Exact changed files

All paths below are relative to the active repository. The changes are related to Phase 4 security, regression tests, isolated staging tooling or documentation; no unrelated storefront redesign or nested-folder modifications were found.

- `.gitignore`
- `README.md`
- `docs/architecture.md`
- `docs/phase-4-verification.md`
- `docs/session-migration-review.md`
- `docs/staging-verification.md`
- `docs/supabase-setup.md`
- `eslint.config.mjs`
- `next.config.ts`
- `scripts/provision-staging-users.mjs`
- `scripts/staging-preview.mjs`
- `scripts/staging-target.mjs`
- `scripts/verify-staging.mjs`
- `src/app/admin/(protected)/layout.tsx`
- `src/app/api/admin/images/route.ts`
- `src/app/api/admin/session/route.ts`
- `src/features/admin/actions.ts`
- `src/features/admin/bounded-body.ts`
- `src/features/admin/components/session-boundary.tsx`
- `src/proxy.ts`
- `supabase/checks/staging-prerequisites.sql`
- `supabase/migrations/202610110001_session_security.sql`
- `tests/admin-access.spec.ts`
- `tests/admin-images.spec.ts`
- `tests/database/catalogue.test.mjs`
- `tests/database/staging-target.test.mjs`
- `tsconfig.json`

## Staging continuation — 13 October 2026

Commit `85919ee` was pushed with approval and is under review in PR #2 (`codex/phase4-security` → `feat/supabase-admin`); earlier “not pushed” statements describe the original verification snapshot. No merge or deployment has occurred.

After a separately approved staging-only role restoration, the new real UI workflow suite passed category create/edit/image/order persistence, product create/edit/preview/reload, image reorder, duplication with stock reset, publish/unpublish/archive, public detail without redeployment, private-cost denial and shared-image deletion denial. Editor layouts passed at 390, 768 and 1440px. See `staging-verification.md` for exact retained fixture IDs and scope. This supersedes the pending status for those specific workflows, not the broader integration cases. Subsequent explicitly approved fixture tests also passed category/product image replacement, shared-image preservation and duplicate deletion with child-row cascades. The original archived product remains intact.

Natural JWT expiry/refresh observation is running with tokens held only in memory; only pre-expiry authorization has passed so far. Do not count pending timer assertions as successful. New local verification scripts are `scripts/verify-staging-workflows.mjs` and `scripts/verify-staging-expiry.mjs`. Application source, migrations, production and nested directories were not modified in this continuation. Launch status remains NOT READY.

The new fixture-specific runner is `scripts/verify-staging-replacement.mjs`; all three new scripts pass lint and syntax checks. No application source changed, so the prior build and 18/29 regression counts remain historical results at 85919ee, not fresh full-suite results for this continuation. Natural-expiry assertions are still pending.

## Local review completion — 13 October 2026

Scope reviewed: two updated verification documents, three new staging-only runners and three new script-guard tests. No application source, dependency versions, database migrations, credentials or nested checkout files changed. PR #2 remains open against feat/supabase-admin; no additional PR was created.

Fresh local commands all passed: lint, typecheck, build, npm run test (29/29), npm test (29/29), test:db (21/21 after adding approval/identity guards). Both requested audit commands ran: full audit reports five high development entries (expected nonzero audit status), omit-dev reports zero. No downgrade or forced fix was applied. The warnings from Playwright's FORCE_COLOR/NO_COLOR environment do not represent failing tests.

Fresh read-only staging REST denied anonymous costs, audit logs, inventory and admin-role reads with HTTP 401; the archived fixture remained invisible. The existing local staging session API returned HTTP 403 and no-store. No authenticated mutation suite was rerun during this final review.

Script review tightened execution: every new runner requires --approved-staging-state-changes and the exact synthetic admin identity before network work; the fixture cleanup additionally requires --approved-fixtures and verifies exact IDs. These flags record operator intent, not a substitute for fresh user approval. Scripts never grant roles or run migrations. Passwords come from ignored local environment files, public-key clients perform tests, and no raw exception/page content or token is printed. The workflow now uses a separate anonymous browser context; nonempty duplicate inventory, explicit privilege-denial errors and successful Storage listing checks prevent several false-positive assertions. Real workflow passes described above preceded these test-harness refinements; the destructive runners were deliberately not rerun. Guard tests and lint/syntax checks passed for the revised scripts.

The natural-expiry process still holds its original token only in memory and is awaiting 09:35:40 IST. The user approved completion of its own refresh/logout steps in this turn; no role change, other-session revocation or record deletion is approved. Until its output is collected, natural expiry and refresh remain UNVERIFIED. This limitation is preserved in this commit; its title does not assert that every hosted launch gate is complete.

Remaining unverified checks include refresh-token reuse-window behavior, browser refresh failure handling, hosted banned/deleted accounts and broader live-data search/filter/cart coverage. HTTPS deployment configuration, production migration approval, accessibility/browser breadth and production operations remain launch gates. Status stays NOT READY.

Files in this follow-up:

- docs/phase-4-verification.md
- docs/staging-verification.md
- scripts/verify-staging-expiry.mjs
- scripts/verify-staging-workflows.mjs
- scripts/verify-staging-replacement.mjs
- tests/database/staging-script-guards.test.mjs
