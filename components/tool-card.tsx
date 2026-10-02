import Link from "next/link";
import { Dialog } from "@/components/dialog";
import { ScoreRing } from "@/components/score-ring";
import { StatusBadge } from "@/components/status-badge";
import { ToolLinks, ToolMonogram } from "@/components/tool-bits";
import { formatCompact, formatDate } from "@/lib/format";
import type { Tool } from "@/lib/types";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-faint">{label}</dt>
      <dd className="mt-0.5 truncate font-mono text-sm font-medium tabular-nums text-ink">{value}</dd>
    </div>
  );
}

export function ToolCard({ tool, index = 0 }: { tool: Tool; index?: number }) {
  return (
    <article
      className="card reveal group relative flex h-full flex-col p-5 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift"
      // Staggered entrance, capped so long lists do not wait.
      style={{ ["--delay" as string]: `${Math.min(index, 11) * 40}ms` }}
    >
      <div className="flex items-start gap-3.5">
        <ToolMonogram tool={tool} />
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[17px] font-semibold tracking-tight">
            {/* The stretched link makes the whole card clickable while the quick-view button stays separate. */}
            <Link href={`/tools/${tool.slug}`} className="after:absolute after:inset-0 after:rounded-[14px] group-hover:text-accent">
              {tool.name}
            </Link>
          </h3>
          <p className="mt-0.5 truncate text-xs text-muted">{tool.category}</p>
        </div>
        <ScoreRing score={tool.score} />
      </div>
      <p className="mt-4 line-clamp-2 text-sm leading-6 text-muted">{tool.description}</p>
      <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-line pt-4">
        <Metric label="Stars" value={formatCompact(tool.githubStars)} />
        <Metric label="Weekly dl" value={formatCompact(tool.npmDownloads)} />
        <Metric label="Version" value={tool.latestVersion ?? "—"} />
      </dl>
      <div className="mt-4 flex items-center justify-between gap-2">
        <StatusBadge status={tool.status} />
        <Dialog
          title={tool.name}
          description={tool.category}
          trigger="Quick view"
          triggerLabel={`Quick view of ${tool.name}`}
          triggerClassName="btn btn-ghost relative z-10 -mr-2 px-2.5 py-1.5 text-xs"
        >
          <div className="flex items-center gap-4">
            <ToolMonogram tool={tool} size="lg" />
            <div className="min-w-0">
              <StatusBadge status={tool.status} />
              <p className="mt-2 text-sm text-muted">Score <span className="font-mono font-semibold text-ink">{tool.score}</span>/100</p>
            </div>
          </div>
          <p className="mt-5 text-[15px] leading-7 text-ink-soft">{tool.description}</p>
          <dl className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-surface p-4">
            <Metric label="GitHub stars" value={formatCompact(tool.githubStars)} />
            <Metric label="Weekly downloads" value={formatCompact(tool.npmDownloads)} />
            <Metric label="Latest version" value={tool.latestVersion ?? "—"} />
            <Metric label="Last activity" value={formatDate(tool.updatedAt)} />
          </dl>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <ToolLinks tool={tool} />
            <Link href={`/tools/${tool.slug}`} className="btn btn-primary">
              Full details →
            </Link>
          </div>
        </Dialog>
      </div>
    </article>
  );
}
