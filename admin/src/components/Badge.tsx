import type { OrderStatus } from "../api/client";

// Semantic badge palette (success / warning / danger / neutral / primary).
const MAP: Record<OrderStatus, string> = {
  pending: "bg-[#fef3c7] text-[#92400e]",
  paid: "bg-[#e0f2fe] text-[#075985]",
  in_progress: "bg-[#dceeed] text-[#0f3738]",
  revision: "bg-[#fef3c7] text-[#92400e]",
  completed: "bg-[#d1fae5] text-[#065f46]",
  delivered: "bg-[#d1fae5] text-[#065f46]",
};

export default function Badge({ status }: { status: string }) {
  const cls =
    (MAP as Record<string, string>)[status] ??
    "bg-[#f4f8f8] text-[#5c7676]";
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold capitalize ${cls}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
