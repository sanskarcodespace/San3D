-- READ ONLY. Run in the exact, user-approved STAGING project's SQL Editor.
-- The SQL connection does not prove a Supabase project reference: independently
-- verify the dashboard URL/project ref before this check or any migration.
select current_database(), current_user, version();

-- Required Auth/Storage infrastructure and types, without reading user data.
select table_schema, table_name, column_name, data_type
from information_schema.columns
where (table_schema = 'auth' and table_name = 'users'
       and column_name in ('id', 'deleted_at', 'banned_until'))
   or (table_schema = 'auth' and table_name = 'sessions'
       and column_name in ('id', 'user_id', 'not_after'))
   or (table_schema = 'storage' and table_name in ('objects', 'buckets'))
order by table_schema, table_name, ordinal_position;

select to_regprocedure('auth.uid()') as uid_function,
       to_regprocedure('auth.jwt()') as jwt_function,
       has_table_privilege(current_user, 'auth.users', 'SELECT') as can_read_accounts,
       has_table_privilege(current_user, 'auth.sessions', 'SELECT') as can_read_sessions;

-- Before migration 001 a new staging database should have no application tables.
-- After migrations, all ten application tables must have RLS enabled.
select n.nspname, c.relname, c.relrowsecurity, c.relforcerowsecurity
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- After migration 002: fixed search_path, trusted owner, no public EXECUTE.
-- Re-run after migration 003 and compare; do not change ownership to clients.
select n.nspname, p.proname, pg_get_userbyid(p.proowner) as owner,
       p.prosecdef, p.proconfig, p.proacl
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where (n.nspname = 'san3d_private' and p.proname = 'is_admin')
   or (n.nspname = 'public' and p.proname in ('is_catalogue_admin','save_catalogue_product'));
