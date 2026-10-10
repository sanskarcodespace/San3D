# Supabase integration boundary

Reserved for future database, storage, and authentication adapters. No SDK, network requests, migrations, or credentials are configured yet.

When implementing:

- Install `@supabase/supabase-js` and `@supabase/ssr`.
- Separate browser and server clients; use request-scoped cookies for server authentication.
- Use the publishable key with row-level security for ordinary access.
- Isolate any privileged client in a module importing `server-only`; never expose the service role key to client components.
- Keep migrations and policies in a root `supabase/` directory and generate database types from the actual schema.
- Map database rows to feature domain types instead of coupling presentation components to database queries.

Environment placeholders are documented in the root `.env.example`.
