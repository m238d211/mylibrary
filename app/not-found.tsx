import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="container grid min-h-[60dvh] place-items-center py-16 text-center">
      <div className="reveal">
        <p className="font-mono text-sm font-semibold text-accent">404</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">This page is not in the library</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          The tool may have been removed or is not published yet. Try browsing or searching instead.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/tools" className="btn btn-primary">Browse tools</Link>
          <Link href="/" className="btn btn-secondary">Go home</Link>
        </div>
      </div>
    </main>
  );
}
