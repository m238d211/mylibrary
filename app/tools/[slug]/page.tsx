import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ScoreInfo } from "@/components/score-info";
import { ScoreRing } from "@/components/score-ring";
import { StatusBadge } from "@/components/status-badge";
import { ToolLinks, ToolMonogram } from "@/components/tool-bits";
import { formatDate, formatNumber } from "@/lib/format";
import type { ScoreBreakdown } from "@/lib/scoring";
import { getPublishedToolBySlug } from "@/lib/tools";

export const revalidate = 3600;

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

// Maximums mirror the weights in lib/scoring.ts calculateScore.
const breakdownParts: Array<[keyof ScoreBreakdown, string, number]> = [
  ["downloads", "npm weekly downloads", 30],
  ["stars", "GitHub stars", 25],
  ["activity", "Repository activity", 20],
  ["release", "Release recency", 15],
];

function Breakdown({ breakdown }: { breakdown: ScoreBreakdown }) {
  return (
    <ul className="space-y-4">
      {breakdownParts.map(([key, label, max]) => {
        const value = breakdown[key];
        return (
          <li key={key}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-ink-soft">{label}</span>
              <span className="font-mono tabular-nums text-muted">
                <span className="font-semibold text-ink">{value}</span>/{max}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface" aria-hidden="true">
              <div className="h-full rounded-full bg-accent" style={{ width: `${Math.max(0, Math.min(100, (value / max) * 100))}%` }} />
            </div>
          </li>
        );
      })}
      <li className="flex items-baseline justify-between gap-4 border-t border-line pt-4 text-sm">
        <span className="text-ink-soft">Baseline{breakdown.penalties ? " and penalties" : ""}</span>
        <span className="font-mono tabular-nums font-semibold">{10 + breakdown.penalties}</span>
      </li>
    </ul>
  );
}

export default async function ToolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = await getPublishedToolBySlug(slug);
  if (!tool) notFound();
  const stats: Array<[string, string]> = [
    ["GitHub stars", formatNumber(tool.githubStars)],
    ["npm weekly downloads", formatNumber(tool.npmDownloads)],
    ["Latest version", tool.latestVersion ?? "Unavailable"],
    ["Last activity", formatDate(tool.updatedAt)],
    ["Discovered", formatDate(tool.discoveredAt)],
  ];
  return (
    <main id="main" className="container py-10">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li><Link href="/tools" className="hover:text-ink">Tools</Link></li>
          <li aria-hidden="true">/</li>
          <li>
            <Link href={`/tools?category=${encodeURIComponent(tool.category)}`} className="hover:text-ink">{tool.category}</Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="truncate font-medium text-ink">{tool.name}</li>
        </ol>
      </nav>

      <header className="reveal mt-8 flex flex-wrap items-start gap-5">
        <ToolMonogram tool={tool} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="wrap-break-word text-3xl font-semibold tracking-tight md:text-4xl">{tool.name}</h1>
            <StatusBadge status={tool.status} />
          </div>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-muted">{tool.description}</p>
          <ToolLinks tool={tool} className="mt-6" />
        </div>
      </header>

      <div className="mt-12 grid gap-6 lg:grid-cols-[1fr_380px]">
        <section aria-labelledby="signals-heading" className="card reveal p-6" style={{ ["--delay" as string]: "80ms" }}>
          <h2 id="signals-heading" className="font-semibold tracking-tight">Signals</h2>
          <dl className="mt-5 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {stats.map(([label, value]) => (
              <div key={label} className="border-l-2 border-line pl-4">
                <dt className="text-xs text-muted">{label}</dt>
                <dd className="mt-1 font-mono text-lg font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="score-heading" className="card reveal p-6" style={{ ["--delay" as string]: "140ms" }}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 id="score-heading" className="font-semibold tracking-tight">Score</h2>
              <p className="mt-1 text-sm text-muted">Out of 100, recalculated weekly.</p>
            </div>
            <ScoreRing score={tool.score} size={64} />
          </div>
          <div className="mt-6">
            {tool.scoreBreakdown ? (
              <Breakdown breakdown={tool.scoreBreakdown} />
            ) : (
              <p className="rounded-xl bg-surface p-4 text-sm text-muted">A detailed breakdown is not available for this tool yet.</p>
            )}
          </div>
          <div className="mt-5 border-t border-line pt-4">
            <ScoreInfo className="btn btn-ghost -ml-2.5 px-2.5 py-1.5 text-sm" />
          </div>
        </section>
      </div>
    </main>
  );
}
