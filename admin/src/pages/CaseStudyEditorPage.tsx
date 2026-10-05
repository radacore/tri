import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { get, post, put, type CaseStudy } from "../api/client";
import ImageUploader from "../components/ImageUploader";
import RichEditor from "../components/RichEditor";
import { toast } from "../components/Layout";

const LANDING = (import.meta as any).env?.VITE_LANDING_URL ?? "http://127.0.0.1:4321";

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const EMPTY = {
  title: "", slug: "", industry: "", hero_image: "", content: "", published: false,
  client: "", result: "", excerpt: "", logo: "", mockup: "", year: "", website: "",
};

type Form = typeof EMPTY;

export default function CaseStudyEditorPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState<Form>(EMPTY);
  const [ready, setReady] = useState(isNew);
  const savedRef = useRef(false);

  const { data: existing } = useQuery({
    queryKey: ["case-studies", id],
    enabled: !isNew,
    queryFn: async (): Promise<CaseStudy | null> => {
      const r = await get<CaseStudy[] | { items: CaseStudy[] }>("/admin/case-studies");
      const list = Array.isArray(r) ? r : (r.items ?? []);
      return list.find((c) => c.id === id) ?? null;
    },
  });

  useEffect(() => {
    if (!isNew && existing) {
      const e = existing as Partial<Record<keyof Form, string | boolean>>;
      setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, (e[k as keyof Form] as string) ?? (k === "published" ? false : "")])) } as Form);
      setReady(true);
    }
  }, [isNew, existing]);

  const dirty = useMemo(() => {
    if (isNew) return JSON.stringify(form) !== JSON.stringify(EMPTY);
    if (!existing) return false;
    const e = existing as Partial<Record<keyof Form, string | boolean>>;
    const base = { ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, (e[k as keyof Form] as string) ?? (k === "published" ? false : "")])) };
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
    mutationFn: (f: Form) => (isNew ? post("/admin/case-studies", f) : put(`/admin/case-studies/${id}`, f)),
    onSuccess: () => {
      savedRef.current = true;
      toast("Case study saved");
      void qc.invalidateQueries({ queryKey: ["case-studies"] });
      nav("/case-studies");
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const set = (k: keyof Form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === "title" && typeof v === "string" && isNew ? { slug: slugify(v) } : {}) }));

  const html = form.content || "";

  const valid = form.title.trim() !== "" && form.slug.trim() !== "";
  const mockup = form.mockup || form.hero_image;

  if (!ready) return <p className="text-sm text-ink-secondary">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/case-studies" aria-label="Back" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"
            onClick={(e) => { if (dirty && !savedRef.current && !window.confirm("Discard unsaved changes?")) e.preventDefault(); }}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">{isNew ? "Add Case Study" : "Edit Case Study"}</h1>
        </div>
        <div className="flex gap-2">
          {form.slug.trim() !== "" && (
            <a href={`${LANDING}/case-studies/${form.slug.trim()}`} target="_blank" rel="noreferrer" className="btn-secondary" title="Open the live landing page (accurate after publish + build)">View live page ↗</a>
          )}
          <Link to="/case-studies" className="btn-secondary">Cancel</Link>
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
            <input className="input" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Nexora doubles signup conversion" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Slug</label>
              <input className="input font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
            </div>
            <div>
              <label className="label">Industry</label>
              <input className="input" value={form.industry} onChange={(e) => set("industry", e.target.value)} />
            </div>
            <div>
              <label className="label">Client</label>
              <input className="input" value={form.client} onChange={(e) => set("client", e.target.value)} />
            </div>
            <div>
              <label className="label">Result (e.g. +112% conversion)</label>
              <input className="input" value={form.result} onChange={(e) => set("result", e.target.value)} />
            </div>
            <div>
              <label className="label">Year</label>
              <input className="input" value={form.year} onChange={(e) => set("year", e.target.value)} />
            </div>
            <div>
              <label className="label">Website URL</label>
              <input className="input" value={form.website} onChange={(e) => set("website", e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Excerpt</label>
            <textarea className="input" rows={2} value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} />
          </div>
          <div>
            <label className="label">Hero image</label>
            <ImageUploader value={form.hero_image} onChange={(url) => set("hero_image", url)} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Logo image</label>
              <ImageUploader value={form.logo} onChange={(url) => set("logo", url)} />
            </div>
            <div>
              <label className="label">Mockup image</label>
              <ImageUploader value={form.mockup} onChange={(url) => set("mockup", url)} />
            </div>
          </div>
          <div>
            <label className="label">Content</label>
            <RichEditor value={form.content} onChange={(v) => set("content", v)} />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-primary">
            <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f3738]" checked={form.published} onChange={(e) => set("published", e.target.checked)} /> Published
          </label>
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-ink-secondary">Live preview</p>
          <div className="overflow-hidden bg-white ring-1 ring-slate-900/10" style={{ borderRadius: 20 }}>
            {mockup ? (
              <img src={mockup} alt={form.client || form.title || "preview"} className="aspect-[16/9] w-full object-cover" />
            ) : (
              <div className="grid aspect-[16/9] w-full place-items-center bg-surface-muted text-sm text-ink-muted">No mockup</div>
            )}
            <div className="p-5">
              <p className="text-xs font-bold uppercase tracking-wider text-primary">
                {(form.industry || "Brand identity") + (form.result ? ` · ${form.result}` : "")}
              </p>
              <h2 className="mt-1 font-extrabold">{form.title || "Untitled case study"}</h2>
              <p className="mt-1 text-sm text-slate-500">{form.excerpt || form.content.slice(0, 140) || "…"}</p>
            </div>
          </div>
{(mockup || form.logo) && (
            <div className="mt-4 space-y-3">
              {mockup && <img src={mockup} alt="mockup preview" className="w-full rounded-[16px] object-cover" />}
              {form.logo && <img src={form.logo} alt="logo preview" className="mx-auto max-h-28 rounded-[12px] object-contain bg-white p-2 ring-1 ring-slate-900/10" />}
            </div>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-[20px] bg-slate-50 p-5 ring-1 ring-slate-200">
            {[["Client", form.client], ["Industry", form.industry], ["Year", form.year], ["Result", form.result]].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400">{k}</dt>
                <dd className="mt-1 text-sm font-extrabold">{v || "—"}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 rounded-[20px] bg-white p-5 ring-1 ring-slate-900/10">
            <div className="text-sm leading-relaxed text-slate-700 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand [&_a]:underline [&_p]:my-2"
              dangerouslySetInnerHTML={{ __html: html || '<p class="text-ink-muted">Nothing to preview yet.</p>' }} />
          </div>
        </div>
      </div>
    </div>
  );
}
