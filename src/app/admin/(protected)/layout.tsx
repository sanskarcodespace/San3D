import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin, AdminAccessError } from "@/features/admin/auth";
import { signOut } from "@/features/admin/actions";
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    if (error instanceof AdminAccessError) redirect("/admin/login");
    throw error;
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          San3D<span>STUDIO / CATALOGUE</span>
        </Link>
        <nav aria-label="Admin navigation">
          <Link href="/admin">Overview</Link>
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/categories">Categories</Link>
          <Link href="/admin/media">Media library</Link>
          <Link href="/" target="_blank">
            View storefront ↗
          </Link>
        </nav>
        <form action={signOut}>
          <button className="admin-secondary">Sign out</button>
        </form>
        <p className="admin-aside-note">
          Thoughtfully made.
          <br />
          Simply managed.
        </p>
      </aside>
      <main className="admin-main" id="main">
        {children}
      </main>
    </div>
  );
}
