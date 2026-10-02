import type { Metadata } from "next";
import Link from "next/link";
import { ScoreInfo } from "@/components/score-info";
import { ToolCard } from "@/components/tool-card";
import { CATEGORIES, CATEGORY_NAMES } from "@/lib/categories";
import { getPublishedTools } from "@/lib/tools";
import type { ToolSort } from "@/lib/types";

export const metadata: Metadata = { title: "Browse tools" };

const sorts: Array<[ToolSort, string]> = [
  ["score", "Overall score"],
  ["popularity", "Popularity"],
  ["newest", "Newest discovery"],
  ["downloads", "Downloads"],
  ["activity", "Recent activity"],
];

// Builds a /tools URL that keeps the current search and sort while changing the category.
function toolsHref(params: { q?: string; sort?: string; category?: string }) {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.category && params.category !== "all") search.set("category", params.category);
  if (params.sort && params.sort !== "score") search.set("sort", params.sort);
  const query = search.toString();
  return query ? `/tools?${query}` : "/tools";
}

export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sort = sorts.some(([value]) => value === params.sort)
    ? (params.sort as ToolSort)
    : "score";
  const selectedCategory = CATEGORY_NAMES.includes(params.category ?? "")
    ? (params.category as string)
    : "all";
  const query = params.q?.trim().slice(0, 80) ?? "";
  const tools = await getPublishedTools({
    query,
    category: selectedCategory,
    sort,
    limit: 60,
  });
  const filtered = Boolean(query) || selectedCategory !== "all";
  const chipClass = (active: boolean) =>
    `inline-flex shrink-0 items-center rounded-full border px-3.5 py-1.5 text-sm font-medium ${active ? "border-ink bg-ink text-white" : "border-line text-ink-soft hover:border-ink"}`;
  return (
    <main id="main" className="container py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The library</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">
            {selectedCategory === "all" ? "Browse tools" : selectedCategory}
          </h1>
        </div>
        <ScoreInfo />
      </div>

      <form className="mt-8 grid gap-2 sm:grid-cols-[1fr_200px_auto]" role="search">
        {selectedCategory !== "all" && <input type="hidden" name="category" value={selectedCategory} />}
        <label className="sr-only" htmlFor="q">Search tools</label>
        <input id="q" name="q" defaultValue={query} placeholder="Search by name or description" className="field" autoComplete="off" />
        <label className="sr-only" htmlFor="sort">Sort tools</label>
        <select id="sort" name="sort" defaultValue={sort} className="field">
          {sorts.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <button className="btn btn-primary" type="submit">Apply</button>
      </form>

      <nav aria-label="Filter by category" className="-mx-4 mt-5 overflow-x-auto px-4 pb-1">
        <ul className="flex gap-2 sm:flex-wrap">
          <li>
            <Link href={toolsHref({ q: query, sort })} className={chipClass(selectedCategory === "all")} aria-current={selectedCategory === "all" ? "page" : undefined}>
              All
            </Link>
          </li>
          {CATEGORIES.map((category) => {
            const active = selectedCategory === category.name;
            return (
              <li key={category.slug}>
                <Link href={toolsHref({ q: query, sort, category: category.name })} className={chipClass(active)} aria-current={active ? "page" : undefined}>
                  {category.name}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-8 flex items-center justify-between gap-4 border-b border-line pb-3">
        <p className="text-sm text-muted" aria-live="polite">
          <span className="font-mono font-semibold text-ink">{tools.length}</span> {tools.length === 1 ? "tool" : "tools"}
          {query && <> matching <span className="font-medium text-ink">“{query}”</span></>}
        </p>
        {filtered && (
          <Link href="/tools" className="text-sm font-semibold text-accent hover:text-accent-strong">
            Clear filters
          </Link>
        )}
      </div>

      {tools.length ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-line-strong px-6 py-16 text-center">
          <h2 className="text-lg font-semibold">No matching tools</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
            Try a broader search term, another category, or clear the filters.
          </p>
          {filtered && (
            <Link href="/tools" className="btn btn-secondary mt-6">Clear filters</Link>
          )}
        </div>
      )}
    </main>
  );
}
