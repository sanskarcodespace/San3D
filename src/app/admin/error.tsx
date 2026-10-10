"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="admin-login" id="main">
      <h1>Something interrupted the studio.</h1>
      <p>Check your connection and administrator access, then try again.</p>
      <button className="admin-primary" onClick={reset}>
        Try again
      </button>
      <a href="/admin/login">Return to sign in</a>
    </main>
  );
}
