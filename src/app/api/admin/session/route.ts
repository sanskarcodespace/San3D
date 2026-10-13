import { AdminAccessError, requireAdmin } from "@/features/admin/auth";

export const dynamic = "force-dynamic";
export async function GET() {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    await requireAdmin();
    return Response.json({ authorised: true }, { headers });
  } catch (error) {
    return Response.json({ authorised: false }, {
      status: error instanceof AdminAccessError ? 403 : 503,
      headers,
    });
  }
}
