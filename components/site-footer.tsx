import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="container flex flex-col gap-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-semibold text-ink">MyLibrary</span> · An open directory of web-development tools. No accounts, no visitor tracking.
        </p>
        <nav aria-label="Footer navigation" className="flex gap-5">
          <Link href="/tools" className="hover:text-ink">Browse</Link>
          <Link href="/categories" className="hover:text-ink">Categories</Link>
        </nav>
      </div>
    </footer>
  );
}
