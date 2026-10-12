import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFile, writeFile, chmod } from "node:fs/promises";
import { stagingConfig } from "./staging-target.mjs";

const { url } = stagingConfig();
if (!process.argv.includes("--rotate-test-passwords"))
  throw new Error("Explicit --rotate-test-passwords is required; this affects only the two named staging fixtures.");
const secret = process.env.STAGING_SUPABASE_SECRET_KEY;
if (!secret?.startsWith("sb_secret_")) throw new Error("Private staging provisioning key is missing.");
const owner = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });
const fixtures = [
  ["d52ec528-24bd-4c9d-a920-72f2a1568602", "admin-qa@example.test", "STAGING_ADMIN_PASSWORD"],
  ["2841d423-2281-4830-a1d0-c817abd58d57", "viewer-qa@example.test", "STAGING_VIEWER_PASSWORD"],
];
try {
  // Verify both identities before changing either. Never enumerate real users.
  for (const [id, email] of fixtures) {
    const result = await owner.auth.admin.getUserById(id);
    if (result.error || result.data.user?.email !== email) throw new Error();
  }
  for (const [id, email, variable] of fixtures) {
    const password = `${randomBytes(32).toString("base64url")}aA1!`;
    const result = await owner.auth.admin.updateUserById(id, { password, email_confirm: true });
    if (result.error) throw new Error();
    const filename = ".env.staging.local";
    let configuration = await readFile(filename, "utf8");
    const line = new RegExp(`^${variable}=.*$`, "m");
    configuration = line.test(configuration)
      ? configuration.replace(line, `${variable}='${password}'`)
      : `${configuration}\n${variable}='${password}'\n`;
    await writeFile(filename, configuration, { mode: 0o600 });
    await chmod(filename, 0o600);
    console.log(`Configured isolated staging account ${email}; password saved privately.`);
  }
} catch {
  console.error("Staging provisioning stopped. No credentials or server response bodies printed; check target/key/account identity.");
  process.exitCode = 1;
}
