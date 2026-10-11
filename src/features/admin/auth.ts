import "server-only";
import { redirect } from "next/navigation";
import { sessionClient } from "@/lib/supabase/server";
export class AdminAccessError extends Error {}
export async function requireAdmin() {
  const client = await sessionClient();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user)
    throw new AdminAccessError("Please sign in with an administrator account.");
  const { data, error: roleError } = await client.rpc("is_catalogue_admin");
  if (roleError || data !== true)
    throw new AdminAccessError(
      "This account does not have administrator access.",
    );
  return { client, user };
}

export async function requireAdminPage() {
  try {
    return await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError) redirect("/admin/login");
    throw error;
  }
}
