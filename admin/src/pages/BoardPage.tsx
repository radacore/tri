import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ArrowRight, Check, ChevronDown, List, MessageCircle, Search, X,
} from "lucide-react";
import { centsToUSD, get, put, type Order } from "../api/client";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

const STAGES = [
  { k: "brief", label: "Brief" },
  { k: "concepts", label: "Concepts" },
  { k: "revision", label: "Revision" },
  { k: "delivery", label: "Delivery" },
  { k: "done", label: "Done" },
];
const CLOSED = ["cancelled", "refunded"];

function stageOf(o: Order) {
  return STAGES.some((s) => s.k === o.stage) ? (o.stage as string) : "brief";
}

function paidChip(status: string) {
  if (["paid", "in_progress", "revision", "completed", "delivered"].includes(status))
    return <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">Paid</span>;
  if (status === "pending")
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Unpaid</span>;
  return <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-bold capitalize text-ink-secondary">{status.replace(/_/g, " ")}</span>;
}

function waNumber(raw?: string | null) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

export default function BoardPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [tier, setTier] = useState("all");
  const [dragOver, setDragOver] = useState<string | null>(null);
  const { dialog, ask } = useConfirm();
  const [rejecting, setRejecting] = useState<Order | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      const r = await get<Order[] | { orders: Order[] }>("/admin/orders");
      return Array.isArray(r) ? r : (r.orders ?? []);
    },
  });
  const orders = data ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (tier === "all" || o.tier === tier) &&
        (!needle || [o.customer_name, o.customer_email, o.id].join(" ").toLowerCase().includes(needle))
    );
  }, [orders, tier, q]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["orders"] });
    void qc.invalidateQueries({ queryKey: ["orders-summary"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const moveMut = useMutation({
    mutationFn: (body: { id: string; stage?: string; status?: string; note?: string }) => {
      const { id, ...rest } = body;
      return put(`/admin/orders/${id}`, rest);
    },
    onSuccess: () => refresh(),
    onError: (e: any) => toast(`Move failed: ${e?.message ?? "error"}`),
  });

  const moveStage = (o: Order, dir: 1 | -1) => {
    const i = STAGES.findIndex((s) => s.k === stageOf(o));
    const n = STAGES[i + dir];
    if (!n) return;
    moveMut.mutate({ id: o.id, stage: n.k });
  };

  const accept = (o: Order) => {
    ask(
      "Accept order?",
      `${o.customer_name} — mark as paid, move to Concepts.`,
      () => moveMut.mutate({ id: o.id, status: "paid", note: "Accepted via WhatsApp" }),
      { label: "Accept", danger: false }
    );
  };

  const reject = (o: Order) => {
    setRejecting(o);
    setReason("");
  };

  const confirmReject = () => {
    if (!rejecting) return;
    moveMut.mutate({ id: rejecting.id, status: "cancelled", note: reason.trim() || "Rejected" });
    setRejecting(null);
  };

  const onDropCard = (e: React.DragEvent, stage: string) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData("text/order-id");
    if (!id) return;
    const o = orders.find((x) => x.id === id);
    if (!o || stageOf(o) === stage) return;
    moveMut.mutate({ id, stage });
  };

  const cols = STAGES.map((s) => ({ ...s, items: filtered.filter((o) => !CLOSED.includes(o.status) && stageOf(o) === s.k) }));
  const totalAmt = (list: Order[]) => list.reduce((a, o) => a + (o.total_cents ?? 0), 0);

  return (
    <div className="space-y-4">
      <div className="-mx-1 flex flex-wrap items-center justify-between gap-3 md:-mx-4">
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Design Board</h1>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input input-pill w-44 pl-8 text-xs" />
          </div>
          <div className="relative">
            <select className="input input-pill appearance-none pr-8 text-xs font-medium" value={tier} onChange={(e) => setTier(e.target.value)} aria-label="Filter by tier">
              <option value="all">All tiers</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="premium">Premium</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-secondary" />
          </div>
          <Link to="/orders" className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap">
            <List className="h-4 w-4" /> List
          </Link>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-ink-secondary">Loading board…</p>
      ) : (
        <div className="flex gap-3 pb-4 xl:gap-4">
          {cols.map((c) => (
            <section
              key={c.k}
              onDragOver={(e) => { e.preventDefault(); setDragOver(c.k); }}
              onDragLeave={() => setDragOver(null)}
              onDrop={(e) => onDropCard(e, c.k)}
              className={`min-w-0 flex-1 rounded-[20px] p-4 transition ${dragOver === c.k ? "bg-brand-subtle ring-2 ring-brand" : "bg-surface-muted"}`}
            >
              <header className="px-1 pb-2">
                <p className="flex items-center justify-between text-sm font-extrabold text-ink-primary">
                  {c.label}
                  <span className="tabular rounded-full bg-white px-2 py-0.5 text-xs text-ink-secondary ring-1 ring-[#e2eceb]">{c.items.length}</span>
                </p>
                <p className="tabular mt-0.5 text-xs text-ink-secondary">{centsToUSD(totalAmt(c.items))}</p>
              </header>
              <div className="max-h-[62vh] space-y-2 overflow-y-auto">
                {c.items.map((o) => (
                  <article
                    key={o.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/order-id", o.id)}
                    className="cursor-grab rounded-[16px] bg-white p-4 shadow-sm ring-1 ring-[#e2eceb]/60 active:cursor-grabbing"
                  >
                    <p className="truncate text-sm font-bold text-ink-primary">{o.customer_name}</p>
                    <p className="tabular mt-0.5 text-xs text-ink-secondary">
                      <span className="capitalize">{o.tier}</span> · {centsToUSD(o.total_cents)}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {paidChip(o.status)}
                      <span className="tabular text-[10px] text-ink-muted">{(o.created_at ?? "").slice(5, 10)}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-1">
                      <button aria-label="Move left" title="Move back" disabled={moveMut.isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover disabled:opacity-40"
                        onClick={() => moveStage(o, -1)}><ArrowLeft className="h-3.5 w-3.5" /></button>
                      <button aria-label="Move right" title="Move forward" disabled={moveMut.isPending}
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover disabled:opacity-40"
                        onClick={() => moveStage(o, 1)}><ArrowRight className="h-3.5 w-3.5" /></button>
                      {o.status === "pending" && stageOf(o) === "brief" && (
                        <button aria-label="Accept" title="Accept — mark paid" disabled={moveMut.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-800 transition hover:bg-emerald-200 disabled:opacity-40"
                          onClick={() => accept(o)}><Check className="h-3.5 w-3.5" /></button>
                      )}
                      <a aria-label="WhatsApp" title="WhatsApp"
                        className="flex h-7 w-7 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover"
                        target="_blank" rel="noreferrer"
                        href={`https://wa.me/${waNumber(o.customer_phone || o.customer_email) || "6281241525485"}?text=${encodeURIComponent(`Halo ${o.customer_name}, ini BrandingPulse terkait order #${o.id.slice(0, 8).toUpperCase()}.`)}`}>
                        <MessageCircle className="h-3.5 w-3.5" />
                      </a>
                      <span className="flex-1" />
                      {stageOf(o) === "brief" && o.status === "pending" && (
                        <button aria-label="Reject" title="Reject" disabled={moveMut.isPending}
                          className="flex h-7 w-7 items-center justify-center rounded-full text-[#991b1b] transition hover:bg-[#fee2e2] disabled:opacity-40"
                          onClick={() => reject(o)}><X className="h-3.5 w-3.5" /></button>
                      )}
                    </div>
                  </article>
                ))}
                {c.items.length === 0 && (
                  <p className="rounded-[14px] border border-dashed border-[#cbdcda] p-4 text-center text-xs text-ink-muted">Drop here</p>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
      {dialog}
      {rejecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="anim-pop w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-xl ring-1 ring-black/10">
            <h2 className="text-base font-semibold text-ink-primary">Reject order?</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {rejecting.customer_name} will be moved to Closed.
            </p>
            <label className="label mt-4">Reason (recorded in history)</label>
            <input
              className="input"
              autoFocus
              placeholder="e.g. spam, duplicate, cancelled by customer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmReject(); }}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setRejecting(null)}>Cancel</button>
              <button className="btn-primary" disabled={moveMut.isPending} onClick={confirmReject}>
                {moveMut.isPending ? "Rejecting…" : "Reject order"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
