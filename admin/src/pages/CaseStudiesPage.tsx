import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  del,
  get,
  post,
  put,
  type CaseStudy,
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

const EMPTY = { title: "", slug: "", industry: "", hero_image: "", content: "", published: false };

export default function CaseStudiesPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data, isLoading } = useQuery({
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
  const items = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/case-studies/${f.id}`, f) : post("/admin/case-studies", f),
    onSuccess: () => {
      toast("Case study saved");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["case-studies"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/case-studies/${id}`),
    onSuccess: () => {
      toast("Case study deleted");
      void qc.invalidateQueries({ queryKey: ["case-studies"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Case Studies</h1>
      <div className="flex items-center justify-end">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModal({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Add Case Study
        </button>
      </div>
          <DataTable<CaseStudy>
            title="All Case Studies"
            loading={isLoading}
            data={items}
            searchKeys={["title", "slug", "industry"]}
            searchPlaceholder="Search case studies…"
            columns={[
              { key: "title", label: "Title", sortable: true, render: (r) => <span className="font-semibold">{r.title}</span> },
              { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-xs text-ink-secondary">{r.slug}</span> },
              { key: "industry", label: "Industry" },
              { key: "published", label: "Status", render: (r) => <Badge status={r.published ? "completed" : "pending"} /> },
              { key: "actions", label: "Actions", render: (r) => (
                <div className="flex gap-1.5">
                  <button aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary" onClick={() => setModal({ title: r.title, slug: r.slug, industry: r.industry ?? "", hero_image: r.hero_image ?? "", content: r.content ?? "", published: !!r.published, id: r.id })}><Pencil className="h-3.5 w-3.5" /></button>
                  <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete case study?", r.title, () => delMut.mutate(r.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) },
            ]}
          />
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f3738]/25 p-4 backdrop-blur-[4px]">
          <div className="anim-pop max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[24px] bg-white p-7 shadow-xl">
            <h2 className="text-base font-semibold text-ink-primary">{modal.id ? "Edit" : "Add"} Case Study</h2>
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
                <label className="label">Industry</label>
                <input className="input" value={modal.industry} onChange={(e) => setModal({ ...modal, industry: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Hero image</label>
                <ImageUploader value={modal.hero_image} onChange={(url) => setModal({ ...modal, hero_image: url })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Content</label>
                <MarkdownEditor value={modal.content} onChange={(v) => setModal({ ...modal, content: v })} />
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
