import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { del, get, post, put, type BlogPost } from "../api/client";
import MarkdownEditor from "../components/MarkdownEditor";
import ImageUploader from "../components/ImageUploader";
import DataTable from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  title: "", slug: "", category: "", thumbnail: "", content: "",
  meta_title: "", meta_description: "", published: false, published_at: "",
};

export default function BlogPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data } = useQuery({
    queryKey: ["blog"],
    queryFn: async (): Promise<BlogPost[]> => {
      try {
        const r = await get<BlogPost[] | { items: BlogPost[] }>("/blog");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const rows = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/blog/${f.id}`, { ...f, published_at: f.published_at || null }) : post("/admin/blog", { ...f, published_at: f.published_at || null }),
    onSuccess: () => {
      toast("Artikel tersimpan");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (e: any) => toast(`Gagal simpan: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/blog/${id}`),
    onSuccess: () => {
      toast("Artikel dihapus");
      void qc.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (e: any) => toast(`Gagal hapus: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Blog</h1>
        <button className="btn-primary" onClick={() => setModal({ ...EMPTY })}>+ Tulis Artikel</button>
      </div>
      <DataTable<BlogPost>
        data={rows}
        searchKeys={["title", "slug", "category"]}
        columns={[
          { key: "title", label: "Title", sortable: true },
          { key: "category", label: "Category", sortable: true },
          { key: "published", label: "Status", render: (r) => (r.published ? "Published" : "Draft") },
          { key: "published_at", label: "Schedule", render: (r) => <span className="text-xs">{(r.published_at ?? "").slice(0, 16) || "—"}</span> },
          { key: "aksi", label: "Aksi", render: (r) => (
            <div className="flex gap-1 text-xs">
              <button className="rounded border px-2 py-1" onClick={() => setModal({ title: r.title, slug: r.slug, category: r.category ?? "", thumbnail: r.thumbnail ?? "", content: r.content ?? "", meta_title: r.meta_title ?? "", meta_description: r.meta_description ?? "", published: !!r.published, published_at: (r.published_at ?? "").slice(0, 16), id: r.id })}>Edit</button>
              <button className="rounded border border-red-200 px-2 py-1 text-red-600" onClick={() => ask("Hapus artikel?", r.title, () => delMut.mutate(r.id))}>Hapus</button>
            </div>
          ) },
        ]}
      />
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card max-h-[90vh] w-full max-w-2xl overflow-y-auto p-5">
            <h2 className="font-bold">{modal.id ? "Edit" : "Tulis"} Artikel</h2>
            <label className="label mt-3">Title</label>
            <input className="input" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value, slug: modal.id ? modal.slug : slugify(e.target.value) })} />
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label mt-3">Slug</label><input className="input" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: slugify(e.target.value) })} /></div>
              <div><label className="label mt-3">Category</label><input className="input" value={modal.category} onChange={(e) => setModal({ ...modal, category: e.target.value })} /></div>
            </div>
            <label className="label mt-3">Thumbnail</label>
            <ImageUploader value={modal.thumbnail} onChange={(url) => setModal({ ...modal, thumbnail: url })} />
            <label className="label mt-3">Content</label>
            <MarkdownEditor value={modal.content} onChange={(v) => setModal({ ...modal, content: v })} />
            <label className="label mt-3">Meta title</label>
            <input className="input" value={modal.meta_title} onChange={(e) => setModal({ ...modal, meta_title: e.target.value })} />
            <label className="label mt-3">Meta description</label>
            <textarea className="input" rows={2} value={modal.meta_description} onChange={(e) => setModal({ ...modal, meta_description: e.target.value })} />
            <div className="mt-3 flex items-center gap-3 text-sm">
              <label><input type="checkbox" checked={modal.published} onChange={(e) => setModal({ ...modal, published: e.target.checked })} /> Published</label>
              <label>Jadwal: <input type="datetime-local" className="input" value={modal.published_at} onChange={(e) => setModal({ ...modal, published_at: e.target.value })} /></label>
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
