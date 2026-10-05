import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { get, put } from "../api/client";
import { toast } from "../components/Layout";

const EMPTY: Record<string, string> = {
  default_title: "",
  default_description: "",
  keywords: "",
  google_verification: "",
  bing_verification: "",
  ga_id: "",
  og_image: "",
  twitter_handle: "",
};

const LANDING = (import.meta as any).env?.VITE_LANDING_URL ?? "http://127.0.0.1:4321";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink-secondary">{hint}</p>}
    </div>
  );
}

export default function SeoPage() {
  const qc = useQueryClient();
  const [local, setLocal] = useState<Record<string, string> | null>(null);

  const { data } = useQuery({
    queryKey: ["settings", "seo"],
    queryFn: async (): Promise<Record<string, string>> => {
      try {
        const r = await get<Record<string, Record<string, string>>>("/admin/settings");
        return (r as any)?.seo ?? {};
      } catch {
        return {};
      }
    },
  });
  const server = data ?? {};
  const cur = { ...EMPTY, ...server, ...(local ?? {}) };
  const set = (k: string, v: string) => setLocal({ ...cur, [k]: v });
  const dirty = JSON.stringify({ ...EMPTY, ...server }) !== JSON.stringify({ ...EMPTY, ...(local ?? server) });

  const saveMut = useMutation({
    mutationFn: () => put("/admin/settings/seo", { ...cur }),
    onSuccess: () => {
      toast("SEO settings saved — rebuild landing to apply");
      setLocal(null);
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-primary">SEO & Indexing</h1>
          <p className="mt-1 text-sm text-ink-secondary">Meta defaults, verification codes, and index status. Changes apply after landing rebuild.</p>
        </div>
        <button className="btn-primary" disabled={!dirty || saveMut.isPending} onClick={() => saveMut.mutate()}>
          {saveMut.isPending ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <section className="space-y-4 rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-[#e2eceb]/60">
          <h2 className="text-base font-semibold text-ink-primary">Meta defaults</h2>
          <Field label="Default title" hint="Used when a page has no custom title.">
            <input className="input" value={cur.default_title} onChange={(e) => set("default_title", e.target.value)} placeholder="BrandingPulse — Logo & Brand Identity in 48 Hours" />
          </Field>
          <Field label="Default description" hint="Max ~155 characters for Google snippet.">
            <textarea className="input" rows={3} value={cur.default_description} onChange={(e) => set("default_description", e.target.value)} placeholder="Custom logo & brand identity…" />
            <p className="tabular mt-1 text-xs text-ink-secondary">{cur.default_description.length}/155</p>
          </Field>
          <Field label="Keywords" hint="Comma separated. Minor ranking factor, used for internal consistency.">
            <input className="input" value={cur.keywords} onChange={(e) => set("keywords", e.target.value)} placeholder="logo design, brand identity, logo maker" />
          </Field>
        </section>

        <section className="space-y-4 rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-[#e2eceb]/60">
          <h2 className="text-base font-semibold text-ink-primary">Verification & analytics</h2>
          <Field label="Google Search Console verification" hint="The content value of the google-site-verification meta tag.">
            <input className="input font-mono" value={cur.google_verification} onChange={(e) => set("google_verification", e.target.value.trim())} placeholder="dBw…" />
          </Field>
          <Field label="Bing verification" hint="Content value of msvalidate.01 meta tag.">
            <input className="input font-mono" value={cur.bing_verification} onChange={(e) => set("bing_verification", e.target.value.trim())} />
          </Field>
          <Field label="Google Analytics ID" hint="Measurement ID, e.g. G-XXXXXXX. Loaded on every page.">
            <input className="input font-mono" value={cur.ga_id} onChange={(e) => set("ga_id", e.target.value.trim())} placeholder="G-XXXXXXXXXX" />
          </Field>
        </section>

        <section className="space-y-4 rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-[#e2eceb]/60">
          <h2 className="text-base font-semibold text-ink-primary">Social sharing (OG)</h2>
          <Field label="Default share image" hint="Used when a post has no thumbnail. Absolute URL or /path.">
            <input className="input" value={cur.og_image} onChange={(e) => set("og_image", e.target.value)} placeholder="/og-cover.jpg" />
          </Field>
          <Field label="X / Twitter handle" hint="Without @. Used for twitter:site.">
            <input className="input" value={cur.twitter_handle} onChange={(e) => set("twitter_handle", e.target.value.replace(/^@/, ""))} placeholder="brandingpulse" />
          </Field>
        </section>

        <section className="space-y-3 rounded-[24px] bg-white p-6 shadow-sm ring-1 ring-[#e2eceb]/60">
          <h2 className="text-base font-semibold text-ink-primary">Index status</h2>
          <ul className="space-y-2 text-sm text-ink-secondary">
            <li>
              <a className="inline-flex items-center gap-1 font-semibold text-brand hover:underline" href={`${LANDING}/sitemap.xml`} target="_blank" rel="noreferrer">
                sitemap.xml <ExternalLink className="h-3.5 w-3.5" />
              </a>{" "}— auto-generated at build (static routes + published posts & cases).
            </li>
            <li>
              <a className="inline-flex items-center gap-1 font-semibold text-brand hover:underline" href={`${LANDING}/robots.txt`} target="_blank" rel="noreferrer">
                robots.txt <ExternalLink className="h-3.5 w-3.5" />
              </a>{" "}— allows all crawlers, points to sitemap.
            </li>
          </ul>
          <div className="rounded-[16px] bg-surface-muted p-4 text-xs leading-relaxed text-ink-secondary">
            <p className="font-bold text-ink-primary">To appear on Google:</p>
            <ol className="mt-1 list-decimal pl-5 space-y-1">
              <li>Paste the verification code above, save, and rebuild the landing.</li>
              <li>Open Google Search Console → add property → verify.</li>
              <li>Submit <span className="font-mono">sitemap.xml</span> under Sitemaps.</li>
              <li>Use “URL inspection” on the homepage + one article to request indexing.</li>
            </ol>
          </div>
          <Link to="/identity" className="text-xs font-semibold text-brand hover:underline">Page titles & favicon live in Website Identity →</Link>
        </section>
      </div>
    </div>
  );
}
