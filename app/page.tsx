import Link from "next/link";
import { ScoreInfo } from "@/components/score-info";
import { ToolCard } from "@/components/tool-card";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts, getPublishedTools } from "@/lib/tools";

// Rebuilt at most hourly; the weekly cron also revalidates "/" right after collecting.
export const revalidate = 3600;

function SectionHeading({ eyebrow, title, href, id }: { eyebrow: string; title: string; href: string; id: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 id={id} className="mt-1.5 text-2xl font-semibold tracking-tight md:text-3xl">
          {title}
        </h2>
      </div>
      <Link href={href} className="shrink-0 text-sm font-semibold text-ink hover:text-accent">
        View all →
      </Link>
    </div>
  );
}

export default async function HomePage() {
  const [topTools, frameworks, counts] = await Promise.all([
    getPublishedTools({ limit: 9, sort: "score" }),
    getPublishedTools({ limit: 6, sort: "score", category: "Frameworks" }),
    getCategoryCounts(),
  ]);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const activeCategories = CATEGORIES.filter((category) => counts[category.name]);
  return (
    <main id="main">
      <section className="border-b border-line">
        <div className="container py-16 md:py-24">
          <p className="eyebrow reveal">Updated every week</p>
          <h1 className="reveal mt-4 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl" style={{ ["--delay" as string]: "60ms" }}>
            The web-development tools worth knowing, <span className="text-accent">ranked by real signals.</span>
          </h1>
          <p className="reveal mt-6 max-w-2xl text-lg leading-8 text-muted" style={{ ["--delay" as string]: "120ms" }}>
            MyLibrary tracks downloads, stars and activity across npm and GitHub, then keeps only the tools developers actually rely on.
          </p>
          <form action="/tools" role="search" className="reveal mt-8 flex max-w-xl gap-2" style={{ ["--delay" as string]: "180ms" }}>
            <label htmlFor="home-search" className="sr-only">Search tools</label>
            <input id="home-search" name="q" className="field h-12" placeholder="Search React, testing, ORM…" autoComplete="off" />
            <button type="submit" className="btn btn-primary h-12 px-5">Search</button>
          </form>
          <dl className="reveal mt-10 flex flex-wrap gap-x-10 gap-y-4" style={{ ["--delay" as string]: "240ms" }}>
            <div>
              <dt className="text-sm text-muted">Tools listed</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums">{total}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted">Categories</dt>
              <dd className="font-mono text-2xl font-semibold tabular-nums">{activeCategories.length}</dd>
            </div>
            <div className="flex items-end">
              <ScoreInfo className="btn btn-secondary px-3.5 py-2 text-sm" />
            </div>
          </dl>
        </div>
      </section>

      {activeCategories.length > 0 && (
        <nav aria-label="Popular categories" className="container mt-10">
          <ul className="flex flex-wrap gap-2">
            {activeCategories.map((category) => (
              <li key={category.slug}>
                <Link
                  href={`/tools?category=${encodeURIComponent(category.name)}`}
                  className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium hover:border-ink"
                >
                  {category.name}
                  <span className="font-mono text-xs text-faint">{counts[category.name]}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      <section className="container mt-14" aria-labelledby="top-heading">
        <SectionHeading eyebrow="Highest scores" title="Top tools right now" href="/tools" id="top-heading" />
        {topTools.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {topTools.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        ) : (
          <div className="card p-10 text-center text-muted">
            The first collection is not available yet. Check back after the weekly collection runs.
          </div>
        )}
      </section>

      {frameworks.length > 0 && (
        <section className="container mt-20" aria-labelledby="frameworks-heading">
          <SectionHeading eyebrow="Frameworks" title="Foundations to build on" href={`/tools?category=${encodeURIComponent("Frameworks")}`} id="frameworks-heading" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {frameworks.map((tool, index) => (
              <ToolCard key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
