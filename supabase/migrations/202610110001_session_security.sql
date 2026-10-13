-- Apply as the database owner after both catalogue migrations.
-- No accounts, memberships or catalogue records are changed.
begin;
create or replace function san3d_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.admin_roles as membership
    join auth.users as account on account.id = membership.user_id
    join auth.sessions as session on session.user_id = account.id
    where membership.user_id = (select auth.uid())
      and membership.role = 'admin'
      and session.id::text = (select auth.jwt()->>'session_id')
      and (session.not_after is null or session.not_after > now())
      and account.deleted_at is null
      and (account.banned_until is null or account.banned_until <= now())
  );
$$;
revoke all on function san3d_private.is_admin() from public;
grant execute on function san3d_private.is_admin() to anon, authenticated;
comment on function san3d_private.is_admin() is
  'Live membership, account and Auth session check. JWT signature/expiry are verified by the API gateway.';
commit;
