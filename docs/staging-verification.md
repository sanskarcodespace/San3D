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
