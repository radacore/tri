import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  del,
  get,
  post,
  put,
  type PortfolioItem,
} from "../api/client";
import ImageUploader from "../components/ImageUploader";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

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

  const { data } = useQuery({
    queryKey: ["portfolio"],
    queryFn: async (): Promise<PortfolioItem[]> => {
      try {
        const r = await get<PortfolioItem[] | { items: PortfolioItem[] }>(
          "/portfolio"
        );
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const items = [...(data ?? [])].sort(
    (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)
  );

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY_FORM & { id?: string }) =>
      f.id
        ? put(`/admin/portfolio/${f.id}`, f)
        : post("/admin/portfolio", f),
    onSuccess: () => {
      toast("Portfolio tersimpan");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: any) => toast(`Gagal simpan: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/portfolio/${id}`),
    onSuccess: () => {
      toast("Portfolio dihapus");
      void qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: any) => toast(`Gagal hapus: ${e?.message ?? "error"}`),
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
      toast(`Reorder gagal: ${e?.message ?? "API offline?"}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Portfolio</h1>
        <button className="btn-primary" onClick={() => setModal({ ...EMPTY_FORM })}>
          + Tambah
        </button>
      </div>
      {items.length === 0 ? (
        <p className="card p-8 text-center text-sm text-slate-500">
          Belum ada portfolio. Tambah item pertama.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((p) => (
            <div key={p.id} className="card overflow-hidden">
              {p.image_url && (
                <img src={p.image_url} alt={p.title} className="h-40 w-full object-cover" />
              )}
              <div className="p-3">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-slate-500">
                  {p.category}
                  {p.featured ? " · ★ featured" : ""}
                  {p.published === false ? " · draft" : ""}
                </p>
                <div className="mt-2 flex gap-1 text-xs">
                  <button className="rounded border px-2 py-1" onClick={() => setModal({ ...EMPTY_FORM, ...p, description: p.description ?? "", category: p.category ?? "", image_url: p.image_url ?? "" })}>
                    Edit
                  </button>
                  <button className="rounded border px-2 py-1" onClick={() => void move(p.id, -1)}>↑</button>
                  <button className="rounded border px-2 py-1" onClick={() => void move(p.id, 1)}>↓</button>
                  <button
                    className="rounded border border-red-200 px-2 py-1 text-red-600"
                    onClick={() => ask("Hapus portfolio?", p.title, () => delMut.mutate(p.id))}
                  >
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
            <h2 className="font-bold">{modal.id ? "Edit" : "Tambah"} Portfolio</h2>
            <label className="label mt-3">Title</label>
            <input className="input" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value })} />
            <label className="label mt-3">Category</label>
            <input className="input" value={modal.category} onChange={(e) => setModal({ ...modal, category: e.target.value })} />
            <label className="label mt-3">Image</label>
            <ImageUploader value={modal.image_url} onChange={(url) => setModal({ ...modal, image_url: url })} />
            <label className="label mt-3">Description</label>
            <textarea className="input" rows={3} value={modal.description} onChange={(e) => setModal({ ...modal, description: e.target.value })} />
            <div className="mt-3 flex gap-4 text-sm">
              <label><input type="checkbox" checked={modal.featured} onChange={(e) => setModal({ ...modal, featured: e.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={modal.published} onChange={(e) => setModal({ ...modal, published: e.target.checked })} /> Published</label>
            </div>
            <label className="label mt-3">Sort order</label>
            <input className="input" type="number" value={modal.sort_order} onChange={(e) => setModal({ ...modal, sort_order: Number(e.target.value) })} />
            <div className="mt-4 flex justify-end gap-2">
              <button className="rounded border px-3 py-1.5 text-sm" onClick={() => setModal(null)}>Batal</button>
              <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(modal)}>
                {saveMut.isPending ? "Saving…" : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
