"use client";
export default function CatalogueError({ reset }: { reset: () => void }) {
  return (
    <main className="shell page-section" id="main">
      <h1>The collection is taking a moment.</h1>
      <p>We couldn’t load the catalogue. Please try again.</p>
      <button className="button dark" onClick={reset}>
        Try again
      </button>
      <a className="text-link" href="/contact">
        Contact San3D
      </a>
    </main>
  );
}
