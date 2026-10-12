# Session-security migration review

Reviewed 12 October 2026: `202610110001_session_security.sql`.

## Target and scope

Approved preparation target: **San3D Staging**, project **tdmiwxraesyzvdcuqclf**, Singapore (ap-southeast-1), separate project in the Free organization. Its default branch is labelled “main PRODUCTION” by Supabase; this is the default branch of the separate staging project, not the San3D production project.

**Never apply this review's commands to production `jpzcmamxvcnriejohjwn`.** Migration execution requires separate approval for the staging reference. No production data or account is needed.

## Security assessment

- `SECURITY DEFINER` is necessary to inspect protected Auth tables without exposing them to clients. The function has no arguments, returns only a boolean, uses a fixed empty `search_path`, fully qualified relations and no dynamic SQL. A trusted database owner must retain ownership. Do not transfer ownership or grant Auth table access to `anon`/`authenticated`.
- `CREATE OR REPLACE` preserves the existing function identity/owner and policy references. Execute privileges for PUBLIC are revoked; only the existing anon/authenticated callers are explicitly granted execution. Anon execution supports policies evaluated during public reads and returns false without a matching user/session; it does not grant private-row access. The public wrapper remains invoker-security and authenticated-only.
- `auth.uid()` and `auth.jwt()` must come from Supabase's verified request context. The gateway verifies signature/expiry; this SQL does not validate cryptography or raw token expiry. Direct database credentials can set session configuration and must never be given to application clients. Service-role/owner credentials can bypass RLS by design and are unnecessary for application requests.
- Access needs all of: current UUID-based admin membership, a session belonging to that exact user, matching session ID, session not_after in the future or unset, no soft deletion, and no active ban. Missing, malformed and another user's session IDs return false without unsafe UUID casting.
- All existing catalogue and Storage admin policies call this helper. No RLS flags, policies, table grants, accounts or business records are weakened/changed. Private costs remain separated from public catalogue columns. Admin membership remains owner-managed.
- A STABLE SQL function uses the current statement/transaction snapshot. Revocation applies to later requests; it cannot cancel an already executing statement or erase previously downloaded data. Inactivity/single-session configuration is not independently reimplemented; provider refresh/cleanup timing still needs hosted tests. Session existence is not proof that all provider-specific limits have been enforced.
- Casting `session.id` to text avoids malformed UUID exceptions but may prevent a direct UUID-index equality lookup. The join also restricts user_id; inspect EXPLAIN with realistic staging sessions before large-scale usage. No speculative index changes to managed Auth tables were made.

## Prerequisites and verification

Use `supabase/checks/staging-prerequisites.sql` in the verified staging SQL Editor. Auth users must expose UUID id plus nullable deleted_at/banned_until timestamps; sessions must expose UUID id/user_id and nullable not_after timestamp. Confirm auth.uid/auth.jwt exist, the migration owner can read Auth tables, and Storage infrastructure exists. New staging starts with no public application tables. Apply catalogue migration 001 then atomic-save 002 before session-security 003. Verify all ten application tables retain RLS and inspect owner, ACL and search_path afterwards.

Local PostgreSQL tests verify account/session denial, RLS, private data protection, no PUBLIC function execution, fixed search_path, and that clients cannot replace the helper or disable RLS. Auth infrastructure is fixture-based; hosted verification is still required.

## Rollback and operational risks

- The migration is transactional. A SQL error before COMMIT leaves the previous function intact. Apply the complete file; do not execute fragments or remove BEGIN/COMMIT. Each of the three migration files is a separate transaction; if 003 fails, 001/002 may already be applied. Diagnose and retry only the failed migration.
- Restoring the old membership-only function would **reintroduce the logout/session-revocation vulnerability**. Do not use an automatic insecure down migration, disable RLS or relax grants to repair a failed login.
- Prefer a reviewed forward fix. For an emergency, temporarily deny admin access while preserving public reads, then repair under owner control. This is an operational decision requiring approval; no kill switch or rollback SQL was executed here.
- Missing columns, incorrect function ownership, missing sessions in custom-token flows or restrictive owner privileges can deny every admin. Verify an isolated real admin session before promotion. Keep dashboard owner access independently available; do not test with the sole production admin.
- SQL Editor application does not update Supabase CLI migration history automatically. Record successful versions and reconcile history before future CLI pushes. Never issue a blind db push or db reset against either hosted project.
