// Intentionally pinned to the separately approved staging project.
// Changing this target requires a fresh project review and user approval.
export const STAGING_REF = "tdmiwxraesyzvdcuqclf";
export function stagingConfig(env = process.env) {
  if (env.SAN3D_STAGING_PROJECT_REF !== STAGING_REF ||
      env.NEXT_PUBLIC_SUPABASE_URL !== `https://${STAGING_REF}.supabase.co` ||
      !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.startsWith("sb_publishable_")) {
    throw new Error("Refusing to run: an explicit, approved staging target and publishable key are required.");
  }
  return { url: env.NEXT_PUBLIC_SUPABASE_URL, key: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY };
}
