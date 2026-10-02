import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIES } from "@/lib/categories";
import { getCategoryCounts } from "@/lib/tools";

export const metadata: Metadata = { title: "Categories" };
export const revalidate = 3600;

export default async function CategoriesPage() {
  const counts = await getCategoryCounts();
  return (
    <main id="main" className="container py-12">
      <p className="eyebrow">Categories</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight md:text-4xl">Browse by category</h1>
      <p className="mt-3 max-w-2xl text-muted">Every tool is sorted into one category from its name, description and keywords.</p>
      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((category, index) => {
          const count = counts[category.name] ?? 0;
          return (
            <li key={category.slug} className="reveal" style={{ ["--delay" as string]: `${Math.min(index, 11) * 35}ms` }}>
              <Link
                href={`/tools?category=${encodeURIComponent(category.name)}`}
                className="card group flex h-full flex-col p-5 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl text-base font-semibold ${category.tint}`} aria-hidden="true">
                    {category.name[0]}
                  </span>
                  <span className="font-mono text-sm text-faint">
                    {count} {count === 1 ? "tool" : "tools"}
                  </span>
                </div>
                <h2 className="mt-4 font-semibold tracking-tight group-hover:text-accent">{category.name}</h2>
                <p className="mt-1 text-sm leading-6 text-muted">{category.description}</p>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
