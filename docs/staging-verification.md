# Isolated staging verification

Target: **San3D Staging**, `tdmiwxraesyzvdcuqclf`, Singapore. Production `jpzcmamxvcnriejohjwn` is forbidden for this workflow. The Supabase “main PRODUCTION” label is the default branch of the separate staging project, not the production San3D project.

The user approved this exact target before migrations. All three versioned migrations succeeded in its SQL Editor on 12 October 2026. Initial read-only prerequisites found zero public tables and all required Auth columns/functions and owner read permissions. After migration: ten application tables, all RLS enabled, private authorization function owned by postgres, SECURITY DEFINER, empty search_path and explicit postgres/anon/authenticated execution ACL with no PUBLIC entry. SQL Editor application does not register CLI migration history; reconcile before any future CLI workflow.

## Credentials and local isolation

`.env.staging.local` is ignored and mode 0600. It contains this staging URL and publishable key plus privately generated test-account passwords. Never commit, echo or screenshot its contents. The application and verification requests use only the publishable key. Optional account provisioning uses the existing staging-only secret key in a separate ignored 0600 `.env.staging-admin.local`; it is never passed to the preview server or application requests. The scripts pin the exact approved reference and reject another project, missing configuration and secret keys.

Two synthetic users only: `admin-qa@example.test` and `viewer-qa@example.test`. Their passwords can be entered privately by the user or generated through the staging Auth API after explicit authorization. The test admin role requires explicit approval; the viewer remains unprivileged. No real accounts or customer information are copied.

Start the separate preview:

```sh
node --env-file=.env.staging.local scripts/staging-preview.mjs
```

It binds `127.0.0.1:3200`, uses a separate `.next-staging` output and explicitly selects staging/live catalogue variables. Node's process environment takes precedence over Next's `.env.local`; the existing production-connected local configuration is neither rewritten nor used for the Supabase target. The preview disables Secure cookies only for this loopback HTTP server. Do not deploy this launcher.

With both private test passwords saved and the staging admin role approved:

```sh
node --env-file=.env.staging.local scripts/verify-staging.mjs
```

The script authenticates real staging users, tests direct RLS against seeded private costs, denied mutations/uploads, malformed saves/tokens, browser admin/regular-user login, logout, retained-token revocation, oversize/malformed/valid image requests and deletion of its own unreferenced test objects. It pauses for owner-controlled staging SQL before session-expiry and active-role-revocation checks. It does not mutate production, print tokens/passwords, record traces or persist browser sessions. A uniquely named draft and its private test-cost row are retained for inspection; it never publishes them.

## Owner-controlled test operations

Execute only in the staging SQL Editor after checking the project reference again. Use the verified synthetic user's UUID, never the production admin UUID. The runner prints the test UUID but no tokens.

For the expiry pause, set only that test user's existing sessions' `not_after` into the past. This tests hosted session time limits, not cryptographic expiry of a signed JWT; the latter needs a naturally expired token and must be reported separately. A fresh password login creates a new session; do not extend the expired session.

For role revocation, obtain approval before removing only the synthetic admin membership. The runner verifies that the previously issued JWT and existing browser session lose access. Leave the test membership revoked at completion; restoring it requires another approved grant. Never disable RLS or relax a policy to make a test pass.

## Results

The complete real-account smoke harness passed on 12 October 2026 against the hosted staging backend and a local frontend at http://localhost:3200. Both account logins, non-admin/anonymous restrictions, seeded private-cost protection, malformed input, oversized input, uploads/deletion, logout token revocation, session not_after expiry and active role revocation passed. The test-admin membership was removed with approval and remains revoked; rerunning requires a separately approved grant. Four synthetic drafts are retained from three diagnostic attempts and the successful run. Naturally expired signed JWTs, hosted banned/deleted accounts and full category/product workflow rechecks remain outstanding. Use localhost in the harness because Next normalizes loopback origins; no origin guard was weakened. See `phase-4-verification.md` for the final result matrix and `session-migration-review.md` for privilege and rollback analysis.


For explicitly authorized provisioning of the two existing synthetic accounts only:

```sh
node --env-file=.env.staging.local --env-file=.env.staging-admin.local scripts/provision-staging-users.mjs --rotate-test-passwords
```

This verifies both fixed UUID/email pairs, generates independent strong passwords, confirms only those test accounts and saves each successful credential privately. It never grants a role. Do not run it against production; the same strict target guard applies. The staging secret is used only in this server-side provisioning script, never in UI bundles or the regular verification runner.

## Continuation — 13 October 2026 (in progress)

The user explicitly approved restoring only the synthetic admin role. A provisioning API attempt was denied with PostgreSQL 42501; no grants were broadened. The approved owner SQL grant then succeeded and ordinary-user login/RPC verified administrator access. The viewer remains unprivileged. No migrations were rerun.

