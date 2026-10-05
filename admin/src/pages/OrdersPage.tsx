import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ChevronDown, ExternalLink, Filter, LayoutGrid, MessageCircle, Plus, Search, X } from "lucide-react";
import {
  ORDER_STATUSES,
  centsToUSD,
  get,
  post,
  put,
  type Order,
  type OrderStatus,
} from "../api/client";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import ImageUploader from "../components/ImageUploader";
import OrderInvoice from "../components/OrderInvoice";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

const TIER_USD: Record<string, number> = { starter: 49, professional: 149, premium: 399 };
const WA_NUMBER = "6281241525485";

function waNumber(raw?: string | null) {
  const d = String(raw ?? "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

function waLink(phone: string | undefined, text: string) {
  const to = waNumber(phone) || WA_NUMBER;
  return `https://wa.me/${to}?text=${encodeURIComponent(text)}`;
}

function shortId(id: string) {
  return id.slice(0, 8).toUpperCase();
}

function paidMsg(o: Order) {
  return `Halo ${o.customer_name}, pembayaran paket ${o.tier} (${centsToUSD(o.total_cents)}) kami terima. Desain mulai dikerjakan, konsep pertama maks. 48 jam. — BrandingPulse #${shortId(o.id)}`;
}

function deliverMsg(o: Order) {
  const links = (o.deliverables ?? []).join("\n");
  return `Halo ${o.customer_name}, brand kit ${o.tier} sudah jadi! Unduh di sini:\n${links}\n— BrandingPulse #${shortId(o.id)}`;
}

function isFollowUp(o: Order) {
  if (o.status !== "pending" || !o.created_at) return false;
  return Date.now() - new Date(o.created_at).getTime() > 24 * 3600 * 1000;
}

const BRIEF_LABELS: Record<string, string> = {
  business: "Business / brand",
  industry: "Industry",
  target: "Target market",
  vibes: "Vibe",
  colors: "Colors",
  notes: "Notes",
};

function BriefView({ brief }: { brief: Order["brief"] }) {
  if (!brief) return <p className="mt-1 text-xs text-ink-secondary">No brief.</p>;
  if (typeof brief === "string") {
    const t = brief.trim();
    if (!t) return <p className="mt-1 text-xs text-ink-secondary">No brief.</p>;
    try {
      const o = JSON.parse(t);
      if (o && typeof o === "object") return <BriefView brief={o as Record<string, unknown>} />;
    } catch { /* teks biasa */ }
    return <p className="mt-1 whitespace-pre-wrap text-sm text-ink-primary">{t}</p>;
  }
  const rows = Object.entries(brief).filter(
    ([k, v]) => !["name", "contact"].includes(k) && v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)
  );
  if (rows.length === 0) return <p className="mt-1 text-xs text-ink-secondary">No brief.</p>;
  return (
    <dl className="mt-1 space-y-2 rounded-[14px] bg-surface-muted p-3">
      {rows.map(([k, v]) => (
        <div key={k} className="text-sm">
          <dt className="text-xs font-semibold text-ink-secondary">{BRIEF_LABELS[k] ?? k.replace(/_/g, " ")}</dt>
          <dd className="mt-0.5 text-ink-primary">
            {Array.isArray(v) ? (
              <span className="flex flex-wrap gap-1.5">
                {v.map((x, i) => (
                  <span key={i} className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium ring-1 ring-[#e2eceb]">{String(x)}</span>
                ))}
              </span>
            ) : k === "colors" && typeof v === "string" ? (
              <span className="whitespace-pre-wrap">{v}</span>
            ) : (
              <span className="whitespace-pre-wrap">{String(v)}</span>
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

interface Summary {
  total_orders: number;
  total_revenue_cents: number;
  pending_followup: number;
  by_status: { status: string; count: number; revenue_cents: number }[];
  by_tier: { tier: string; count: number; revenue_cents: number }[];
}

const NEW_EMPTY = {
  customer_name: "", customer_email: "", customer_phone: "",
  package_tier: "professional", amount_usd: "149", brief: "", notes: "", mark_paid: false,
};

export default function OrdersPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [tier, setTier] = useState<string>("all");
  const [q, setQ] = useState("");
  const [period, setPeriod] = useState<string>("30");
  const [selected, setSelected] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus>("paid");
  const [note, setNote] = useState("");
  const [deliverable, setDeliverable] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [proof, setProof] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ ...NEW_EMPTY });
  const { dialog: confirmDialog, ask } = useConfirm();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  const range = useMemo(() => {
    if (period === "all") return "";
    const d = new Date();
    d.setDate(d.getDate() - Number(period));
    return `&from=${d.toISOString().slice(0, 10)}`;
  }, [period]);

  const { data: summary } = useQuery({
    queryKey: ["orders-summary", period],
    queryFn: async (): Promise<Summary> => {
      const r = await get<any>(`/admin/orders-summary?x=1${range}`);
      return {
        total_orders: r.total_orders ?? 0,
        total_revenue_cents: r.total_revenue_cents ?? 0,
        pending_followup: r.pending_followup ?? 0,
        by_status: r.by_status ?? [],
        by_tier: r.by_tier ?? [],
      };
    },
  });

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
          [o.customer_name, o.customer_email, o.customer_phone, o.id, o.tier]
            .join(" ")
            .toLowerCase()
            .includes(needle))
    );
  }, [orders, status, tier, q]);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["orders"] });
    void qc.invalidateQueries({ queryKey: ["orders-summary"] });
    void qc.invalidateQueries({ queryKey: ["dashboard"] });
  };

  const stageMut = useMutation({
    mutationFn: (body: { id: string; stage: string }) => put(`/admin/orders/${body.id}`, { stage: body.stage }),
    onSuccess: (_d, v) => {
      toast("Stage updated");
      setSelected((s) => (s ? { ...s, stage: v.stage } : s));
      refresh();
    },
    onError: (e: any) => toast(`Update failed: ${e?.message ?? "error"}`),
  });
  const updateMut = useMutation({
    mutationFn: (body: Record<string, unknown> & { id: string }) => {
      const { id, ...rest } = body;
      return put(`/admin/orders/${id}`, rest);
    },
    onSuccess: () => {
      toast("Order updated");
      setSelected(null);
      refresh();
    },
    onError: (e: any) => toast(`Update failed: ${e?.message ?? "error"}`),
  });

  const createMut = useMutation({
    mutationFn: () =>
      post("/admin/orders", {
        customer_name: form.customer_name.trim(),
        customer_email: form.customer_email.trim(),
        customer_phone: form.customer_phone.trim(),
        package_tier: form.package_tier,
        amount_usd: Number(form.amount_usd) || undefined,
        brief: form.brief.trim(),
        notes: form.notes.trim(),
        mark_paid: form.mark_paid,
      }),
    onSuccess: () => {
      toast("Order created");
      setCreating(false);
      setForm({ ...NEW_EMPTY });
      refresh();
    },
    onError: (e: any) => toast(`Create failed: ${e?.message ?? "error"}`),
  });

  const openDetail = (r: Order) => {
    setSelected(r);
    setNewStatus(r.status);
    setNote("");
    setDeliverable("");
    setPhone(r.customer_phone ?? "");
    setNotes(r.notes ?? "");
    setProof(r.payment_proof ?? "");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Orders</h1>
        <div className="flex items-center gap-2">
          <select className="input input-pill appearance-none pr-8 text-xs font-medium" value={period} onChange={(e) => setPeriod(e.target.value)} aria-label="Periode rekap">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All time</option>
          </select>
          <Link to="/orders/board" className="btn-secondary inline-flex items-center gap-2 whitespace-nowrap">
            <LayoutGrid className="h-4 w-4" /> Board
          </Link>
          <button className="btn-primary inline-flex items-center gap-2 whitespace-nowrap" onClick={() => { setForm({ ...NEW_EMPTY }); setCreating(true); }}>
            <Plus className="h-4 w-4" /> New order
          </button>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total orders", value: String(summary?.total_orders ?? "—") },
          { label: "Revenue collected", value: summary ? centsToUSD(summary.total_revenue_cents) : "—" },
          { label: "Needs follow-up", value: String(summary?.pending_followup ?? "—") },
          { label: "Average order", value: summary && summary.total_orders > 0 ? centsToUSD(Math.round(summary.total_revenue_cents / summary.total_orders)) : "—" },
        ].map((s) => (
          <div key={s.label} className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-[#e2eceb]/60">
            <p className="text-xs font-semibold text-ink-secondary">{s.label}</p>
            <p className="tabular mt-1 text-xl font-extrabold text-ink-primary">{s.value}</p>
          </div>
        ))}
      </section>
      {(summary?.by_tier?.length ?? 0) > 0 && (
        <section className="rounded-[20px] bg-white p-4 shadow-sm ring-1 ring-[#e2eceb]/60">
          <div className="flex flex-wrap gap-4 text-sm">
            {(summary?.by_tier ?? []).map((t) => (
              <p key={t.tier} className="text-ink-secondary">
                <span className="font-bold capitalize text-ink-primary">{t.tier}</span> · {t.count} order ·{" "}
                <span className="tabular font-semibold text-ink-primary">{centsToUSD(t.revenue_cents)}</span>
              </p>
            ))}
          </div>
        </section>
      )}

      <section className="rounded-[26px] bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink-primary">Order List</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input input-pill w-44 pl-8 text-xs" />
            </div>
            <div className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-secondary" />
              <select className="input input-pill appearance-none pl-9 text-xs font-medium" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3 w-3 -translate-y-1/2 text-ink-secondary" />
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
          </div>
        </div>

        <DataTable<Order>
          data={filtered}
          columns={[
            { key: "id", label: "Order", render: (r) => <span className="tabular font-mono text-xs">{r.id.slice(0, 8)}</span> },
            { key: "customer_name", label: "Customer", sortable: true, render: (r) => (<div><p className="font-semibold">{r.customer_name} {isFollowUp(r) && <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">Follow up</span>}</p><p className="text-xs text-ink-secondary">{r.customer_email}</p></div>) },
            { key: "tier", label: "Tier", sortable: true, render: (r) => <span className="capitalize">{r.tier}</span> },
            { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} /> },
            { key: "created_at", label: "Date", sortable: true, render: (r) => <span className="tabular text-xs text-ink-secondary">{(r.created_at ?? "").slice(0, 10)}</span> },
            { key: "total_cents", label: "Total", sortable: true, value: (r) => r.total_cents, render: (r) => <span className="tabular font-semibold">{centsToUSD(r.total_cents)}</span> },
            { key: "actions", label: "Details", render: (r) => (<button className="btn-secondary px-4 py-1.5 text-xs" onClick={() => openDetail(r)}>View</button>) },
          ]}
        />
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="anim-pop max-h-[92vh] w-full max-w-[920px] overflow-y-auto rounded-[24px] bg-white p-6 shadow-xl ring-1 ring-black/10 sm:p-7">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-semibold text-ink-primary">Order {selected.id.slice(0, 8)}</h2>
                <p className="mt-1 text-sm text-ink-secondary">{selected.customer_name} · {selected.customer_email}</p>
                {selected.customer_phone && <p className="text-sm text-ink-secondary">WA: {selected.customer_phone}</p>}
              </div>
              <button onClick={() => setSelected(null)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-full text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
            <p className="text-sm text-ink-primary">
              Tier: <b className="capitalize">{selected.tier}</b> · Total: <b className="tabular">{centsToUSD(selected.total_cents)}</b>
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge status={selected.status} />
              <a className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline" target="_blank" rel="noreferrer"
                href={waLink(selected.customer_phone || selected.customer_email, `Halo ${selected.customer_name}, ini BrandingPulse terkait order #${shortId(selected.id)} (${selected.tier}, ${centsToUSD(selected.total_cents)}).`)}>
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </div>

            {selected.status === "pending" && (
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button className="btn-primary" disabled={updateMut.isPending}
                  onClick={() => ask(`Accept order ${shortId(selected.id)}?`, `${selected.customer_name} — mark as paid.`, () => updateMut.mutate({ id: selected.id, status: "paid", note: note || "Accepted via WhatsApp" }), { label: "Accept", danger: false })}>
                  Accept — mark paid
                </button>
                <button className="btn-secondary" disabled={updateMut.isPending}
                  onClick={() => { setRejecting(true); setReason(note); }}>
                  Reject
                </button>
              </div>
            )}

            <h3 className="mt-5 text-sm font-semibold text-ink-primary">Brief</h3>
            <BriefView brief={selected.brief} />

            <h3 className="mt-4 text-sm font-semibold text-ink-primary">History</h3>
            {(selected.history ?? []).length === 0 ? (
              <p className="text-xs text-ink-secondary">No history yet.</p>
            ) : (
              <ul className="text-xs text-ink-secondary">
                {(selected.history ?? []).map((h, i) => (
                  <li key={i} className="tabular">{(h.at ?? "").slice(0, 16).replace("T", " ")} — {h.status}{h.note ? ` (${h.note})` : ""}</li>
                ))}
              </ul>
            )}
              </div>
              <div>
            <h3 className="text-sm font-semibold text-ink-primary">Payment proof</h3>
            {selected.payment_proof || proof ? (
              <a href={proof || selected.payment_proof || ""} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                <ExternalLink className="h-3.5 w-3.5" /> View proof
              </a>
            ) : <p className="mt-1 text-xs text-ink-secondary">None yet.</p>}
            <div className="mt-2"><ImageUploader value={proof} onChange={setProof} /></div>

            <h3 className="mt-4 text-sm font-semibold text-ink-primary">Deliverables</h3>
            <ul className="text-xs">
              {(selected.deliverables ?? []).map((d, i) => (
                <li key={i} className="break-all"><a href={d} target="_blank" rel="noreferrer" className="text-brand hover:underline">{d}</a></li>
              ))}
              {(selected.deliverables ?? []).length === 0 && <li className="text-ink-secondary">No files yet.</li>}
            </ul>
            {(selected.deliverables ?? []).length > 0 && (
              <a className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline" target="_blank" rel="noreferrer"
                href={waLink(selected.customer_phone || selected.customer_email, deliverMsg({ ...selected, deliverables: [...(selected.deliverables ?? []), ...(deliverable ? [deliverable] : [])] }))}>
                <MessageCircle className="h-3.5 w-3.5" /> Send via WhatsApp
              </a>
            )}

            {["completed", "delivered"].includes(selected.status) && (
              <>
                <h3 className="mt-4 text-sm font-semibold text-ink-primary">Invoice (PDF / image)</h3>
                <OrderInvoice order={selected} />
              </>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label mt-4">Payment status</label>
                <select className="input" value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)}>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label mt-4">Design stage</label>
                <select className="input capitalize" value={selected.stage ?? "brief"} disabled={stageMut.isPending} onChange={(e) => stageMut.mutate({ id: selected.id, stage: e.target.value })}>
                  {["brief", "concepts", "revision", "delivery", "done"].map((s) => (
                    <option key={s} value={s} className="capitalize">{s}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="label mt-3">Note (goes to history)</label>
                <input className="input" placeholder="e.g. DP paid via bank transfer" value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
              <div>
                <label className="label mt-3">Add deliverable (URL)</label>
                <input className="input" placeholder="https://…" value={deliverable} onChange={(e) => setDeliverable(e.target.value)} />
              </div>
              <div>
                <label className="label mt-3">Customer WhatsApp number</label>
                <input className="input" placeholder="628…" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="label mt-3">Internal notes</label>
                <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setSelected(null)}>Close</button>
              <button className="btn-primary" disabled={updateMut.isPending}
                onClick={() => updateMut.mutate({
                  id: selected.id, status: newStatus, note: note || undefined,
                  deliverables: deliverable ? [...(selected.deliverables ?? []), deliverable] : undefined,
                  customer_phone: phone || undefined, notes: notes || undefined,
                  payment_proof: proof !== (selected.payment_proof ?? "") ? proof : undefined,
                })}>
                {updateMut.isPending ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmDialog}
      {rejecting && selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="anim-pop w-full max-w-[420px] rounded-[24px] bg-white p-6 shadow-xl ring-1 ring-black/10">
            <h2 className="text-base font-semibold text-ink-primary">Reject order?</h2>
            <p className="mt-1 text-sm text-ink-secondary">
              {selected.customer_name} will be moved to Closed.
            </p>
            <label className="label mt-4">Reason (recorded in history)</label>
            <input
              className="input"
              autoFocus
              placeholder="e.g. spam, duplicate, cancelled by customer"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  updateMut.mutate({ id: selected.id, status: "cancelled", note: reason.trim() || "Rejected" });
                  setRejecting(false);
                }
              }}
            />
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setRejecting(false)}>Cancel</button>
              <button
                className="btn-primary"
                disabled={updateMut.isPending}
                onClick={() => {
                  updateMut.mutate({ id: selected.id, status: "cancelled", note: reason.trim() || "Rejected" });
                  setRejecting(false);
                }}
              >
                {updateMut.isPending ? "Rejecting…" : "Reject order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="anim-pop max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-[24px] bg-white p-7 shadow-xl ring-1 ring-black/10">
            <h2 className="text-base font-semibold text-ink-primary">New manual order</h2>
            <p className="mt-1 text-xs text-ink-secondary">For WhatsApp orders that never went through the landing form.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Customer name *</label>
                <input className="input" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email / contact</label>
                <input className="input" value={form.customer_email} onChange={(e) => setForm({ ...form, customer_email: e.target.value })} />
              </div>
              <div>
                <label className="label">WhatsApp number</label>
                <input className="input" placeholder="628…" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} />
              </div>
              <div>
                <label className="label">Package</label>
                <select className="input" value={form.package_tier} onChange={(e) => setForm({ ...form, package_tier: e.target.value, amount_usd: String(TIER_USD[e.target.value] ?? "") })}>
                  <option value="starter">Starter — $49</option>
                  <option value="professional">Professional — $149</option>
                  <option value="premium">Premium — $399</option>
                </select>
              </div>
              <div>
                <label className="label">Amount (USD)</label>
                <input className="input tabular" type="number" min="0" step="1" value={form.amount_usd} onChange={(e) => setForm({ ...form, amount_usd: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Brief / requirements</label>
                <textarea className="input" rows={3} value={form.brief} onChange={(e) => setForm({ ...form, brief: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Internal notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-primary sm:col-span-2">
                <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f3738]" checked={form.mark_paid} onChange={(e) => setForm({ ...form, mark_paid: e.target.checked })} /> Mark as paid immediately
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setCreating(false)}>Cancel</button>
              <button className="btn-primary" disabled={createMut.isPending || !form.customer_name.trim()}
                onClick={() => createMut.mutate()}>
                {createMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
