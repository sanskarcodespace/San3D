import Link from "next/link";
import { LoginForm } from "@/features/admin/components/login-form";
export const metadata = { title: "Administrator sign in" };
export default function LoginPage() {
  return (
    <main className="admin-login" id="main">
      <Link href="/" className="admin-brand">
        San3D<span>THE STUDIO</span>
      </Link>
      <p className="eyebrow">A SPACE FOR YOUR NEXT IDEA</p>
      <h1>Welcome back.</h1>
      <p>
        Sign in to manage your catalogue, collections and the details that make
        them yours.
      </p>
      <LoginForm />
      <p className="admin-help">
        Access is reserved for authorised administrators. Contact the project
        owner if you need access or a password reset.
      </p>
    </main>
  );
}
