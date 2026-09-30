import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

  const filtered = useMemo(
    () =>
      orders.filter(
        (o) =>
          (status === "all" || o.status === status) &&
          (tier === "all" || o.tier === tier)
      ),
    [orders, status, tier]
  );

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
    onError: (e: any) => toast(`Gagal update: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Orders</h1>
      <div className="flex flex-wrap gap-2">
        <select
          className="input max-w-[200px]"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">Semua status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          className="input max-w-[200px]"
          value={tier}
          onChange={(e) => setTier(e.target.value)}
        >
          <option value="all">Semua tier</option>
          <option value="starter">Starter</option>
          <option value="professional">Professional</option>
          <option value="premium">Premium</option>
        </select>
      </div>

      <DataTable<Order>
        data={filtered}
        searchKeys={["customer_name", "customer_email", "id", "tier"]}
        columns={[
          { key: "id", label: "ID", render: (r) => <span className="font-mono text-xs">{r.id.slice(0, 8)}</span> },
          { key: "customer_name", label: "Pelanggan", sortable: true, render: (r) => (<div><p className="font-medium">{r.customer_name}</p><p className="text-xs text-slate-500">{r.customer_email}</p></div>) },
          { key: "tier", label: "Paket", sortable: true },
          { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} /> },
          { key: "created_at", label: "Tanggal", sortable: true, render: (r) => <span className="text-xs">{(r.created_at ?? "").slice(0, 10)}</span> },
          { key: "total_cents", label: "Total", sortable: true, value: (r) => r.total_cents, render: (r) => centsToUSD(r.total_cents) },
          { key: "aksi", label: "Aksi", render: (r) => (<button className="rounded border px-2 py-1 text-xs font-semibold" onClick={() => { setSelected(r); setNewStatus(r.status); setDeliverable(""); }}>Detail</button>) },
        ]}
      />

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
          <div className="w-full max-w-md overflow-y-auto bg-white p-5">
            <h2 className="font-bold">Order {selected.id.slice(0, 8)}</h2>
            <p className="text-sm text-slate-600">
              {selected.customer_name} · {selected.customer_email}
            </p>
            <p className="mt-1 text-sm">
              Tier: <b>{selected.tier}</b> · Total:{" "}
              <b>{centsToUSD(selected.total_cents)}</b>
            </p>
            <div className="mt-2">
              <Badge status={selected.status} />
            </div>
            <h3 className="mt-4 font-semibold">Brief</h3>
            <pre className="mt-1 max-h-48 overflow-auto rounded bg-slate-50 p-2 text-xs">
              {typeof selected.brief === "string"
                ? selected.brief
                : JSON.stringify(selected.brief ?? {}, null, 2)}
            </pre>
            <h3 className="mt-4 font-semibold">History</h3>
            {(selected.history ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">Belum ada history.</p>
            ) : (
              <ul className="text-xs text-slate-600">
                {(selected.history ?? []).map((h, i) => (
                  <li key={i}>
                    {h.at} — {h.status}
                    {h.note ? ` (${h.note})` : ""}
                  </li>
                ))}
              </ul>
            )}
            <h3 className="mt-4 font-semibold">Deliverables</h3>
            <ul className="text-xs text-blue-700">
              {(selected.deliverables ?? []).map((d, i) => (
                <li key={i} className="break-all">
                  <a href={d} target="_blank" rel="noreferrer">{d}</a>
                </li>
              ))}
              {(selected.deliverables ?? []).length === 0 && (
                <li className="text-slate-500">Belum ada file.</li>
              )}
            </ul>
            <label className="label mt-4">Update status</label>
            <select
              className="input"
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
            >
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label className="label mt-3">Tambah deliverable (URL)</label>
            <input
              className="input"
              placeholder="https://…"
              value={deliverable}
              onChange={(e) => setDeliverable(e.target.value)}
            />
            <div className="mt-4 flex gap-2">
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
                {updateMut.isPending ? "Saving…" : "Simpan"}
              </button>
              <button
                className="rounded-lg border px-4 py-2 text-sm"
                onClick={() => setSelected(null)}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
