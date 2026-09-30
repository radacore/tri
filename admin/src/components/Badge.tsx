import type { OrderStatus } from "../api/client";

const MAP: Record<OrderStatus, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-200",
  paid: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-violet-100 text-violet-800 border-violet-200",
  revision: "bg-orange-100 text-orange-800 border-orange-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  delivered: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function Badge({ status }: { status: string }) {
  const cls =
    (MAP as Record<string, string>)[status] ??
    "bg-slate-100 text-slate-700 border-slate-200";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {status}
    </span>
  );
}
