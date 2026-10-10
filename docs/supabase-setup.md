# San3D Supabase setup

## Current state

The local `.env.local` contains the project URL and publishable key. Git ignores this file. Next.js uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`; the public prefix is appropriate for this browser-safe key. The masked secret copied from the dashboard is not usable and has not been saved. A secret/service-role key is not needed for catalogue operations: administrator sessions must pass RLS.

The storefront now reads live Supabase products, categories and availability. The local admin UI and SSR authentication are implemented. The first migration is confirmed applied; the second migration and first admin account are required to finish hosted editing verification.

## Apply the initial database migration

1. Open the San3D project in the Supabase dashboard, then **SQL Editor → New query**.
2. Open `supabase/migrations/202610100001_catalogue.sql` in this repository and copy its entire contents into the query.
3. Confirm the selected project is the dedicated San3D project, and run the query as the database owner (`postgres`). It creates catalogue tables, constraints, RLS policies, audit triggers and two Storage buckets. It does not insert sample products or administrator accounts. It does not drop or overwrite existing tables.
4. Expect a successful result with no rows returned. Run it only once. If an error occurs, retain the error text and stop; do not delete existing objects or modify the migration ad hoc. The migration is transactional, so a failed run should roll back its changes.
5. Confirm the Table Editor lists `products`, `categories`, `product_images`, `tags`, `product_tags`, `variants`, `inventory`, `product_production`, `admin_roles` and `audit_logs`. In Storage, confirm `catalogue-images` is public and `customer-photos` is private.
6. Report that the migration succeeded so application integration can continue. No database password or secret API key needs to be shared.

This manual SQL Editor operation does not register a Supabase CLI migration-history entry. Before introducing `supabase db push` later, reconcile the successfully applied version using the CLI migration repair workflow; do not blindly reapply it.

## Apply the atomic-save migration

The editor saves products, variants, images, tags and production settings in one transaction. After the initial migration succeeds:

1. Open a new SQL Editor query in the same San3D project.
2. Copy the full contents of `supabase/migrations/202610100002_atomic_product_save.sql`.
3. Run it once as `postgres`. Expect success with no rows returned. This adds the role-protected `save_catalogue_product` function; it does not insert or publish products.
4. Report success before hosted product-editing verification. Do not rerun the first migration.

## Create the first administrator

After the migration is applied:

1. In **Authentication → Users**, create your real administrator account through the dashboard. Choose the password yourself; do not put it in source code or chat. Copy the user's UUID.
2. In the SQL Editor, replace the placeholder below with that UUID and run as the database owner:

   ```sql
   insert into public.admin_roles (user_id)
   values ('REPLACE_WITH_AUTH_USER_UUID'::uuid)
   on conflict (user_id) do nothing;
   ```

3. Membership is granted by UUID, never by editable user metadata or an email hard-coded in the app. No client can grant or modify administrator membership. Additional admins use the same owner-run procedure.
4. To revoke access, run:

   ```sql
   delete from public.admin_roles
   where user_id = 'REPLACE_WITH_AUTH_USER_UUID'::uuid;
   ```

Open `http://localhost:3000/admin/login` and sign in with the Auth account you created. This is separate from your Supabase dashboard sign-in. Keep the password private. Confirm that the overview loads so the signed-in editing workflow can be checked.

## Storage behaviour

`catalogue-images` accepts JPEG, PNG and WebP with a 5 MiB bucket limit. Admin uploads must use `catalogue/<UUID>.<jpg|png|webp>` paths. Replacement uses a new object, not an overwrite. Referenced images cannot be deleted until their product/category references are removed. Public catalogue images are intentionally public, including assets attached to drafts; they must not contain confidential personal photos.

`customer-photos` is private with no client access policies. Customer photo uploads are not implemented in this phase.

## Local verification

Run `npm run test:db` for actual PostgreSQL constraint and policy tests using PGlite. Auth identity and Storage system tables are fixtures. These tests do not prove hosted authentication or Storage HTTP behaviour; those need separate integration checks after application setup. Application validation tests additionally decode uploaded image formats and reject spoofed MIME, invalid bytes and oversize files.

Run `npm run lint`, `npm run build` and `npm test` for the application checks. Do not commit `.env.local`, passwords or secret keys. Do not push or deploy without approval.
