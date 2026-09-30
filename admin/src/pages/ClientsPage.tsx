import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, post, put, type ClientLogo } from "../api/client";
import ImageUploader from "../components/ImageUploader";
import DataTable from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

const EMPTY = { name: "", logo_url: "", website: "", sort_order: 0, published: true };

export default function ClientsPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data } = useQuery({
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
  const rows = [...(data ?? [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/clients/${f.id}`, f) : post("/admin/clients", f),
    onSuccess: () => {
      toast("Client tersimpan");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: any) => toast(`Gagal simpan: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/clients/${id}`),
    onSuccess: () => {
      toast("Client dihapus");
      void qc.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (e: any) => toast(`Gagal hapus: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clients</h1>
        <button className="btn-primary" onClick={() => setModal({ ...EMPTY })}>+ Tambah</button>
      </div>
      <DataTable<ClientLogo>
        data={rows}
        searchKeys={["name"]}
        columns={[
          { key: "logo_url", label: "Logo", render: (r) => (r.logo_url ? <img src={r.logo_url} alt={r.name} className="h-8 object-contain" /> : "—") },
          { key: "name", label: "Nama", sortable: true },
          { key: "sort_order", label: "Sort", sortable: true, value: (r) => r.sort_order ?? 0 },
          { key: "aksi", label: "Aksi", render: (r) => (
            <div className="flex gap-1 text-xs">
              <button className="rounded border px-2 py-1" onClick={() => setModal({ name: r.name, logo_url: r.logo_url, website: r.website ?? "", sort_order: r.sort_order ?? 0, published: r.published !== false, id: r.id })}>Edit</button>
              <button className="rounded border border-red-200 px-2 py-1 text-red-600" onClick={() => ask("Hapus client?", r.name, () => delMut.mutate(r.id))}>Hapus</button>
            </div>
          ) },
        ]}
      />
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-5">
            <h2 className="font-bold">{modal.id ? "Edit" : "Tambah"} Client</h2>
            <label className="label mt-3">Nama</label>
            <input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
            <label className="label mt-3">Logo (SVG/PNG)</label>
            <ImageUploader value={modal.logo_url} onChange={(url) => setModal({ ...modal, logo_url: url })} />
            <label className="label mt-3">Website</label>
            <input className="input" value={modal.website} onChange={(e) => setModal({ ...modal, website: e.target.value })} />
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
