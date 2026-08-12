import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import { getPublishedTools } from "@/lib/tools";

export default async function HomePage() {
  const tools = await getPublishedTools({ limit: 12, sort: "score" });
  return (
    <>
      <header className="border-b border-[var(--line)] bg-white">
        <div className="container flex items-center justify-between py-5">
          <Link href="/" className="text-xl font-bold tracking-tight">
            My<span className="text-[var(--accent)]">Library</span>
          </Link>
          <nav
            aria-label="Primary navigation"
            className="flex gap-5 text-sm text-[var(--muted)]"
          >
            <Link href="/tools">Browse tools</Link>
            <Link href="/categories">Categories</Link>
          </nav>
        </div>
      </header>
      <main id="main">
        <section className="container py-20">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[.2em] text-[var(--accent)]">
            A calmer tool directory
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight md:text-6xl">
            Find web-development tools with signals you can actually understand.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
            MyLibrary tracks useful, active libraries across the modern web
            stack. Browse without an account, compare transparent scores, and
            see the data behind each recommendation.
          </p>
          <div className="mt-8 flex gap-3">
            <Link
              className="rounded-lg bg-[var(--accent)] px-5 py-3 font-semibold text-white"
              href="/tools"
            >
              Explore the library
            </Link>
            <Link
              className="rounded-lg border border-[var(--line)] bg-white px-5 py-3 font-semibold"
              href="/categories"
            >
              Browse categories
            </Link>
          </div>
        </section>
        <section className="container pb-20" aria-labelledby="latest-heading">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-[var(--accent)]">
                Latest signals
              </p>
              <h2 id="latest-heading" className="mt-1 text-3xl font-bold">
                Tools worth a closer look
              </h2>
            </div>
            <Link
              href="/tools"
              className="text-sm font-semibold text-[var(--accent)]"
            >
              View all →
            </Link>
          </div>
          {tools.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          ) : (
            <div className="card p-8 text-[var(--muted)]">
              The first collection is not available yet. Check back after the
              weekly collection runs.
            </div>
          )}
        </section>
      </main>
      <footer className="border-t border-[var(--line)] bg-white py-8 text-sm text-[var(--muted)]">
        <div className="container">
          Open directory. No accounts. No visitor email collection.
        </div>
      </footer>
    </>
  );
}
