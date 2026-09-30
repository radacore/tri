import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, post, put, type Testimonial } from "../api/client";
import ImageUploader from "../components/ImageUploader";
import DataTable from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

const EMPTY = { name: "", role: "", company: "", avatar_url: "", quote: "", rating: 5, featured: false, published: true };

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <div className="flex gap-1 text-lg">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onPick?.(n)} className={n <= value ? "text-amber-500" : "text-slate-300"}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async (): Promise<Testimonial[]> => {
      try {
        const r = await get<Testimonial[] | { items: Testimonial[] }>("/testimonials");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const rows = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/testimonials/${f.id}`, f) : post("/admin/testimonials", f),
    onSuccess: () => {
      toast("Testimonial tersimpan");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
    onError: (e: any) => toast(`Gagal simpan: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/testimonials/${id}`),
    onSuccess: () => {
      toast("Testimonial dihapus");
      void qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
    onError: (e: any) => toast(`Gagal hapus: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Testimonials</h1>
        <button className="btn-primary" onClick={() => setModal({ ...EMPTY })}>+ Tambah</button>
      </div>
      <DataTable<Testimonial>
        data={rows}
        searchKeys={["name", "company", "quote"]}
        columns={[
          { key: "name", label: "Nama", sortable: true, render: (r) => (<div><p className="font-medium">{r.name}</p><p className="text-xs text-slate-500">{r.role} @ {r.company}</p></div>) },
          { key: "rating", label: "Rating", sortable: true, value: (r) => r.rating, render: (r) => <Stars value={r.rating} /> },
          { key: "featured", label: "Featured", render: (r) => (r.featured ? "★ Yes" : "—") },
          { key: "aksi", label: "Aksi", render: (r) => (
            <div className="flex gap-1 text-xs">
              <button className="rounded border px-2 py-1" onClick={() => setModal({ name: r.name, role: r.role ?? "", company: r.company ?? "", avatar_url: r.avatar_url ?? "", quote: r.quote, rating: r.rating, featured: !!r.featured, published: r.published !== false, id: r.id })}>Edit</button>
              <button className="rounded border border-red-200 px-2 py-1 text-red-600" onClick={() => ask("Hapus testimonial?", r.name, () => delMut.mutate(r.id))}>Hapus</button>
            </div>
          ) },
        ]}
      />
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto p-5">
            <h2 className="font-bold">{modal.id ? "Edit" : "Tambah"} Testimonial</h2>
            <label className="label mt-3">Nama</label>
            <input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label mt-3">Role</label><input className="input" value={modal.role} onChange={(e) => setModal({ ...modal, role: e.target.value })} /></div>
              <div><label className="label mt-3">Company</label><input className="input" value={modal.company} onChange={(e) => setModal({ ...modal, company: e.target.value })} /></div>
            </div>
            <label className="label mt-3">Foto</label>
            <ImageUploader value={modal.avatar_url} onChange={(url) => setModal({ ...modal, avatar_url: url })} />
            <label className="label mt-3">Quote</label>
            <textarea className="input" rows={3} value={modal.quote} onChange={(e) => setModal({ ...modal, quote: e.target.value })} />
            <label className="label mt-3">Rating</label>
            <Stars value={modal.rating} onPick={(n) => setModal({ ...modal, rating: n })} />
            <div className="mt-3 flex gap-4 text-sm">
              <label><input type="checkbox" checked={modal.featured} onChange={(e) => setModal({ ...modal, featured: e.target.checked })} /> Featured</label>
              <label><input type="checkbox" checked={modal.published} onChange={(e) => setModal({ ...modal, published: e.target.checked })} /> Published</label>
            </div>
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
