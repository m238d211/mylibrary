import type { ToolStatus } from "@/lib/types";

const styles: Record<ToolStatus, string> = {
  Established: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  Growing: "bg-sky-50 text-sky-800 ring-sky-200",
  "New and Promising": "bg-amber-50 text-amber-800 ring-amber-200",
  "Needs Review": "bg-zinc-100 text-zinc-700 ring-zinc-200",
};
const dots: Record<ToolStatus, string> = {
  Established: "bg-emerald-500",
  Growing: "bg-sky-500",
  "New and Promising": "bg-amber-500",
  "Needs Review": "bg-zinc-400",
};

export function StatusBadge({ status }: { status: ToolStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] ?? styles["Needs Review"]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dots[status] ?? dots["Needs Review"]}`} aria-hidden="true" />
      {status}
    </span>
  );
}
