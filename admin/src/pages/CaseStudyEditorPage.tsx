import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { get, post, put, type CaseStudy } from "../api/client";
import GalleryEditor from "../components/GalleryEditor";
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
  service: "",
  deliverables: [] as string[],
  gallery: [] as { url: string; alt: string }[],
  testimonial_quote: "", testimonial_author: "", testimonial_role: "",
};

type Form = typeof EMPTY;

/** Normalisasi respons API ke bentuk form; array tidak boleh di-cast ke string. */
function fromServer(c: CaseStudy | null | undefined): Form {
  return {
    ...EMPTY,
    title: c?.title ?? "",
    slug: c?.slug ?? "",
    industry: c?.industry ?? "",
    hero_image: c?.hero_image ?? "",
    content: c?.content ?? "",
    published: c?.published ?? false,
    client: c?.client ?? "",
    result: c?.result ?? "",
    excerpt: c?.excerpt ?? "",
    logo: c?.logo ?? "",
    mockup: c?.mockup ?? "",
    year: c?.year ?? "",
    website: c?.website ?? "",
    service: c?.service ?? "",
    deliverables: Array.isArray(c?.deliverables) ? c.deliverables : [],
    gallery: Array.isArray(c?.gallery) ? c.gallery : [],
    testimonial_quote: c?.testimonial_quote ?? "",
    testimonial_author: c?.testimonial_author ?? "",
    testimonial_role: c?.testimonial_role ?? "",
  };
}

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
      setForm(fromServer(existing));
      setReady(true);
    }
  }, [isNew, existing]);

  const dirty = useMemo(() => {
    if (isNew) return JSON.stringify(form) !== JSON.stringify(EMPTY);
    if (!existing) return false;
    return JSON.stringify(form) !== JSON.stringify(fromServer(existing));
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

  const set = <K extends keyof Form,>(k: K, v: Form[K]) =>
    setForm((f) => ({ ...f, [k]: v, ...(k === "title" && typeof v === "string" && isNew ? { slug: slugify(v) } : {}) }));

  const setDeliverable = (i: number, v: string) =>
    set("deliverables", form.deliverables.map((d, j) => (j === i ? v : d)));

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
              <label className="label">Service</label>
              <input className="input" value={form.service} onChange={(e) => set("service", e.target.value)} placeholder="Brand identity" />
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
            <ImageUploader
              value={form.hero_image}
              onChange={(url) => set("hero_image", url)}
              recommended="1600 × 900 px (16:9) — shown full width at 1024 px"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Logo image</label>
              <ImageUploader
                value={form.logo}
                onChange={(url) => set("logo", url)}
                recommended="800 × 800 px (1:1, transparent background)"
              />
            </div>
            <div>
              <label className="label">Mockup image</label>
              <ImageUploader
                value={form.mockup}
                onChange={(url) => set("mockup", url)}
                recommended="1000 × 940 px (≈1.06:1) — matches the card frame"
              />
            </div>
          </div>
          <div>
            <label className="label">Content</label>
            <RichEditor value={form.content} onChange={(v) => set("content", v)} />
          </div>

          <div>
            <label className="label">What we delivered</label>
            {form.deliverables.length === 0 ? (
              <p className="rounded-[14px] bg-surface-muted p-4 text-center text-sm text-ink-secondary">
                No deliverables yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {form.deliverables.map((d, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <input
                      className="input flex-1 text-sm"
                      value={d}
                      placeholder="Logo design"
                      onChange={(e) => setDeliverable(i, e.target.value)}
                    />
                    <button
                      type="button"
                      aria-label="Remove deliverable"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]"
                      onClick={() => set("deliverables", form.deliverables.filter((_, j) => j !== i))}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              className="btn-secondary mt-2 inline-flex items-center gap-2"
              onClick={() => set("deliverables", [...form.deliverables, ""])}
            >
              <Plus className="h-4 w-4" /> Add deliverable
            </button>
          </div>

          <div>
            <label className="label">Gallery</label>
            <GalleryEditor
              value={form.gallery}
              onChange={(v) => set("gallery", v)}
              baseUrl={LANDING}
              recommended="1600 px wide, any height (each image keeps its own ratio)"
            />
          </div>

          <div>
            <p className="label">Testimonial</p>
            <div className="space-y-3">
              <textarea
                className="input"
                rows={3}
                value={form.testimonial_quote}
                onChange={(e) => set("testimonial_quote", e.target.value)}
                placeholder="What the client said about the project"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  className="input"
                  value={form.testimonial_author}
                  onChange={(e) => set("testimonial_author", e.target.value)}
                  placeholder="Author name"
                />
                <input
                  className="input"
                  value={form.testimonial_role}
                  onChange={(e) => set("testimonial_role", e.target.value)}
                  placeholder="Founder of Graab"
                />
              </div>
            </div>
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
                {(form.service || "Brand identity") + (form.industry ? ` · ${form.industry}` : "")}
              </p>
              <h2 className="mt-1 font-extrabold">{form.title || "Untitled case study"}</h2>
              <p className="mt-1 text-sm text-slate-500">{form.excerpt || form.content.slice(0, 140) || "…"}</p>
              {form.deliverables.filter(Boolean).length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {form.deliverables.filter(Boolean).map((d, i) => (
                    <li key={i} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700">{d}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
{(mockup || form.logo) && (
            <div className="mt-4 space-y-3">
              {mockup && <img src={mockup} alt="mockup preview" className="w-full rounded-[16px] object-cover" />}
              {form.logo && <img src={form.logo} alt="logo preview" className="mx-auto max-h-28 rounded-[12px] object-contain bg-white p-2 ring-1 ring-slate-900/10" />}
            </div>
          )}
          {form.gallery.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {form.gallery.slice(0, 4).map((g, i) => (
                <img key={`${i}-${g.url}`} src={g.url.startsWith("/") ? LANDING + g.url : g.url} alt={g.alt} className="aspect-square w-full rounded-[10px] object-cover ring-1 ring-slate-900/10" />
              ))}
            </div>
          )}
          {form.testimonial_quote.trim() !== "" && (
            <figure className="mt-4 rounded-[20px] bg-slate-50 p-5 ring-1 ring-slate-200">
              <blockquote className="text-sm font-extrabold leading-snug">“{form.testimonial_quote}”</blockquote>
              <figcaption className="mt-2 text-xs text-slate-500">
                <cite className="font-bold not-italic text-slate-900">{form.testimonial_author || "—"}</cite>
                {form.testimonial_role ? ` · ${form.testimonial_role}` : ""}
              </figcaption>
            </figure>
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
