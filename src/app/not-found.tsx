import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="shell empty-state standalone-empty">
      <p className="eyebrow">404 / A LITTLE OFF THE PATH</p>
      <h1>This object is out of the picture.</h1>
      <p>Let’s find you something else to explore.</p>
      <Link className="button dark" href="/shop">
        Back to the collection →
      </Link>
    </main>
  );
}
