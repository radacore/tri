import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { get, post, put, type BlogPost } from "../api/client";
import ImageUploader from "../components/ImageUploader";
import RichEditor from "../components/RichEditor";
import { toast } from "../components/Layout";

const LANDING = (import.meta as any).env?.VITE_LANDING_URL ?? "http://127.0.0.1:4321";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  title: "", slug: "", category: "", thumbnail: "", content: "",
  meta_title: "", meta_description: "", published: false,
};

type Form = typeof EMPTY;

export default function BlogEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [ready, setReady] = useState(isNew);
  const savedRef = useRef(false);

  const { data: existing } = useQuery({
    queryKey: ["blog", id],
    enabled: !isNew,
    queryFn: async (): Promise<BlogPost | null> => {
      const r = await get<BlogPost[] | { items: BlogPost[] }>("/admin/blog");
      const list = Array.isArray(r) ? r : (r.items ?? []);
      return list.find((p) => p.id === id) ?? null;
    },
  });

  useEffect(() => {
    if (!isNew && existing) {
      setForm({
        title: existing.title ?? "", slug: existing.slug ?? "",
        category: existing.category ?? "", thumbnail: (existing as any).thumbnail ?? (existing as any).thumbnail_url ?? "",
        content: existing.content ?? "", meta_title: existing.meta_title ?? "",
        meta_description: existing.meta_description ?? "", published: !!existing.published,
      });
      setReady(true);
    }
  }, [isNew, existing]);

  const dirty = useMemo(() => {
    const base = isNew ? EMPTY : existing ? {
      title: existing.title ?? "", slug: existing.slug ?? "",
      category: existing.category ?? "", thumbnail: (existing as any).thumbnail ?? (existing as any).thumbnail_url ?? "",
      content: existing.content ?? "", meta_title: existing.meta_title ?? "",
      meta_description: existing.meta_description ?? "", published: !!existing.published,
    } : EMPTY;
    return JSON.stringify(form) !== JSON.stringify(base);
  }, [form, existing, isNew]);

  useEffect(() => {
    const onLeave = (e: BeforeUnloadEvent) => {
      if (dirty && !savedRef.current) e.preventDefault();
    };
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const saveMut = useMutation({
    mutationFn: async (f: Form) => {
      const { thumbnail, ...rest } = f;
      const payload = { ...rest, thumbnail_url: thumbnail || null };
      return isNew ? post("/admin/blog", payload) : put(`/admin/blog/${id}`, payload);
    },
    onSuccess: () => {
      savedRef.current = true;
      toast("Article saved");
      void qc.invalidateQueries({ queryKey: ["blog"] });
      nav("/blog");
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const set = (k: keyof Form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === "title" && typeof v === "string" && isNew ? { slug: slugify(v) } : {}) }));

  const html = form.content || "";

  const valid = form.title.trim() !== "" && form.slug.trim() !== "";
  const excerpt = form.meta_description || form.content.slice(0, 140);

  if (!ready) return <p className="text-sm text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/blog" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"
            onClick={(e) => { if (dirty && !savedRef.current && !window.confirm("Discard unsaved changes?")) e.preventDefault(); }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">{isNew ? "New Article" : "Edit Article"}</h1>
        </div>
        <div className="flex gap-2">
          {form.slug.trim() !== "" && (
            <a href={`${LANDING}/blog/${form.slug.trim()}`} target="_blank" rel="noreferrer" className="btn-secondary" title="Open the live landing page (accurate after publish + build)">View live page ↗</a>
          )}
          <Link to="/blog" className="btn-secondary">Cancel</Link>
          <button className="btn-primary" disabled={!valid || saveMut.isPending}
            onClick={() => { if (!valid) { toast("Title and slug are required"); return; } saveMut.mutate(form); }}>
            {saveMut.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <div className="space-y-4 rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-[#e2eceb]/60">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="How much does a logo cost?" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Slug</label>
              <input className="input font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="Guides" />
            </div>
          </div>
          <div>
            <label className="label">Thumbnail</label>
            <ImageUploader value={form.thumbnail} onChange={(url) => set("thumbnail", url)} />
          </div>
          <div>
            <label className="label">Content</label>
            <RichEditor value={form.content} onChange={(v) => set("content", v)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Meta title</label>
              <input className="input" value={form.meta_title} onChange={(e) => set("meta_title", e.target.value)} />
            </div>
            <div>
              <label className="label">Meta description</label>
              <textarea className="input" rows={2} value={form.meta_description} onChange={(e) => set("meta_description", e.target.value)} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-primary">
            <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f3738]" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> Published
          </label>
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-ink-secondary">Live preview</p>
          <div className="overflow-hidden bg-white ring-1 ring-slate-900/10" style={{ borderRadius: 20 }}>
            {form.thumbnail ? (
              <img src={form.thumbnail} alt={form.title || "preview"} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] w-full place-items-center bg-surface-muted text-sm text-ink-muted">No thumbnail</div>
            )}
            <div className="p-5">
              <p className="text-xs text-slate-400 font-semibold">{form.category || "Uncategorized"}</p>
              <h2 className="mt-1 font-extrabold leading-snug">{form.title || "Untitled article"}</h2>
              <p className="mt-1 text-sm text-slate-500">{excerpt || "…"}</p>
            </div>
          </div>
          <div className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-slate-900/10">
            <div className="text-sm leading-relaxed text-slate-700 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_a]:underline [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: html || '<p class="text-ink-muted">Nothing to preview yet.</p>' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
