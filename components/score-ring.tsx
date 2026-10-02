const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ScoreRing({ score, size = 44 }: { score: number; size?: number }) {
  const value = Math.max(0, Math.min(100, score));
  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Score ${value} out of 100`}
    >
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="var(--color-line)" strokeWidth="3.5" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          stroke={value >= 70 ? "var(--color-accent)" : "var(--color-faint)"}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - value / 100)}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-mono text-[13px] font-semibold tabular-nums" aria-hidden="true">
        {value}
      </span>
    </div>
  );
}
