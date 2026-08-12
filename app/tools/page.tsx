import Link from "next/link";
import { ToolCard } from "@/components/tool-card";
import { getPublishedTools } from "@/lib/tools";
import type { ToolSort } from "@/lib/types";

const sorts: Array<[ToolSort, string]> = [
  ["score", "Overall score"],
  ["popularity", "Popularity"],
  ["newest", "Newest discovery"],
  ["downloads", "Downloads"],
  ["activity", "Recent activity"],
];
const categories = [
  "State Management",
  "Testing",
  "Styling and UI",
  "Data Fetching",
  "Forms and Validation",
  "Authentication",
  "Database and ORM",
  "Build Tools",
  "Animation",
  "Accessibility",
  "Developer Experience",
  "Other",
];
export default async function ToolsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const sort = sorts.some(([value]) => value === params.sort)
    ? (params.sort as ToolSort)
    : "score";
  const selectedCategory = categories.includes(params.category ?? "")
    ? params.category
    : "all";
  const tools = await getPublishedTools({
    query: params.q,
    category: selectedCategory,
    sort,
    limit: 60,
  });
  return (
    <>
      <header className="border-b border-[var(--line)] bg-white">
        <div className="container flex items-center justify-between py-5">
          <Link href="/" className="text-xl font-bold">
            My<span className="text-[var(--accent)]">Library</span>
          </Link>
          <Link href="/categories" className="text-sm text-[var(--muted)]">
            Categories
          </Link>
        </div>
      </header>
      <main id="main" className="container py-12">
        <p className="text-sm font-semibold text-[var(--accent)]">
          The library
        </p>
        <h1 className="mt-2 text-4xl font-bold">Browse tools</h1>
        <form
          className="mt-8 grid gap-3 rounded-xl border border-[var(--line)] bg-white p-4 md:grid-cols-[1fr_220px_220px_auto]"
          role="search"
        >
          <label className="sr-only" htmlFor="q">
            Search tools
          </label>
          <input
            id="q"
            name="q"
            defaultValue={params.q}
            placeholder="Search by name or description"
            className="rounded-lg border border-[var(--line)] px-3 py-2"
          />
          <select
            name="category"
            defaultValue={selectedCategory}
            className="rounded-lg border border-[var(--line)] px-3 py-2"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            name="sort"
            defaultValue={sort}
            className="rounded-lg border border-[var(--line)] px-3 py-2"
            aria-label="Sort tools"
          >
            {sorts.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <button
            className="rounded-lg bg-[var(--accent)] px-5 py-2 font-semibold text-white"
            type="submit"
          >
            Search
          </button>
        </form>
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-[var(--muted)]">
            {tools.length} published tools shown
          </p>
          {params.category && (
            <Link
              href="/tools"
              className="text-sm font-semibold text-[var(--accent)]"
            >
              Clear filters
            </Link>
          )}
        </div>
        {tools.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="card mt-4 p-8">
            <h2 className="font-bold">No matching tools</h2>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Try a broader search or clear the filters.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
