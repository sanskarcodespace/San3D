# Catalogue administration

`auth.ts` verifies Supabase users and current roles. `repository.ts` protects every admin read. `actions.ts` validates all product/category mutations, invokes the transactional product RPC and invalidates public routes. `schema.ts` is the shared validation contract. `image-validation.ts` decodes and normalises uploaded image bytes; the API route separately checks authentication and Origin.

`components/` contains product/category editors, login, private preview, list operations and media management. Routes live in `app/admin`; the protected route group is additional defence, never the sole authorisation check.

See `docs/admin-guide.md`, `docs/supabase-setup.md` and `supabase/migrations/`. No credentials or administrator emails belong in source code.
