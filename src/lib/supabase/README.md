# Supabase boundary

`server.ts` imports `server-only`. Session clients are request-scoped, use cookie-based `@supabase/ssr` authentication and the publishable key, and must be paired with `requireAdmin()` for protected operations. The public client has no session and performs uncached published-catalogue reads under anonymous RLS.

The admin proxy refreshes cookies. Never trust an unverified `getSession()` result as authorisation, cache authenticated responses, expose service-role keys or bypass RLS for routine catalogue edits. `@supabase/server` is installed as requested; the Next.js implementation uses `@supabase/ssr` and `supabase-js`.

Migrations live in `supabase/migrations/`. See `docs/supabase-setup.md` for applying them and granting the first administrator by Auth UUID. Future personal photos must stay in the private bucket.
