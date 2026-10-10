begin;
-- One transaction for the entire editor; caller privileges and RLS still apply.
create function public.save_catalogue_product(payload jsonb) returns uuid
language plpgsql security invoker set search_path = '' as $$
declare pid uuid; row_version timestamptz; item jsonb; tid uuid;
begin
  if not san3d_private.is_admin() then raise exception 'Administrator access required' using errcode='42501'; end if;
  if octet_length(payload::text) > 200000 or jsonb_array_length(payload->'variants') > 100
     or jsonb_array_length(payload->'images') > 30 or jsonb_array_length(payload->'tags') > 30
  then raise exception 'Product payload exceeds limits' using errcode='23514'; end if;
  pid := coalesce((payload->>'id')::uuid, gen_random_uuid());
  select updated_at into row_version from public.products where id=pid for update;
  if found then
    if (payload->>'updated_at') is null or row_version <> (payload->>'updated_at')::timestamptz then
      raise exception 'This product changed in another session. Reload before saving.' using errcode='40001';
    end if;
  elsif payload->>'updated_at' is not null then
    raise exception 'Product no longer exists' using errcode='40001';
  end if;
  insert into public.products(id,name,slug,short_description,description,category_id,dimensions,personalizable,personalisation_limit,production_lead_days,featured,bestseller,status,seo_title,meta_description)
  values(pid,payload->>'name',payload->>'slug',payload->>'short_description',payload->>'description',nullif(payload->>'category_id','')::uuid,payload->>'dimensions',(payload->>'personalizable')::boolean,(payload->>'personalisation_limit')::integer,(payload->>'production_lead_days')::integer,(payload->>'featured')::boolean,(payload->>'bestseller')::boolean,payload->>'status',payload->>'seo_title',payload->>'meta_description')
  on conflict(id) do update set name=excluded.name,slug=excluded.slug,short_description=excluded.short_description,description=excluded.description,category_id=excluded.category_id,dimensions=excluded.dimensions,personalizable=excluded.personalizable,personalisation_limit=excluded.personalisation_limit,production_lead_days=excluded.production_lead_days,featured=excluded.featured,bestseller=excluded.bestseller,status=excluded.status,seo_title=excluded.seo_title,meta_description=excluded.meta_description;

  delete from public.product_images where product_id=pid;
  for item in select value from jsonb_array_elements(payload->'images') loop
    if not exists(select 1 from storage.objects where bucket_id='catalogue-images' and name=item->>'storage_path') then
      raise exception 'Upload each image before saving' using errcode='23514';
    end if;
    insert into public.product_images(id,product_id,storage_path,alt_text,display_order)
    values(coalesce((item->>'id')::uuid,gen_random_uuid()),pid,item->>'storage_path',item->>'alt_text',(item->>'display_order')::integer);
  end loop;

  -- Stable variant IDs preserve saved cart selections. Deferred constraints
  -- validate only the finished transaction, including published edits.
  delete from public.variants where product_id=pid;
  for item in select value from jsonb_array_elements(payload->'variants') loop
    insert into public.variants(id,product_id,sku,name,colour_name,colour_hex,size,material,price_paise,compare_at_price_paise,display_order)
    values((item->>'id')::uuid,pid,item->>'sku',item->>'name',item->>'colour_name',item->>'colour_hex',item->>'size',item->>'material',(item->>'price_paise')::integer,nullif(item->>'compare_at_price_paise','')::integer,(item->>'display_order')::integer);
    insert into public.inventory(variant_id,mode,quantity,low_stock_threshold)
    values((item->>'id')::uuid,item->>'mode',(item->>'quantity')::integer,(item->>'low_stock_threshold')::integer);
  end loop;

  delete from public.product_tags where product_id=pid;
  for item in select value from jsonb_array_elements(payload->'tags') loop
    insert into public.tags(name,slug) values(item->>'name',item->>'slug') on conflict(slug) do update set name=excluded.name returning id into tid;
    insert into public.product_tags(product_id,tag_id) values(pid,tid) on conflict do nothing;
  end loop;
  insert into public.product_production(product_id,filament_weight_grams,printing_time_minutes,material_cost_paise,labour_cost_paise)
  values(pid,(payload->>'filament_weight_grams')::numeric,(payload->>'printing_time_minutes')::integer,(payload->>'material_cost_paise')::integer,(payload->>'labour_cost_paise')::integer)
  on conflict(product_id) do update set filament_weight_grams=excluded.filament_weight_grams,printing_time_minutes=excluded.printing_time_minutes,material_cost_paise=excluded.material_cost_paise,labour_cost_paise=excluded.labour_cost_paise;
  return pid;
end;
$$;
revoke all on function public.save_catalogue_product(jsonb) from public, anon;
grant execute on function public.save_catalogue_product(jsonb) to authenticated;
commit;
