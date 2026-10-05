import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  del,
  get,
  post,
  put,
  type PortfolioItem,
} from "../api/client";
import ImageUploader from "../components/ImageUploader";
import CategorySelect from "../components/CategorySelect";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";
import Badge from "../components/Badge";
import Pager, { paginate } from "../components/Pager";
import { Search } from "lucide-react";

const EMPTY_FORM = {
  title: "",
  category: "",
  image_url: "",
  description: "",
  featured: false,
  published: true,
  sort_order: 0,
};

export default function PortfolioPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY_FORM & { id?: string })>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async (): Promise<PortfolioItem[]> => {
      try {
        const r = await get<PortfolioItem[] | { items: PortfolioItem[] }>(
          "/admin/portfolio"
        );
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const items = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = [...(data ?? [])].sort(
      (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
    );
    if (!needle) return list;
    return list.filter((x) => `${x.title} ${x.category} ${x.id}`.toLowerCase().includes(needle));
  }, [data, q]);
  useEffect(() => { setPage(0); }, [q, data?.length]);
  const pg = paginate(items, page, 9);

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY_FORM & { id?: string }) =>
      f.id
        ? put(`/admin/portfolio/${f.id}`, f)
        : post("/admin/portfolio", f),
    onSuccess: () => {
      toast("Portfolio item saved");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/portfolio/${id}`),
    onSuccess: () => {
      toast("Portfolio item deleted");
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  const move = async (id: string, dir: 1 | -1) => {
    const idx = items.findIndex((i) => i.id === id);
    const other = items[idx + dir];
    if (!other) return;
    try {
      const cur = items[idx];
      await put(`/admin/portfolio/${cur.id}`, {
        sort_order: (other.sort_order ?? 0),
      });
      await put(`/admin/portfolio/${other.id}`, {
        sort_order: (cur.sort_order ?? 0),
      });
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    } catch (e: any) {
      toast(`Reorder failed: ${e?.message ?? "API offline?"}`);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Portfolio</h1>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-secondary">
          <span className="tabular font-semibold text-ink-primary">{items.length}</span> items
        </p>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="input input-pill w-44 pl-8 text-xs" />
          </div>
          <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModal({ ...EMPTY_FORM })}>
            <Plus className="h-4 w-4" /> Add Item
          </button>
        </div>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-64 animate-pulse rounded-[24px] bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[24px] bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-semibold text-ink-primary">No portfolio items yet</p>
          <p className="mt-1 text-sm text-ink-secondary">Add your first piece of work to showcase it on the website.</p>
          <button className="btn-primary mt-4" onClick={() => setModal({ ...EMPTY_FORM })}>
            + Add First Item
          </button>
        </div>
      ) : (
        <>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pg.slice.map((p, i) => (
            <div key={p.id} className="anim-rise lift overflow-hidden rounded-[24px] bg-white shadow-sm" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="h-40 w-full object-cover" />
              )}
              <div className="p-5">
                <p className="font-semibold text-ink-primary">{p.title}</p>
                <p className="mt-1 flex items-center gap-2 text-xs text-ink-secondary">
                  {p.category}
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2 py-0.5 font-semibold text-[#92400e]">
                      <Star className="h-3 w-3" /> Featured
                    </span>
                  )}
                  {p.published === false && <Badge status="draft" />}
                </p>
                <div className="mt-3 flex gap-1.5 text-xs">
                  <button className="btn-secondary inline-flex items-center gap-1 px-3 py-1.5 text-xs" onClick={() => setModal({ ...EMPTY_FORM, ...p, description: p.description ?? "", category: p.category ?? "", image_url: p.image_url ?? "" })}>
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button aria-label="Move up" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary" onClick={() => void move(p.id, -1)}><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button aria-label="Move down" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary" onClick={() => void move(p.id, 1)}><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button
                    aria-label="Delete"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]"
                    onClick={() => ask("Delete portfolio item?", p.title, () => delMut.mutate(p.id))}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pager page={pg.safe} pages={pg.pages} onPage={setPage} from={pg.from} to={pg.to} total={items.length} />
        </>
      )}
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="anim-pop max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[24px] bg-white p-7 shadow-xl ring-1 ring-black/10">
            <h2 className="text-base font-semibold text-ink-primary">{modal.id ? "Edit" : "Add"} Portfolio Item</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input className="input" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} />
              </div>
              <div>
                <label className="label">Category</label>
                <CategorySelect
                  value={modal.category}
                  onChange={(v) => setModal({ ...modal, category: v })}
                />
              </div>
              <div>
                <label className="label">Sort order</label>
                <input className="input tabular" type="number" value={modal.sort_order} onChange={(e) => setModal({ ...modal, sort_order: Number(e.target.value) })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Image</label>
                <ImageUploader value={modal.image_url} onChange={(url) => setModal({ ...modal, image_url: url })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Description</label>
                <textarea className="input" rows={3} value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-primary">
                <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f3738]" checked={modal.featured} onChange={(e) => setModal({ ...modal, featured: e.target.checked })} /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm text-ink-primary">
                <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f3738]" checked={modal.published} onChange={(e) => setModal({ ...modal, published: e.target.checked })} /> Published
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(modal)}>
                {saveMut.isPending ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
