import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Filter, Search, X } from "lucide-react";
import {
  ORDER_STATUSES,
  centsToUSD,
  get,
  put,
  type Order,
  type OrderStatus,
} from "../api/client";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { toast } from "../components/Layout";

export default function OrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("paid");
  const [deliverable, setDeliverable] = useState("");

  const { data } = useQuery({
    queryKey: ["orders"],
    queryFn: async (): Promise<Order[]> => {
      try {
        const r = await get<Order[] | { orders: Order[] }>("/admin/orders");
        return Array.isArray(r) ? r : (r.orders ?? []);
      } catch {
        return [];
      }
    },
  });
  const orders = data ?? [];

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (tier === "all" || o.tier === tier) &&
        (!needle ||
          [o.customer_name, o.customer_email, o.id, o.tier]
            .join(" ")
            .toLowerCase()
            .includes(needle))
    );
  }, [orders, status, tier, q]);

  const updateMut = useMutation({
    mutationFn: (body: { id: string; status: string; deliverables?: string[] }) =>
      put(`/admin/orders/${body.id}`, {
        status: body.status,
        deliverables: body.deliverables,
      }),
    onSuccess: () => {
      toast("Order updated");
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ["orders"] });
      void qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e: any) => toast(`Update failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-[26px] bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink-primary">
            Order List
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="input input-pill w-44 pl-8 text-xs"
              />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-secondary" />
              <select
                className="input input-pill appearance-none pl-9 text-xs font-medium"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                aria-label="Filter by status"
              >
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {s.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-secondary" />
            </div>
            <div className="relative">
              <select
                className="input input-pill appearance-none pr-8 text-xs font-medium"
                value={tier}
                onChange={(e) => setTier(e.target.value)}
                aria-label="Filter by tier"
              >
                <option value="all">All tiers</option>
                <option value="starter">Starter</option>
                <option value="professional">Professional</option>
                <option value="premium">Premium</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-secondary" />
            </div>
          </div>
        </div>

        <DataTable<Order>
          data={filtered}
          columns={[
            { key: "id", label: "Order", render: (r) => <span className="tabular font-mono text-xs">{r.id.slice(0, 8)}</span> },
            { key: "customer_name", label: "Customer", sortable: true, render: (r) => (<div><p className="font-semibold">{r.customer_name}</p><p className="text-xs text-ink-secondary">{r.customer_email}</p></div>) },
            { key: "tier", label: "Tier", sortable: true, render: (r) => <span className="capitalize">{r.tier}</span> },
            { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} /> },
            { key: "created_at", label: "Date", sortable: true, render: (r) => <span className="tabular text-xs text-ink-secondary">{(r.created_at ?? "").slice(0, 10)}</span> },
            { key: "total_cents", label: "Total", sortable: true, value: (r) => r.total_cents, render: (r) => <span className="tabular font-semibold">{centsToUSD(r.total_cents)}</span> },
            { key: "actions", label: "Details", render: (r) => (<button className="btn-secondary px-4 py-1.5 text-xs" onClick={() => { setSelected(r); setNewStatus(r.status); setDeliverable(""); }}>View</button>) },
          ]}
        />
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-[#0f3738]/25 backdrop-blur-[4px]">
          <div className="anim-pop h-full w-full max-w-[440px] overflow-y-auto rounded-l-[24px] bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink-primary">
                  Order {selected.id.slice(0, 8)}
                </h2>
                <p className="mt-1 text-sm text-ink-secondary">
                  {selected.customer_name} · {selected.customer_email}
                </p>
              </div>
              <button
                onClick={() => setSelected(null)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-ink-primary">
              Tier: <b className="capitalize">{selected.tier}</b> · Total:{" "}
              <b className="tabular">{centsToUSD(selected.total_cents)}</b>
            </p>
            <div className="mt-2">
              <Badge status={selected.status} />
            </div>
            <h3 className="mt-5 text-sm font-semibold text-ink-primary">Brief</h3>
            <pre className="mt-1 max-h-48 overflow-auto rounded-[14px] bg-surface-muted p-3 font-mono text-xs text-ink-secondary">
              {typeof selected.brief === "string"
                ? selected.brief
                : JSON.stringify(selected.brief ?? {}, null, 2)}
            </pre>
            <h3 className="mt-4 text-sm font-semibold text-ink-primary">History</h3>
            {(selected.history ?? []).length === 0 ? (
              <p className="text-xs text-ink-secondary">No history yet.</p>
            ) : (
              <ul className="text-xs text-ink-secondary">
                {(selected.history ?? []).map((h, i) => (
                  <li key={i} className="tabular">
                    {h.at} — {h.status}
                    {h.note ? ` (${h.note})` : ""}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-4 text-sm font-semibold text-ink-primary">Deliverables</h3>
            <ul className="text-xs">
              {(selected.deliverables ?? []).map((d, i) => (
                <li key={i} className="break-all">
                  <a href={d} target="_blank" rel="noreferrer" className="text-brand hover:underline">{d}</a>
                </li>
              ))}
              {(selected.deliverables ?? []).length === 0 && (
                <li className="text-ink-secondary">No files yet.</li>
              )}
            </ul>
            <label className="label mt-4">Update status</label>
            <select
              className="input"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</option>
              ))}
            </select>
            <label className="label mt-3">Add deliverable (URL)</label>
            <input
              className="input"
              placeholder="https://…"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
            />
            <div className="mt-5 flex gap-2">
              <button
                className="btn-primary flex-1"
                disabled={updateMut.isPending}
                onClick={() =>
                  updateMut.mutate({
                    id: selected.id,
                    status: newStatus,
                    deliverables: deliverable
                      ? [...(selected.deliverables ?? []), deliverable]
                      : selected.deliverables ?? undefined,
                  })
                }
              >
                {updateMut.isPending ? "Saving…" : "Save changes"}
              </button>
              <button className="btn-secondary" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
