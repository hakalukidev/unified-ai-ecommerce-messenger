type Status = "active" | "escalated" | "resolved" | "error" | "disconnected";

const styles: Record<Status, string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  escalated: "bg-rose-50 text-rose-700 border-rose-200",
  resolved: "bg-slate-100 text-slate-700 border-slate-200",
  error: "bg-red-50 text-red-700 border-red-200",
  disconnected: "bg-slate-100 text-slate-600 border-slate-200",
};

const labels: Record<Status, string> = {
  active: "Active",
  escalated: "Escalated",
  resolved: "Resolved",
  error: "Error",
  disconnected: "Disconnected",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
