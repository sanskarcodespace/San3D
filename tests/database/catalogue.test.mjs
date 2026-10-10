import assert from "node:assert/strict";
import { before, after, test } from "node:test";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

// Real PostgreSQL policies/constraints; Auth identity and Storage infrastructure
// are fixtures. Hosted Auth, HTTP uploads and PostgREST need integration tests.
const db = new PGlite();
const admin = "10000000-0000-4000-8000-000000000001";
const customer = "10000000-0000-4000-8000-000000000002";
const imagePath = "catalogue/20000000-0000-4000-8000-000000000001.webp";
let productId, variantId;

async function identity(role, uid = "") {
  await db.exec("reset role");
  await db.query("select set_config('request.jwt.claim.sub', $1, false)", [
    uid,
  ]);
  assert.ok(["anon", "authenticated"].includes(role));
  await db.exec(`set role ${role}`);
}
async function rows(sql, params = []) {
  return (await db.query(sql, params)).rows;
}
async function denied(sql, code = "42501", params = []) {
  await assert.rejects(db.query(sql, params), (error) => error.code === code);
}

before(async () => {
  await db.exec(`
    create role anon nologin; create role authenticated nologin;
    create schema auth;
    create table auth.users(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid;
    $$;
    grant usage on schema auth to anon, authenticated;
    grant execute on function auth.uid() to anon, authenticated;
    create schema storage;
    create table storage.buckets(id text primary key, name text, public boolean,
      file_size_limit bigint, allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),
      bucket_id text references storage.buckets(id), name text);
    alter table storage.objects enable row level security;
    grant usage on schema storage to anon, authenticated;
    grant select, insert, update, delete on storage.objects to anon, authenticated;
  `);
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610100001_catalogue.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(
    await readFile(
      new URL(
        "../../supabase/migrations/202610100002_atomic_product_save.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.query("insert into auth.users(id) values ($1), ($2)", [
    admin,
    customer,
  ]);
  await db.query("insert into public.admin_roles(user_id) values ($1)", [
    admin,
  ]);
});
after(async () => {
  await db.close();
});

test("anonymous and ordinary users cannot create products or grant themselves admin", async () => {
  await identity("anon");
  await denied(
    "insert into products(name,slug) values ('Forbidden','forbidden')",
  );
  await denied("select * from product_production");
  await denied("select * from audit_logs");
  await identity("authenticated", customer);
  assert.equal(
    (await rows("select is_catalogue_admin() as allowed"))[0].allowed,
    false,
  );
  await denied(
    "insert into products(name,slug) values ('Forbidden','forbidden')",
  );
  await denied("insert into admin_roles(user_id) values ($1)", "42501", [
    customer,
  ]);
  assert.deepEqual(await rows("select * from admin_roles"), []);
});

test("admin can create and edit draft products; audit actor is recorded", async () => {
  await identity("authenticated", admin);
  const [category] = await rows(
    "insert into categories(name,slug) values ('Home','home') returning id",
  );
  const [product] = await rows(
    "insert into products(name,slug,category_id,description) values ('Vase','vase',$1,'A sculptural vase') returning id",
    [category.id],
  );
  productId = product.id;
  const [variant] = await rows(
    "insert into variants(product_id,sku,name,price_paise) values ($1,'VASE-01','Ivory',125000) returning id",
    [productId],
  );
  variantId = variant.id;
  await db.query(
    "insert into inventory(variant_id,mode,quantity) values ($1,'stocked',3)",
    [variantId],
  );
  await db.query(
    "insert into product_production(product_id,material_cost_paise) values ($1,10000)",
    [productId],
  );
  await db.query("update products set name='Sculptural vase' where id=$1", [
    productId,
  ]);
  const [audit] = await rows(
    "select actor_id, new_data from audit_logs where table_name='products' and action='UPDATE'",
  );
  assert.equal(audit.actor_id, admin);
  assert.equal(audit.new_data.name, "Sculptural vase");
  await denied("delete from audit_logs");
  await denied(
    "insert into audit_logs(action,table_name,record_id) values ('DELETE','products','forged')",
  );
});

test("database rejects duplicate slugs, invalid paise prices and incomplete publication", async () => {
  await identity("authenticated", admin);
  await denied(
    "insert into products(name,slug) values ('Duplicate','vase')",
    "23505",
  );
  await denied("update variants set price_paise=-1 where id=$1", "23514", [
    variantId,
  ]);
  await denied(
    "update variants set compare_at_price_paise=100 where id=$1",
    "23514",
    [variantId],
  );
  await denied("update products set status='published' where id=$1", "23514", [
    productId,
  ]);
  assert.equal(
    (await rows("select status from products where id=$1", [productId]))[0]
      .status,
    "draft",
  );
});

test("draft products, variants, availability and private costs are hidden from customers", async () => {
  for (const [role, uid] of [
    ["anon", ""],
    ["authenticated", customer],
  ]) {
    await identity(role, uid);
    assert.deepEqual(await rows("select * from products"), []);
    assert.deepEqual(await rows("select * from variants"), []);
    assert.deepEqual(await rows("select * from catalogue_availability()"), []);
  }
  assert.deepEqual(await rows("select * from product_production"), []);
  assert.deepEqual(await rows("select * from audit_logs"), []);
  assert.deepEqual(
    await rows("update products set name='Tampered' returning id"),
    [],
  );
});

test("storage writes require admin and a safe image path; private photos stay inaccessible", async () => {
  await identity("authenticated", customer);
  await denied(
    "insert into storage.objects(bucket_id,name) values ('catalogue-images',$1)",
    "42501",
    [imagePath],
  );
  await identity("authenticated", admin);
  for (const path of [
    "../secret.png",
    "catalogue/../../secret.jpg",
    "catalogue/file.svg",
    "catalogue/file.webp",
  ]) {
    await denied(
      "insert into storage.objects(bucket_id,name) values ('catalogue-images',$1)",
      "42501",
      [path],
    );
  }
  await denied(
    "insert into storage.objects(bucket_id,name) values ('customer-photos',$1)",
    "42501",
    [imagePath],
  );
  await db.query(
    "insert into storage.objects(bucket_id,name) values ('catalogue-images',$1)",
    [imagePath],
  );
  assert.deepEqual(
    await rows("update storage.objects set name='overwrite' returning id"),
    [],
  );
  await db.query(
    "insert into product_images(product_id,storage_path,alt_text) values ($1,$2,'Ivory vase')",
    [productId, imagePath],
  );
  assert.deepEqual(await rows("delete from storage.objects returning id"), []);
});

test("complete publication reveals only public data and truthful inventory", async () => {
  await identity("authenticated", admin);
  await db.query("update products set status='published' where id=$1", [
    productId,
  ]);
  await identity("anon");
  assert.equal((await rows("select * from products"))[0].id, productId);
  assert.equal((await rows("select * from variants"))[0].price_paise, 125000);
  assert.equal((await rows("select * from product_images")).length, 1);
  assert.deepEqual(await rows("select * from catalogue_availability()"), [
    { variant_id: variantId, mode: "stocked", quantity: 3 },
  ]);
  await denied("select * from inventory");
  await denied("select * from product_production");
  assert.equal((await rows("select * from storage.objects")).length, 1);
});

test("published products cannot lose required images/inventory or reparent their children", async () => {
  await identity("authenticated", admin);
  const [other] = await rows(
    "insert into products(name,slug) values ('Other','other') returning id",
  );
  await denied("delete from product_images where product_id=$1", "23514", [
    productId,
  ]);
  await denied("delete from inventory where variant_id=$1", "23514", [
    variantId,
  ]);
  await denied(
    "update product_images set product_id=$1 where product_id=$2",
    "23514",
    [other.id, productId],
  );
  await denied(
    "update variants set product_id=$1 where product_id=$2",
    "23514",
    [other.id, productId],
  );
  await db.query("delete from products where id=$1", [other.id]);
});

test("unpublishing and archiving immediately remove public products and availability", async () => {
  for (const status of ["draft", "archived"]) {
    await identity("authenticated", admin);
    await db.query("update products set status=$1 where id=$2", [
      status,
      productId,
    ]);
    await identity("anon");
    assert.deepEqual(await rows("select * from products"), []);
    assert.deepEqual(await rows("select * from product_images"), []);
    assert.deepEqual(await rows("select * from catalogue_availability()"), []);
  }
});

test("admin deletion cascades catalogue records and allows unreferenced image cleanup", async () => {
  await identity("authenticated", admin);
  await db.query(
    "update categories set image_path=$1, image_alt='Category vase' where slug='home'",
    [imagePath],
  );
  await db.query("delete from products where id=$1", [productId]);
  for (const table of [
    "products",
    "variants",
    "inventory",
    "product_production",
    "product_images",
  ]) {
    assert.deepEqual(await rows(`select * from ${table}`), []);
  }
  assert.deepEqual(await rows("delete from storage.objects returning id"), []);
  await db.exec("update categories set image_path=null where slug='home'");
  assert.equal(
    (await rows("delete from storage.objects returning id")).length,
    1,
  );
  assert.ok(
    (await rows("select * from audit_logs where action='DELETE'")).length > 0,
  );
});

test("atomic saves preserve IDs, roll back failures, prevent stale edits and reject nonadmins", async () => {
  await identity("authenticated", admin);
  const [cat] = await rows("select id from categories limit 1");
  await db.query(
    "insert into storage.objects(bucket_id,name) values ('catalogue-images',$1)",
    [imagePath],
  );
  const variant = "30000000-0000-4000-8000-000000000001";
  const payload = {
    name: "Atomic vase",
    slug: "atomic-vase",
    short_description: "Test",
    description: "Test description",
    category_id: cat.id,
    dimensions: "10 cm",
    personalizable: false,
    personalisation_limit: 24,
    production_lead_days: 2,
    featured: true,
    bestseller: false,
    status: "published",
    seo_title: "",
    meta_description: "",
    filament_weight_grams: 100,
    printing_time_minutes: 80,
    material_cost_paise: 1000,
    labour_cost_paise: 2000,
    images: [
      { storage_path: imagePath, alt_text: "Test vase", display_order: 0 },
    ],
    variants: [
      {
        id: variant,
        sku: "ATOMIC-1",
        name: "Ivory",
        colour_name: "Ivory",
        colour_hex: "#ffffff",
        size: "Small",
        material: "PLA",
        price_paise: 50000,
        compare_at_price_paise: 60000,
        display_order: 0,
        mode: "made_to_order",
        quantity: 0,
        low_stock_threshold: 2,
      },
    ],
    tags: [{ name: "Gift", slug: "gift" }],
  };
  const [saved] = await rows("select save_catalogue_product($1) as id", [
    payload,
  ]);
  const [version] = await rows(
    "select updated_at::text from products where id=$1",
    [saved.id],
  );
  const edited = {
    ...payload,
    id: saved.id,
    updated_at: version.updated_at,
    name: "Updated atomic vase",
  };
  await denied("select save_catalogue_product($1)", "23514", [
    { ...edited, variants: [{ ...payload.variants[0], price_paise: -1 }] },
  ]);
  assert.equal(
    (await rows("select name from products where id=$1", [saved.id]))[0].name,
    "Atomic vase",
  );
  assert.equal(
    (await rows("select id from variants where product_id=$1", [saved.id]))[0]
      .id,
    variant,
  );
  await rows("select save_catalogue_product($1)", [edited]);
  await denied("select save_catalogue_product($1)", "40001", [edited]);
  await identity("anon");
  assert.equal(
    (await rows("select name from products where id=$1", [saved.id]))[0].name,
    "Updated atomic vase",
  );
  await denied("select save_catalogue_product($1)", "42501", [payload]);
  await identity("authenticated", customer);
  await denied("select save_catalogue_product($1)", "42501", [payload]);
  await identity("authenticated", admin);
  await db.query("delete from products where id=$1", [saved.id]);
});

test("revoked membership denies the next mutation with the same authenticated identity", async () => {
  await db.exec("reset role");
  await db.query("delete from admin_roles where user_id=$1", [admin]);
  await identity("authenticated", admin);
  assert.equal(
    (await rows("select is_catalogue_admin() as allowed"))[0].allowed,
    false,
  );
  await denied("insert into products(name,slug) values ('Revoked','revoked')");
  assert.deepEqual(await rows("select * from audit_logs"), []);
});
