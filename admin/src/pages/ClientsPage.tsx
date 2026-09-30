import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import {
  del,
  get,
  post,
  put,
  type ClientLogo,
} from "../api/client";
import ImageUploader from "../components/ImageUploader";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

const EMPTY = { name: "", logo_url: "", website: "", sort_order: 0, published: true };

export default function ClientsPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: async (): Promise<ClientLogo[]> => {
      try {
        const r = await get<ClientLogo[] | { items: ClientLogo[] }>("/admin/clients");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const items = [...(data ?? [])].sort(
    (a, b) => ((a as any).sort_order ?? 0) - ((b as any).sort_order ?? 0)
  );

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/clients/${f.id}`, f) : post("/admin/clients", f),
    onSuccess: () => {
      toast("Client logo saved");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/clients/${id}`),
    onSuccess: () => {
      toast("Client logo deleted");
      void qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  const move = async (id: string, dir: 1 | -1) => {
    const idx = items.findIndex((i) => i.id === id);
    const other = items[idx + dir];
    if (!other) return;
    try {
      const cur = items[idx] as any;
      await put(`/admin/clients/${cur.id}`, { sort_order: (other as any).sort_order ?? 0 });
      await put(`/admin/clients/${other.id}`, { sort_order: cur.sort_order ?? 0 });
      void qc.invalidateQueries({ queryKey: ["clients"] });
    } catch (e: any) {
      toast(`Reorder failed: ${e?.message ?? "API offline?"}`);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Clients</h1>
      <div className="flex items-center justify-end">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModal({ ...EMPTY, sort_order: items.length })}>
          <Plus className="h-4 w-4" /> Add Logo
        </button>
      </div>
      <section className="rounded-[26px] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold tracking-tight text-ink-primary">
          Client Logos <span className="tabular text-sm font-medium text-ink-secondary">({items.length})</span>
        </h2>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-24 animate-pulse rounded-[20px] bg-surface-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-ink-primary">No client logos yet</p>
            <p className="mt-1 text-xs text-ink-secondary">Logos appear in the homepage marquee, in this order.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((c, i) => (
              <div key={c.id} className="anim-rise lift rounded-[20px] border border-[#e2eceb] p-5 text-center hover:bg-surface-hover" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
                {c.logo_url ? (
                  <div className="flex h-28 items-center justify-center rounded-[14px] bg-white">
                    <img src={c.logo_url} alt={c.name} className="max-h-24 w-auto max-w-full object-contain" />
                  </div>
                ) : (
                  <div className="flex h-28 items-center justify-center rounded-[14px] bg-surface-muted">
                    <p className="text-lg font-bold text-ink-primary">{c.name}</p>
                  </div>
                )}
                <p className="mt-3 truncate text-sm font-semibold text-ink-primary">{c.name}</p>
                <div className="mt-2 flex items-center justify-center gap-1.5">
                  <button aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white text-ink-secondary transition hover:text-ink-primary" onClick={() => setModal({ ...(EMPTY as any), ...(c as any), id: c.id })}><Pencil className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white text-ink-secondary transition hover:text-ink-primary" onClick={() => void move(c.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white text-ink-secondary transition hover:text-ink-primary" onClick={() => void move(c.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete client logo?", c.name, () => delMut.mutate(c.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f3738]/25 p-4 backdrop-blur-[4px]">
          <div className="anim-pop max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[24px] bg-white p-7 shadow-xl">
            <h2 className="text-base font-semibold text-ink-primary">{modal.id ? "Edit" : "Add"} Client Logo</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" value={(modal as any).name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Website (optional)</label>
                <input className="input" value={(modal as any).website ?? ""} onChange={(e) => setModal({ ...modal, website: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Logo image (SVG or PNG)</label>
                <ImageUploader value={(modal as any).logo_url} onChange={(url) => setModal({ ...modal, logo_url: url })} />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(modal as any)}>
                {saveMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
