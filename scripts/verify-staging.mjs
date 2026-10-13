import { createClient } from "@supabase/supabase-js";
import { chromium } from "@playwright/test";
import sharp from "sharp";
import { createInterface } from "node:readline/promises";
import { stagingConfig, STAGING_REF } from "./staging-target.mjs";

// Explicitly opt-in, real staging only. No service-role key, production access,
// token logging, traces, HARs or stored browser sessions. Test data stays draft.
const { url, key } = stagingConfig();
const base = "http://localhost:3200";
const accounts = [
  { email: process.env.STAGING_ADMIN_EMAIL, password: process.env.STAGING_ADMIN_PASSWORD },
  { email: process.env.STAGING_VIEWER_EMAIL, password: process.env.STAGING_VIEWER_PASSWORD },
];
if (accounts[0].email !== "admin-qa@example.test" || accounts[1].email !== "viewer-qa@example.test" ||
    accounts.some((a) => !a.password)) throw new Error("Provide the two isolated test accounts privately in .env.staging.local.");
const client = (token) => createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  ...(token ? { global: { headers: { Authorization: `Bearer ${token}` } } } : {}),
});
const admin = client(), viewer = client(), anonymous = client();
let step = "initialization", browser, productId;
const terminal = createInterface({ input: process.stdin, output: process.stdout });
function check(condition, name) {
  step = name;
  if (!condition) throw new Error("Verification failed");
  console.log(`PASS ${name}`);
}
async function login(supabase, account) {
  step = "staging password login";
  const result = await supabase.auth.signInWithPassword(account);
  check(!result.error && !!result.data.session, "staging password login");
  return result.data.session;
}
try {
  console.log(`STAGING ONLY ${STAGING_REF}`);
  let session = await login(admin, accounts[0]);
  await login(viewer, accounts[1]);
  const role = await admin.rpc("is_catalogue_admin");
  check(!role.error && role.data === true, "real administrator authorized");
  const ordinary = await viewer.rpc("is_catalogue_admin");
  check(!ordinary.error && ordinary.data === false, "real non-admin denied");
  const slug = `staging-qa-${crypto.randomUUID()}`;
  const created = await admin.from("products").insert({ name: "Staging security QA — not for sale", slug }).select("id").single();
  check(!created.error && !!created.data?.id, "isolated draft creation");
  productId = created.data.id;
  const costs = await admin.from("product_production").insert({ product_id: productId, material_cost_paise: 12345 });
  check(!costs.error, "isolated confidential cost fixture");
  for (const [who, connection] of [["anonymous", anonymous], ["non-admin", viewer]]) {
    const read = await connection.from("product_production").select("*").eq("product_id", productId);
    check(!!read.error || read.data?.length === 0, `${who} cannot read seeded production costs`);
    const write = await connection.from("products").insert({ name: "Forbidden", slug: `forbidden-${crypto.randomUUID()}` });
    check(!!write.error, `${who} cannot create protected records`);
    const change = await connection.from("products").update({ name: "Tampered" }).eq("id", productId).select("id");
    check(!!change.error || change.data?.length === 0, `${who} cannot edit protected records`);
    const image = await connection.storage.from("catalogue-images").upload(`catalogue/${crypto.randomUUID()}.webp`, Buffer.from("invalid"), { contentType: "image/webp" });
    check(!!image.error, `${who} cannot upload objects`);
  }
  const malformed = await admin.rpc("save_catalogue_product", { payload: {} });
  check(!!malformed.error, "malformed atomic save denied");
  const invalid = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: "Bearer invalid-token" } });
  check([401, 403].includes(invalid.status), "invalid token denied by hosted Auth");

  browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  async function uiLogin(account) {
    step = "browser staging login";
    await page.goto(`${base}/admin/login`);
    await page.getByLabel("Email", { exact: true }).fill(account.email);
    await page.getByLabel("Password", { exact: true }).fill(account.password);
    await page.getByRole("button", { name: "Sign in to your studio" }).click();
  }
  await uiLogin(accounts[0]);
  await page.getByRole("heading", { name: "Make room for ideas." }).waitFor();
  check(true, "admin dashboard fresh login");
  const oversized = await context.request.post(`${base}/api/admin/images`, {
    headers: { Origin: base, "Content-Type": "application/octet-stream" },
    data: Buffer.alloc(6 * 1024 * 1024 + 1),
  });
  console.log(`Oversized request HTTP ${oversized.status()}`);
  if (oversized.status() !== 413) {
    const result = await oversized.json();
    console.log(`Origin rejected: ${result.error === "Invalid request origin."}; auth rejected: ${result.error === "Administrator sign-in required."}`);
  }
  check(oversized.status() === 413, "authenticated oversized request denied");
  const bad = await context.request.post(`${base}/api/admin/images`, {
    headers: { Origin: base }, multipart: { file: { name: "bad.png", mimeType: "image/png", buffer: Buffer.from("invalid") } },
  });
  check(bad.status() === 400, "authenticated malformed image denied");
  const imageBytes = await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } }).png().toBuffer();
  for (let i = 0; i < 2; i++) {
    const upload = await context.request.post(`${base}/api/admin/images`, {
      headers: { Origin: base }, multipart: { file: { name: "qa.png", mimeType: "image/png", buffer: imageBytes } },
    });
    check(upload.ok(), "authenticated image upload");
    const { path } = await upload.json();
    const remove = await context.request.delete(`${base}/api/admin/images`, { headers: { Origin: base }, data: { path } });
    check(remove.ok(), "own unreferenced staging image deletion");
  }
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await page.waitForURL(`${base}/admin/login`);
  await page.goto(`${base}/admin/products`);
  await page.waitForURL(`${base}/admin/login`);
  check(true, "logout and protected-route redirect");
  const prior = client(session.access_token);
  const signedOut = await prior.rpc("is_catalogue_admin");
  check(!signedOut.error && signedOut.data === false, "logout revokes previously issued JWT access before expiry");
  await uiLogin(accounts[1]);
  await page.getByText("This account is not an authorised administrator.").waitFor();
  check(true, "non-admin dashboard login denied");

  session = await login(admin, accounts[0]);
  console.log(`Session-expiry fixture user: ${session.user.id}`);
  await terminal.question("STAGING SQL: set this user's existing auth.sessions.not_after to now()-interval '1 second', then press Enter here. ");
  const expired = await client(session.access_token).rpc("is_catalogue_admin");
  check(!expired.error && expired.data === false, "hosted session not_after expiry denied");

  session = await login(admin, accounts[0]);
  await uiLogin(accounts[0]);
  await page.getByRole("heading", { name: "Make room for ideas." }).waitFor();
  console.log(`Role-revocation fixture user: ${session.user.id}`);
  await terminal.question("STAGING SQL: remove this test user's admin_roles membership after approval, then press Enter here. ");
  const revoked = await client(session.access_token).rpc("is_catalogue_admin");
  check(!revoked.error && revoked.data === false, "active hosted role revocation denied");
  const revokedWrite = await client(session.access_token).from("products").update({ name: "Tampered" }).eq("id", productId).select("id");
  check(!revokedWrite.error && revokedWrite.data?.length === 0, "revoked JWT cannot modify its prior draft");
  await page.waitForURL(`${base}/admin/login`, { timeout: 45000 });
  check(true, "visible cached dashboard redirects after role revocation");
  check((await context.request.get(`${base}/api/admin/session`)).status() === 403, "revoked browser API request denied");
  console.log(`COMPLETE: staging-only smoke checks. Retained draft fixture ${productId}. Test admin role remains revoked.`);
} catch {
  console.error(`FAIL at ${step}. No credentials or response bodies printed. Retained staging draft: ${productId ?? "none"}.`);
  process.exitCode = 1;
} finally {
  terminal.close();
  await browser?.close();
  await admin.auth.signOut({ scope: "local" });
  await viewer.auth.signOut({ scope: "local" });
}
