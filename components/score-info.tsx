import { Dialog } from "@/components/dialog";

// Mirrors the weights in lib/scoring.ts calculateScore.
const parts = [
  ["npm weekly downloads", 30, "Log-scaled, capped at 10M per week."],
  ["GitHub stars", 25, "Log-scaled, capped at 100k stars."],
  ["Repository activity", 20, "Full marks for a push today, fading to zero after a year."],
  ["Release recency", 15, "Full marks for a release today, fading to zero after two years."],
  ["Baseline", 10, "Every tracked tool starts here."],
] as const;

export function ScoreInfo({ className = "btn btn-ghost px-2.5 py-1.5 text-sm" }: { className?: string }) {
  return (
    <Dialog
      title="How scores work"
      description="Scores are computed from public signals each week. They are a starting point, not a verdict."
      trigger={
        <>
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <circle cx="10" cy="10" r="7.5" />
            <path d="M10 9v5M10 6.2v.1" strokeLinecap="round" />
          </svg>
          How scores work
        </>
      }
      triggerClassName={className}
    >
      <ul className="space-y-4">
        {parts.map(([label, points, note]) => (
          <li key={label}>
            <div className="flex items-baseline justify-between gap-4 text-sm">
              <span className="font-medium">{label}</span>
              <span className="font-mono text-muted">up to {points}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-surface">
              <div className="h-full rounded-full bg-accent" style={{ width: `${(points / 30) * 100}%` }} />
            </div>
            <p className="mt-1.5 text-xs text-muted">{note}</p>
          </li>
        ))}
      </ul>
      <p className="mt-5 rounded-xl bg-surface p-4 text-sm leading-6 text-muted">
        Archived repositories lose 25 points and tools without a GitHub repository lose 8. Only active, described tools with real adoption (2,000+ stars, or 20,000+ weekly downloads with 1,500+ stars) are listed.
      </p>
    </Dialog>
  );
}
