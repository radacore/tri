import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, post, put, type CaseStudy } from "../api/client";
import MarkdownEditor from "../components/MarkdownEditor";
import ImageUploader from "../components/ImageUploader";
import DataTable from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = { title: "", slug: "", industry: "", hero_image: "", content: "", published: false };

export default function CaseStudiesPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data } = useQuery({
    queryKey: ["case-studies"],
    queryFn: async (): Promise<CaseStudy[]> => {
      try {
        const r = await get<CaseStudy[] | { items: CaseStudy[] }>("/case-studies");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const rows = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/case-studies/${f.id}`, f) : post("/admin/case-studies", f),
    onSuccess: () => {
      toast("Case study tersimpan");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["case-studies"] });
    },
    onError: (e: any) => toast(`Gagal simpan: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/case-studies/${id}`),
    onSuccess: () => {
      toast("Case study dihapus");
      void qc.invalidateQueries({ queryKey: ["case-studies"] });
    },
    onError: (e: any) => toast(`Gagal hapus: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Case Studies</h1>
        <button className="btn-primary" onClick={() => setModal({ ...EMPTY })}>+ Tambah</button>
      </div>
      <DataTable<CaseStudy>
        data={rows}
        searchKeys={["title", "slug", "industry"]}
        columns={[
          { key: "title", label: "Title", sortable: true },
          { key: "slug", label: "Slug" },
          { key: "industry", label: "Industry" },
          { key: "published", label: "Status", render: (r) => (r.published ? "Published" : "Draft") },
          { key: "aksi", label: "Aksi", render: (r) => (
            <div className="flex gap-1 text-xs">
              <button className="rounded border px-2 py-1" onClick={() => setModal({ title: r.title, slug: r.slug, industry: r.industry ?? "", hero_image: r.hero_image ?? "", content: r.content ?? "", published: !!r.published, id: r.id })}>Edit</button>
              <button className="rounded border border-red-200 px-2 py-1 text-red-600" onClick={() => ask("Hapus case study?", r.title, () => delMut.mutate(r.id))}>Hapus</button>
            </div>
          ) },
        ]}
      />
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
            <h2 className="font-bold">{modal.id ? "Edit" : "Tambah"} Case Study</h2>
            <label className="label mt-3">Title</label>
            <input className="input" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value, slug: modal.id ? modal.slug : slugify(e.target.value) })} />
            <label className="label mt-3">Slug (auto)</label>
            <input className="input" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: slugify(e.target.value) })} />
            <label className="label mt-3">Industry</label>
            <input className="input" value={modal.industry} onChange={(e) => setModal({ ...modal, industry: e.target.value })} />
            <label className="label mt-3">Hero image</label>
            <ImageUploader value={modal.hero_image} onChange={(url) => setModal({ ...modal, hero_image: url })} />
            <label className="label mt-3">Content (markdown)</label>
            <MarkdownEditor value={modal.content} onChange={(v) => setModal({ ...modal, content: v })} />
            <label className="mt-3 block text-sm"><input type="checkbox" checked={modal.published} onChange={(e) => setModal({ ...modal, published: e.target.checked })} /> Published</label>
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
