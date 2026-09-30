import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  del,
  get,
  post,
  put,
  type BlogPost,
} from "../api/client";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import ImageUploader from "../components/ImageUploader";
import MarkdownEditor from "../components/MarkdownEditor";
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

  const { data, isLoading } = useQuery({
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
  const items = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/blog/${f.id}`, { ...f, published_at: f.published_at || null }) : post("/admin/blog", { ...f, published_at: f.published_at || null }),
    onSuccess: () => {
      toast("Article saved");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/blog/${id}`),
    onSuccess: () => {
      toast("Article deleted");
      void qc.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModal({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> New Article
        </button>
      </div>
      <section className="rounded-[26px] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold tracking-tight text-ink-primary">
          All Articles
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-[14px] bg-surface-muted" />
            ))}
          </div>
        ) : (
          <DataTable<BlogPost>
            data={items}
            searchKeys={["title", "slug", "category"]}
            searchPlaceholder="Search articles…"
            columns={[
              { key: "title", label: "Title", sortable: true, render: (r) => <span className="font-semibold">{r.title}</span> },
              { key: "category", label: "Category" },
              { key: "published", label: "Status", render: (r) => <Badge status={r.published ? "completed" : "pending"} /> },
              { key: "published_at", label: "Publish At", render: (r) => <span className="tabular text-xs text-ink-secondary">{(r.published_at ?? "").slice(0, 16).replace("T", " ") || "—"}</span> },
              { key: "actions", label: "Actions", render: (r) => (
                <div className="flex gap-1.5">
                  <button aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary" onClick={() => setModal({ title: r.title, slug: r.slug, category: r.category ?? "", thumbnail: r.thumbnail ?? "", content: r.content ?? "", meta_title: r.meta_title ?? "", meta_description: r.meta_description ?? "", published: !!r.published, published_at: (r.published_at ?? "").slice(0, 16), id: r.id })}><Pencil className="h-3.5 w-3.5" /></button>
                  <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete article?", r.title, () => delMut.mutate(r.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) },
            ]}
          />
        )}
      </section>
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f3738]/25 p-4 backdrop-blur-[4px]">
          <div className="anim-pop max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[24px] bg-white p-7 shadow-xl">
            <h2 className="text-base font-semibold text-ink-primary">{modal.id ? "Edit" : "New"} Article</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="label">Title</label>
                <input className="input" value={modal.title} onChange={(e) => setModal({ ...modal, title: e.target.value, slug: modal.id ? modal.slug : slugify(e.target.value) })} />
              </div>
              <div>
                <label className="label">Slug</label>
                <input className="input font-mono" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: slugify(e.target.value) })} />
              </div>
              <div>
                <label className="label">Category</label>
                <input className="input" value={modal.category} onChange={(e) => setModal({ ...modal, category: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Thumbnail</label>
                <ImageUploader value={modal.thumbnail} onChange={(url) => setModal({ ...modal, thumbnail: url })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Content</label>
                <MarkdownEditor value={modal.content} onChange={(v) => setModal({ ...modal, content: v })} />
              </div>
              <div>
                <label className="label">Meta title</label>
                <input className="input" value={modal.meta_title} onChange={(e) => setModal({ ...modal, meta_title: e.target.value })} />
              </div>
              <div>
                <label className="label">Scheduled publish (optional)</label>
                <input className="input tabular" type="datetime-local" value={modal.published_at} onChange={(e) => setModal({ ...modal, published_at: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Meta description</label>
                <textarea className="input" rows={2} value={modal.meta_description} onChange={(e) => setModal({ ...modal, meta_description: e.target.value })} />
              </div>
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
