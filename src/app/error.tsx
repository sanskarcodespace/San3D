"use client";
export default function AppError({ reset }: { reset: () => void }) {
  return (
    <main className="shell page-section" id="main">
      <p className="eyebrow">SAN3D</p>
      <h1>We couldn’t open this page.</h1>
      <p>Please check your connection and try again.</p>
      <button className="button dark" onClick={reset}>
        Try again
      </button>
      <a className="text-link" href="/admin/login">
        Administrator sign in
      </a>
    </main>
  );
}
