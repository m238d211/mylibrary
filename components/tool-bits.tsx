import { categoryInfo } from "@/lib/categories";
import { safeLink } from "@/lib/format";
import type { Tool } from "@/lib/types";

// Scoped npm names (@scope/name) use the package part for the initial.
const initial = (name: string) => (name.replace(/^@[^/]+\//, "").match(/[a-z0-9]/i)?.[0] ?? "?").toUpperCase();

export function ToolMonogram({ tool, size = "md" }: { tool: Pick<Tool, "name" | "category">; size?: "md" | "lg" }) {
  const dimensions = size === "lg" ? "h-14 w-14 rounded-2xl text-2xl" : "h-10 w-10 rounded-xl text-base";
  return (
    <span className={`grid shrink-0 place-items-center font-semibold ${dimensions} ${categoryInfo(tool.category).tint}`} aria-hidden="true">
      {initial(tool.name)}
    </span>
  );
}

export function ToolLinks({ tool, className = "" }: { tool: Pick<Tool, "githubUrl" | "npmUrl" | "homepageUrl">; className?: string }) {
  const links = [
    ["GitHub", safeLink(tool.githubUrl)],
    ["npm", safeLink(tool.npmUrl)],
    ["Website", safeLink(tool.homepageUrl)],
  ].filter((link): link is [string, string] => Boolean(link[1]));
  if (!links.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary px-3.5 py-2 text-sm">
          {label}
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5 text-faint" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 3h7v7M13 3L4 12" />
          </svg>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      ))}
    </div>
  );
}
