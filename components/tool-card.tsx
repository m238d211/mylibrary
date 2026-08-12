import Link from "next/link";
import type { Tool } from "@/lib/types";

export function ToolCard({ tool }: { tool: Tool }) {
  return (
    <article className="card flex h-full flex-col p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent)]">
            {tool.category}
          </p>
          <h3 className="mt-2 text-xl font-bold">
            <Link
              className="hover:text-[var(--accent)]"
              href={`/tools/${tool.slug}`}
            >
              {tool.name}
            </Link>
          </h3>
        </div>
        <span className="rounded-full bg-[#e6f4f1] px-2.5 py-1 text-xs font-semibold text-[#176b5d]">
          {tool.status}
        </span>
      </div>
      <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--muted)]">
        {tool.description}
      </p>
      <div className="mt-auto grid grid-cols-2 gap-3 border-t border-[var(--line)] pt-4 mt-5 text-sm">
        <div>
          <span className="block text-xs text-[var(--muted)]">Score</span>
          <strong>{tool.score}/100</strong>
        </div>
        <div>
          <span className="block text-xs text-[var(--muted)]">
            GitHub stars
          </span>
          <strong>
            {tool.githubStars === null
              ? "Unavailable"
              : tool.githubStars.toLocaleString()}
          </strong>
        </div>
        <div>
          <span className="block text-xs text-[var(--muted)]">npm weekly downloads</span>
          <strong>{tool.npmDownloads === null ? "Unavailable" : tool.npmDownloads.toLocaleString()}</strong>
        </div>
        <div>
          <span className="block text-xs text-[var(--muted)]">Latest version</span>
          <strong>{tool.latestVersion ?? "Unavailable"}</strong>
        </div>
      </div>
    </article>
  );
}
