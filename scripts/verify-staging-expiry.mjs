import { createClient } from "@supabase/supabase-js";
import { setTimeout as delay } from "node:timers/promises";
import { stagingConfig } from "./staging-target.mjs";

// Hold tokens only in memory; do not shorten project settings or alter sessions.
// Obtain fresh human approval before starting session or fixture mutations.
if (!process.argv.includes("--approved-staging-state-changes"))
  throw new Error("Explicit approval for staging account/session and fixture changes is required.");
if (process.env.STAGING_ADMIN_EMAIL !== "admin-qa@example.test" || !process.env.STAGING_ADMIN_PASSWORD)
  throw new Error("Only the isolated staging administrator may run this script.");
const { url, key } = stagingConfig();
const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
function check(ok, label) { if (!ok) throw new Error(label); console.log(`PASS ${label}`); }
async function rpc(token) {
  const response = await fetch(`${url}/rest/v1/rpc/is_catalogue_admin`, {
    method: "POST", headers: { apikey: key, Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: "{}",
  });
  return { status: response.status, data: await response.json() };
}
try {
  check(process.env.STAGING_ADMIN_EMAIL === "admin-qa@example.test", "synthetic account guard");
  const login = await client.auth.signInWithPassword({ email: process.env.STAGING_ADMIN_EMAIL, password: process.env.STAGING_ADMIN_PASSWORD });
  check(!login.error && !!login.data.session, "isolated expiry-session login");
  const original = login.data.session;
  const before = await rpc(original.access_token);
  check(before.status === 200 && before.data === true, "original JWT authorized before natural expiry");
  const deadline = original.expires_at * 1000 + 65000;
  console.log(`Natural expiry observation scheduled for ${new Date(deadline).toISOString()}; credentials held only in memory.`);
  while (Date.now() < deadline) await delay(Math.min(30000, deadline - Date.now()));
  const expired = await rpc(original.access_token);
  check(expired.status === 401, "naturally expired signed JWT rejected by REST gateway");
  const auth = await fetch(`${url}/auth/v1/user`, { headers: { apikey: key, Authorization: `Bearer ${original.access_token}` } });
  check([401,403].includes(auth.status), "naturally expired signed JWT rejected by Auth");
  const refreshed = await client.auth.refreshSession({ refresh_token: original.refresh_token });
  check(!refreshed.error && !!refreshed.data.session, "refresh succeeds after access-token expiry");
  check(refreshed.data.session.access_token !== original.access_token, "refresh issues a new access token");
  const fresh = await rpc(refreshed.data.session.access_token);
  check(fresh.status === 200 && fresh.data === true, "refreshed eligible admin remains authorized");
  const retained = refreshed.data.session;
  const logout = await client.auth.signOut({ scope: "local" });
  check(!logout.error, "isolated session logout");
  const revoked = await rpc(retained.access_token);
  check(revoked.status === 200 && revoked.data === false, "logout denies retained unexpired JWT");
  const retry = await client.auth.refreshSession({ refresh_token: retained.refresh_token });
  check(!!retry.error && !retry.data.session, "revoked session cannot refresh");
  console.log("COMPLETE natural JWT expiry and refresh smoke checks; no catalogue records changed.");
} catch {
  console.error("FAIL expiry verification; no tokens or provider errors logged. See last successful assertion.");
  process.exitCode = 1;
} finally { await client.auth.signOut({ scope: "local" }); }
