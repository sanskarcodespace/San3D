import { test } from "node:test";
import assert from "node:assert/strict";
import { stagingConfig, STAGING_REF } from "../../scripts/staging-target.mjs";
const valid = {
  SAN3D_STAGING_PROJECT_REF: STAGING_REF,
  NEXT_PUBLIC_SUPABASE_URL: `https://${STAGING_REF}.supabase.co`,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_fixture",
};
test("staging tooling accepts only the explicitly approved project", () => {
  assert.equal(stagingConfig(valid).url, valid.NEXT_PUBLIC_SUPABASE_URL);
});
test("staging tooling refuses missing configuration, production and secret keys", () => {
  for (const input of [{}, { ...valid, SAN3D_STAGING_PROJECT_REF: "jpzcmamxvcnriejohjwn" },
    { ...valid, NEXT_PUBLIC_SUPABASE_URL: "https://jpzcmamxvcnriejohjwn.supabase.co" },
    { ...valid, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_secret_fixture" }]) {
    assert.throws(() => stagingConfig(input));
  }
});
