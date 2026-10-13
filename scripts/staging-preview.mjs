import { spawn } from "node:child_process";
import { stagingConfig, STAGING_REF } from "./staging-target.mjs";

stagingConfig();
console.log(`Staging preview only: ${STAGING_REF} on http://127.0.0.1:3200`);
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3200"], {
  stdio: "inherit",
  env: { ...process.env, SAN3D_STAGING_PREVIEW: "true", SAN3D_CATALOGUE_SOURCE: "supabase",
    SAN3D_ALLOW_DEMO_PREVIEW: "false", SUPABASE_COOKIE_SECURE: "false",
    SUPABASE_SERVICE_ROLE_KEY: "", SUPABASE_SECRET_KEY: "" },
});
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => { process.exitCode = code ?? 1; });
