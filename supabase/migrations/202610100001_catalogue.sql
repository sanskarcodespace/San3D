-- San3D catalogue foundation. Apply once, as the project database owner.
-- No accounts, demo inventory or administrator memberships are created here.
begin;

create schema if not exists san3d_private;
revoke all on schema san3d_private from public;
grant usage on schema san3d_private to anon, authenticated;

create table public.admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  granted_at timestamptz not null default now()
);
alter table public.admin_roles enable row level security;
revoke all on public.admin_roles from public, anon, authenticated;
grant select on public.admin_roles to authenticated;
create policy own_admin_membership on public.admin_roles for select to authenticated
  using (user_id = (select auth.uid()));

create function san3d_private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.admin_roles where user_id = (select auth.uid()) and role = 'admin');
$$;
revoke all on function san3d_private.is_admin() from public;
grant execute on function san3d_private.is_admin() to anon, authenticated;

create function public.is_catalogue_admin() returns boolean
language sql stable security invoker set search_path = '' as $$
  select san3d_private.is_admin();
$$;
revoke all on function public.is_catalogue_admin() from public, anon;
grant execute on function public.is_catalogue_admin() to authenticated;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (char_length(slug) between 1 and 120 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_name text not null default '' check (char_length(short_name) <= 160),
  description text not null default '' check (char_length(description) <= 5000),
  image_path text check (image_path ~ '^catalogue/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'),
  image_alt text not null default '' check (char_length(image_alt) <= 300),
  display_order integer not null default 0 check (display_order between 0 and 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  slug text not null unique check (char_length(slug) between 1 and 80 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  slug text not null unique check (char_length(slug) between 1 and 160 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  short_description text not null default '' check (char_length(short_description) <= 500),
  description text not null default '' check (char_length(description) <= 20000),
  category_id uuid references public.categories(id) on delete restrict,
  dimensions text not null default '' check (char_length(dimensions) <= 200),
  personalizable boolean not null default false,
  personalisation_limit integer not null default 24 check (personalisation_limit between 1 and 200),
  production_lead_days integer not null default 0 check (production_lead_days between 0 and 365),
  featured boolean not null default false,
  bestseller boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  seo_title text not null default '' check (char_length(seo_title) <= 160),
  meta_description text not null default '' check (char_length(meta_description) <= 320),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index products_category_status_idx on public.products(category_id, status);
create index products_status_featured_idx on public.products(status, featured, bestseller);

create table public.product_tags (
  product_id uuid not null references public.products(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (product_id, tag_id)
);
create index product_tags_tag_idx on public.product_tags(tag_id);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null check (storage_path ~ '^catalogue/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'),
  alt_text text not null check (char_length(btrim(alt_text)) between 1 and 300),
  display_order integer not null default 0 check (display_order between 0 and 1000),
  created_at timestamptz not null default now(),
  unique (product_id, storage_path)
);
create index product_images_product_order_idx on public.product_images(product_id, display_order);

create table public.variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique check (char_length(btrim(sku)) between 1 and 100),
  name text not null check (char_length(btrim(name)) between 1 and 160),
  colour_name text not null default '' check (char_length(colour_name) <= 80),
  colour_hex text not null default '#e6dfd1' check (colour_hex ~ '^#[0-9a-fA-F]{6}$'),
  size text not null default '' check (char_length(size) <= 100),
  material text not null default '' check (char_length(material) <= 160),
  price_paise integer not null check (price_paise between 1 and 100000000),
  compare_at_price_paise integer check (compare_at_price_paise > price_paise and compare_at_price_paise <= 100000000),
  display_order integer not null default 0 check (display_order between 0 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index variants_product_idx on public.variants(product_id);

create table public.inventory (
  variant_id uuid primary key references public.variants(id) on delete cascade,
  mode text not null default 'stocked' check (mode in ('stocked', 'made_to_order')),
  quantity integer not null default 0 check (quantity between 0 and 1000000),
  low_stock_threshold integer not null default 5 check (low_stock_threshold between 0 and 1000000),
  updated_at timestamptz not null default now()
);

-- Kept separate so a public product SELECT cannot expose private cost fields.
create table public.product_production (
  product_id uuid primary key references public.products(id) on delete cascade,
  filament_weight_grams numeric(10,2) not null default 0 check (filament_weight_grams >= 0),
  printing_time_minutes integer not null default 0 check (printing_time_minutes between 0 and 525600),
  material_cost_paise integer not null default 0 check (material_cost_paise between 0 and 100000000),
  labour_cost_paise integer not null default 0 check (labour_cost_paise between 0 and 100000000),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  table_name text not null,
  record_id text not null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs(created_at desc);

create function san3d_private.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
revoke all on function san3d_private.touch_updated_at() from public;

create function san3d_private.audit_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare before_row jsonb; after_row jsonb; row_data jsonb;
begin
  if tg_op <> 'INSERT' then before_row := to_jsonb(old); end if;
  if tg_op <> 'DELETE' then after_row := to_jsonb(new); end if;
  row_data := coalesce(after_row, before_row);
  insert into public.audit_logs(actor_id, action, table_name, record_id, old_data, new_data)
  values (auth.uid(), tg_op, tg_table_name, coalesce(row_data->>'id', row_data->>'variant_id', row_data->>'product_id', row_data->>'user_id'), before_row, after_row);
  return coalesce(new, old);
end;
$$;
revoke all on function san3d_private.audit_change() from public;

-- Explicitly revoke Supabase default grants, then apply least privilege + RLS.
do $$
declare tbl text;
begin
  foreach tbl in array array['categories','tags','products','product_tags','product_images','variants','inventory','product_production'] loop
    execute format('alter table public.%I enable row level security', tbl);
    execute format('revoke all on public.%I from public, anon, authenticated', tbl);
    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
    execute format('create policy admin_manage on public.%I for all to authenticated using ((select san3d_private.is_admin())) with check ((select san3d_private.is_admin()))', tbl);
    execute format('create trigger catalogue_audit after insert or update or delete on public.%I for each row execute function san3d_private.audit_change()', tbl);
  end loop;
  foreach tbl in array array['categories','products','variants','inventory','product_production'] loop
    execute format('create trigger catalogue_updated before update on public.%I for each row execute function san3d_private.touch_updated_at()', tbl);
  end loop;
end;
$$;
alter table public.audit_logs enable row level security;
revoke all on public.audit_logs from public, anon, authenticated;
grant select on public.audit_logs to authenticated;
create policy admin_audit_read on public.audit_logs for select to authenticated using ((select san3d_private.is_admin()));
create trigger admin_membership_audit after insert or update or delete on public.admin_roles
  for each row execute function san3d_private.audit_change();

grant select on public.categories, public.tags, public.products, public.product_images, public.variants, public.product_tags to anon;
create policy public_categories on public.categories for select to anon, authenticated using (true);
create policy public_tags on public.tags for select to anon, authenticated using (true);
create policy public_products on public.products for select to anon, authenticated using (status = 'published');
create policy public_images on public.product_images for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy public_variants on public.variants for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id = product_id and p.status = 'published'));
create policy public_product_tags on public.product_tags for select to anon, authenticated
  using (exists(select 1 from public.products p where p.id = product_id and p.status = 'published'));

-- Public inventory projection intentionally returns only real availability fields.
-- Direct inventory access (including low-stock thresholds) remains admin-only.
create function public.catalogue_availability() returns table (variant_id uuid, mode text, quantity integer)
language sql stable security definer set search_path = '' as $$
  select i.variant_id, i.mode, i.quantity from public.inventory i
  join public.variants v on v.id = i.variant_id
  join public.products p on p.id = v.product_id where p.status = 'published';
$$;
revoke all on function public.catalogue_availability() from public;
grant execute on function public.catalogue_availability() to anon, authenticated;

-- Deferred checks permit atomic editing while preventing incomplete publication.
-- Child records cannot be moved between products. Recreate them explicitly so
-- publication checks always run against the product losing the old record too.
create function san3d_private.prevent_reparenting() returns trigger
language plpgsql set search_path = '' as $$
begin
  if (to_jsonb(new)->>'product_id') is distinct from (to_jsonb(old)->>'product_id')
     or (to_jsonb(new)->>'variant_id') is distinct from (to_jsonb(old)->>'variant_id')
     or (to_jsonb(new)->>'id') is distinct from (to_jsonb(old)->>'id')
  then raise exception 'Record identity and parent cannot be changed' using errcode = '23514'; end if;
  return new;
end;
$$;
revoke all on function san3d_private.prevent_reparenting() from public;
do $$
declare tbl text;
begin
  foreach tbl in array array['products','product_images','variants','inventory','product_production','product_tags'] loop
    execute format('create trigger immutable_identity before update on public.%I for each row execute function san3d_private.prevent_reparenting()', tbl);
  end loop;
end;
$$;

create function san3d_private.validate_publication() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pid uuid; vid uuid;
begin
  if tg_table_name = 'products' then pid := coalesce(new.id, old.id);
  elsif tg_table_name = 'inventory' then
    vid := coalesce(new.variant_id, old.variant_id);
    select product_id into pid from public.variants where id = vid;
  else pid := coalesce(new.product_id, old.product_id);
  end if;
  if exists(select 1 from public.products where id = pid and status = 'published') then
    if not exists(select 1 from public.products where id = pid and category_id is not null and btrim(description) <> '')
       or not exists(select 1 from public.product_images where product_id = pid)
       or not exists(select 1 from public.variants where product_id = pid)
       or exists(select 1 from public.variants v left join public.inventory i on i.variant_id = v.id where v.product_id = pid and i.variant_id is null)
    then raise exception 'Published products require a category, description, image, variant and inventory settings' using errcode = '23514'; end if;
  end if;
  return null;
end;
$$;
revoke all on function san3d_private.validate_publication() from public;
do $$
declare tbl text;
begin
  foreach tbl in array array['products','product_images','variants','inventory'] loop
    execute format('create constraint trigger publication_integrity after insert or update or delete on public.%I deferrable initially deferred for each row execute function san3d_private.validate_publication()', tbl);
  end loop;
end;
$$;

insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('catalogue-images', 'catalogue-images', true, 5242880, array['image/jpeg','image/png','image/webp']),
       ('customer-photos', 'customer-photos', false, 5242880, array['image/jpeg','image/png','image/webp']);

-- Bucket reads are public by design; all writes require a verified admin identity.
-- Customer-photos has no client policies: private, inaccessible by default.
create policy san3d_image_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'catalogue-images');
create policy san3d_image_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'catalogue-images' and (select san3d_private.is_admin())
    and name ~ '^catalogue/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$');
-- Images are immutable: replacement uploads a new UUID object; never overwrites.
create policy san3d_image_delete on storage.objects for delete to authenticated
  using (bucket_id = 'catalogue-images' and (select san3d_private.is_admin())
    and not exists(select 1 from public.product_images pi where pi.storage_path = storage.objects.name)
    and not exists(select 1 from public.categories c where c.image_path = storage.objects.name));

commit;