`verify-staging-workflows.mjs` passed real UI category creation/image/order/edit persistence; product draft creation, preview, image reordering, edit/reload persistence; editor overflow checks at 390/768/1440px; duplication with unique slug, draft status and zero stock; publication and public detail without redeployment; anonymous private-cost denial; shared-image deletion denial; unpublication and archival. The test uses generated images and publishable-key sessions against staging with a local frontend. Initial attempts exposed overly strict test selectors for labels containing textarea/select content, not failed database saves; those selectors were corrected. Existing fixtures are retained.

Successful run fixture manifest:

- Archived original product: `983e4513-96e7-4b0b-9799-3992fb18ef86`.
- Draft duplicate: `a45722ba-0381-492d-a9b3-d0c728318cfc`.
- Category: `bb9f8ac7-7f35-460f-b583-3abe5db7ff0e`.
- Category image: `catalogue/a9fb7dd9-c944-4d66-afc1-f30edaa4b645.webp`.
- Shared product images: `catalogue/9231487f-928a-45ce-9c92-565e4cf2f6d4.webp`, `catalogue/1f4d2a35-5d9d-49c4-8a4d-b36e524b10dc.webp`.
- Diagnostic attempts retained categories `3bf21295-077c-450f-ab05-927ad6900f3f`, `2dfa16a5-1d75-460c-8621-2bb0f3c0487d`, `f234e04b-e4d8-41f4-b8de-69b9607dacfd` and their synthetic images. No cleanup of these is authorized or attempted.

`verify-staging-expiry.mjs` started an isolated session with auto-refresh disabled and passed pre-expiry admin authorization. It keeps tokens in memory and waits for actual JWT expiry plus 65 seconds, without modifying session timestamps or project settings. The observation is scheduled for **13 October 2026, 09:35:40 IST (04:05:40 UTC)**. The test then checks Auth/REST expiry denial, refresh after expiry, renewed authorization, local-session logout and denial of retained access/refresh tokens. **These later assertions are pending, not passed.** Do not globally sign out the synthetic admin or revoke its role during this observation; that would confound natural expiry. This run does not test refresh-token reuse outside the provider reuse window or browser refresh failure handling.

The user subsequently approved the exact category-image and duplicate-product deletions. `verify-staging-replacement.mjs --approved-fixtures` passed category replacement and approved old-object removal, product replacement with shared-object preservation, reload persistence, duplicate deletion with image-row/variant cascades, and preservation of the archived original and shared upload. The duplicate listed above is now deleted; its shared Storage files remain. Retained replacement category image: `catalogue/3f3bb39c-520f-4921-9d68-80d3fd2f7b77.webp`. Retained replacement product image: `catalogue/9421598e-f04c-4716-bfea-83a90b642b51.webp`. No other cleanup was performed. Hosted ban/deletion cases, broader storefront search/filter/cart integration with these fixtures and refresh-token reuse remain outstanding. New scripts and this update are local only; no further commit or push has occurred.


## Final script review and local regression — 13 October 2026

For future runs, obtain fresh approval before session or fixture mutations and pass `--approved-staging-state-changes` to each new runner. The replacement runner also requires `--approved-fixtures`; its original approved duplicate has already been deleted, so it is historical fixture-specific evidence, not a generally rerunnable cleanup tool. Do not retarget it without reviewing the new fixtures and obtaining approval. Never rerun migrations for these tests.

All new scripts pin the staging project through stagingConfig, verify the synthetic administrator identity, use only public-key clients for assertions and keep credentials out of logs. They assume localhost:3200 is the preview started with scripts/staging-preview.mjs and the pinned staging environment; verify that prerequisite before execution. They do not independently attest the configuration of an arbitrary process on that port. Automatic browser dialogs are restricted to the run's synthetic archive or explicitly approved duplicate deletion. No general cleanup, role management or account deletion is performed. Local-session sign-out in finally is a state change and is covered by the required fresh session approval.

Final review removed raw browser exception/status logging, tightened duplicate-stock and Storage deletion assertions, and separated the public browser context. These revised mutation runners were not rerun without new approval. Approval/identity guard tests pass for all three scripts; database plus tooling tests total 21/21. Lint, typecheck, build and two Playwright runs (29/29 each) passed. Audit remains five high development entries and zero production entries. Read-only staging private-table denials, archived-product invisibility and anonymous no-store API denial passed again.

The existing expiry process is still pending at this review snapshot. User approval now covers its own refresh/logout sequence after the scheduled observation. Do not claim natural signed-JWT expiry, refresh success or revoked-refresh denial until its actual output is collected. No role was granted/revoked and no test records were deleted during this final review. Further destructive work requires new explicit approval.
