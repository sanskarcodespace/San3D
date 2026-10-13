import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

for (const name of ["expiry", "workflows", "replacement"]) {
  test(`staging ${name} script refuses missing approval and wrong identity before network work`, () => {
    const path = new URL(`../../scripts/verify-staging-${name}.mjs`, import.meta.url).pathname;
    const base = name === "replacement" ? ["--approved-fixtures"] : [];
    const run = (args, env = {}) => spawnSync(process.execPath, [path, ...args], {
      env: { PATH: process.env.PATH, ...env }, encoding: "utf8", timeout: 10000,
    });
    const missing = run(base);
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /Explicit approval/);
    const wrong = run([...base, "--approved-staging-state-changes"], {
      STAGING_ADMIN_EMAIL: "unapproved@example.test", STAGING_ADMIN_PASSWORD: "synthetic-fixture",
    });
    assert.equal(wrong.status, 1);
    assert.match(wrong.stderr, /Only the isolated staging administrator/);
  });
}
