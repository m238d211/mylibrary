import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedToolBySlug } from "@/lib/tools";

export const revalidate = 3600;

// Older rows were stored before URLs were sanitized, so only render http(s) links.
const safeLink = (value: string | null) =>
  value && /^https?:\/\//i.test(value) ? value : null;
const formatNumber = (value: number | null) =>
  value === null ? "Unavailable" : value.toLocaleString();
const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en", { dateStyle: "medium" }) : "Unavailable";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tool = await getPublishedToolBySlug(slug);
  return tool
    ? { title: tool.name, description: tool.description.slice(0, 160) }
    : { title: "Tool not found" };
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getPublishedToolBySlug(slug);
  if (!tool) notFound();
  const links = [
    ["GitHub", safeLink(tool.githubUrl)],
    ["npm", safeLink(tool.npmUrl)],
    ["Website", safeLink(tool.homepageUrl)],
  ].filter((link): link is [string, string] => Boolean(link[1]));
  const stats: Array<[string, string]> = [
    ["Score", `${tool.score}/100`],
    ["GitHub stars", formatNumber(tool.githubStars)],
    ["npm weekly downloads", formatNumber(tool.npmDownloads)],
    ["Latest version", tool.latestVersion ?? "Unavailable"],
    ["Last activity", formatDate(tool.updatedAt)],
    ["Discovered", formatDate(tool.discoveredAt)],
  ];
  return (
    <>
      <header className="border-b border-[var(--line)] bg-white">
        <div className="container flex items-center justify-between py-5">
          <Link href="/" className="text-xl font-bold">
            My<span className="text-[var(--accent)]">Library</span>
          </Link>
          <Link href="/tools" className="text-sm text-[var(--muted)]">
            Browse tools
          </Link>
        </div>
      </header>
      <main id="main" className="container py-12">
        <Link
          href="/tools"
          className="text-sm font-semibold text-[var(--accent)]"
        >
          ← All tools
        </Link>
        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
              {tool.category}
            </p>
            <h1 className="mt-2 break-words text-4xl font-bold">{tool.name}</h1>
          </div>
          <span className="rounded-full bg-[#e6f4f1] px-3 py-1 text-sm font-semibold text-[#176b5d]">
            {tool.status}
          </span>
        </div>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--muted)]">
          {tool.description}
        </p>
        {links.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-3">
            {links.map(([label, href]) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold"
              >
                {label} ↗
              </a>
            ))}
          </div>
        )}
        <dl className="card mt-8 grid gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-[var(--muted)]">{label}</dt>
              <dd className="mt-1 font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </main>
    </>
  );
}
