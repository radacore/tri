import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, put } from "../api/client";
import ImageUploader from "../components/ImageUploader";
import SitePreview from "../components/SitePreview";
import { toast } from "../components/Layout";

type Tab = "hero" | "sections" | "steps" | "pricing" | "media" | "footer";

const TABS: { id: Tab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "sections", label: "Sections" },
  { id: "steps", label: "Steps & Highlight" },
  { id: "pricing", label: "Pricing & FAQ" },
  { id: "media", label: "Media" },
  { id: "footer", label: "Footer & Socials" },
];

const HERO_FIELDS: [string, string][] = [
  ["badge", "Badge"],
  ["t1", "Title part 1"],
  ["t2", "Title accent 1 (italic)"],
  ["t3", "Title part 2"],
  ["t4", "Title accent 2 (italic)"],
  ["sub", "Subtitle"],
  ["cta1", "Primary button"],
  ["cta2", "Secondary button"],
  ["s1v", "Stat 1 value"],
  ["s1l", "Stat 1 label"],
  ["s2v", "Stat 2 value"],
  ["s2l", "Stat 2 label"],
  ["s3v", "Stat 3 value"],
  ["s3l", "Stat 3 label"],
];

const SECTION_GROUPS: { title: string; fields: [string, string][] }[] = [
  {
    title: "Client logos",
    fields: [["logos_heading", "Heading"]],
  },
  {
    title: "Case studies",
    fields: [
      ["cases_kicker", "Kicker"],
      ["cases_title", "Title"],
      ["cases_all", "Link label"],
    ],
  },
  {
    title: "Portfolio",
    fields: [
      ["pf_kicker", "Kicker"],
      ["pf_title", "Title"],
    ],
  },
  {
    title: "How it works",
    fields: [
      ["how_kicker", "Kicker"],
      ["how_title", "Title"],
    ],
  },
  {
    title: "Pricing",
    fields: [
      ["price_kicker", "Kicker"],
      ["price_title", "Title"],
      ["price_sub", "Subtitle"],
    ],
  },
  {
    title: "Reviews",
    fields: [
      ["rev_kicker", "Kicker"],
      ["rev_title", "Title"],
      ["rev_sub", "Subtitle"],
    ],
  },
  {
    title: "Guarantee",
    fields: [
      ["guar_title", "Title"],
      ["guar_text", "Text"],
    ],
  },
  {
    title: "FAQ",
    fields: [
      ["faq_kicker", "Kicker"],
      ["faq_title", "Title"],
    ],
  },
  {
    title: "CTA banner",
    fields: [
      ["cta_kicker", "Kicker"],
      ["cta_t1", "Title part 1"],
      ["cta_t2", "Title accent (italic)"],
      ["cta_t3", "Title part 2"],
      ["cta_sub", "Subtitle"],
      ["cta_b1", "Primary button"],
      ["cta_b2", "Secondary button"],
    ],
  },
  {
    title: "Small texts",
    fields: [
      ["badge_by", "Rating badge suffix"],
      ["price_popular", "Popular plan badge"],
      ["price_onetime", "Price suffix"],
    ],
  },
];

const FOOTER_FIELDS: [string, string, string][] = [
  ["tagline", "Tagline", "text"],
  ["x_url", "X URL", "url"],
  ["instagram_url", "Instagram URL", "url"],
  ["dribbble_url", "Dribbble URL", "url"],
  ["linkedin_url", "LinkedIn URL", "url"],
  ["rating", "Rating note", "text"],
  ["copyright", "Copyright", "text"],
];

function TextRow({
  label,
  value,
  onChange,
  textarea,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  textarea?: boolean;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {textarea ? (
        <textarea
          className="input"
          rows={2}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="input"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

export default function IdentityPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("hero");
  const [local, setLocal] = useState<Record<string, Record<string, string>> | null>(null);

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<Record<string, Record<string, string>>> => {
      try {
        return await get<Record<string, Record<string, string>>>("/admin/settings");
      } catch {
        return {};
      }
    },
  });
  const server = data ?? {};
  const cur = local ?? server;
  const set = (key: string, field: string, v: string) =>
    setLocal({ ...cur, [key]: { ...(cur[key] ?? {}), [field]: v } });

  const saveMut = useMutation({
    mutationFn: ({ key, body }: { key: string; body: unknown }) =>
      put(`/admin/settings/${key}`, body),
    onSuccess: (_d, v) => {
      // JANGAN reset state form di sini: invalidate memicu refetch async,
      // dan reset akan membuat form terisi data lama sebelum data baru tiba
      // (form tampak revert + preview reload dengan nilai lama).
      toast(`${v.key} saved — preview reloaded`);
      setPreviewKey((k) => k + 1);
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const SaveBar = ({ k }: { k: string }) => (
    <div className="sticky bottom-4 mt-5 flex justify-end">
      <button
        className="btn-primary shadow-lg"
        disabled={saveMut.isPending}
        onClick={() => saveMut.mutate({ key: k, body: cur[k] ?? {} })}
      >
        {saveMut.isPending ? "Saving…" : `Save ${k}`}
      </button>
    </div>
  );

  // Pricing tiers + FAQ (structures, not flat strings)
  const [tiers, setTiers] = useState<any[] | null>(null);
  const [faqs, setFaqs] = useState<{ q: string; a: string }[] | null>(null);
  const [steps, setSteps] = useState<{ t: string; d: string }[] | null>(null);
  const [previewKey, setPreviewKey] = useState(0);
  useEffect(() => {
    if (tiers === null && Array.isArray((server as any)?.pricing?.tiers))
      setTiers((server as any).pricing.tiers);
    if (faqs === null && Array.isArray((server as any)?.faqs))
      setFaqs((server as any).faqs);
    if (steps === null && Array.isArray((server as any)?.how_steps))
      setSteps((server as any).how_steps);
  }, [server, tiers, faqs, steps]);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-secondary">
        Everything here appears on the public website — the preview on the
        right reloads automatically after every save.
      </p>
      <div className="flex flex-wrap gap-1 text-sm">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-2 font-semibold transition ${
              tab === t.id
                ? "bg-brand text-white shadow-sm"
                : "text-ink-secondary hover:bg-surface-hover hover:text-ink-primary"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,560px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          {tab === "hero" && (
        <div className="max-w-2xl space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink-primary">Hero section</h2>
          {HERO_FIELDS.map(([f, label]) => (
            <TextRow
              key={f}
              label={label}
              value={cur.hero?.[f] ?? ""}
              onChange={(v) => set("hero", f, v)}
              textarea={f === "sub"}
            />
          ))}
          <SaveBar k="hero" />
        </div>
      )}

      {tab === "sections" && (
        <div className="max-w-2xl space-y-4">
          {SECTION_GROUPS.map((g) => (
            <div key={g.title} className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink-primary">{g.title}</h2>
              {g.fields.map(([f, label]) => (
                <TextRow
                  key={f}
                  label={label}
                  value={cur.sections?.[f] ?? ""}
                  onChange={(v) => set("sections", f, v)}
                  textarea={/_text$|_sub$/.test(f)}
                />
              ))}
            </div>
          ))}
          <SaveBar k="sections" />
        </div>
      )}

      {tab === "steps" && (
        <div className="max-w-2xl space-y-4">
          <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-primary">How-it-works steps</h2>
            {(steps ?? []).map((s, i) => (
              <div key={i} className="space-y-2 rounded-[14px] border border-[#e2eceb] p-3">
                <p className="text-xs font-bold text-ink-secondary">STEP {String(i + 1).padStart(2, "0")}</p>
                <input
                  className="input"
                  value={s.t}
                  placeholder="Step title"
                  onChange={(e) => setSteps((steps ?? []).map((x, j) => (j === i ? { ...x, t: e.target.value } : x)))}
                />
                <textarea
                  className="input"
                  rows={2}
                  value={s.d}
                  placeholder="Step description"
                  onChange={(e) => setSteps((steps ?? []).map((x, j) => (j === i ? { ...x, d: e.target.value } : x)))}
                />
              </div>
            ))}
          </div>
          <div className="sticky bottom-4 mt-5 flex justify-end">
            <button
              className="btn-primary shadow-lg"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({ key: "how_steps", body: steps ?? [] })}
            >
              {saveMut.isPending ? "Saving…" : "Save steps"}
            </button>
          </div>
          <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-primary">Featured testimonial</h2>
            <p className="text-xs text-ink-secondary">
              The big quote under the client logos.
            </p>
            <div>
              <label className="label">Quote</label>
              <textarea
                className="input"
                rows={3}
                value={cur.highlight?.quote ?? ""}
                onChange={(e) => set("highlight", "quote", e.target.value)}
              />
            </div>
            <div>
              <label className="label">Attribution</label>
              <input
                className="input"
                value={cur.highlight?.role ?? ""}
                onChange={(e) => set("highlight", "role", e.target.value)}
              />
            </div>
          </div>
          <SaveBar k="highlight" />
        </div>
      )}

      {tab === "pricing" && (
        <div className="max-w-2xl space-y-4">
          {(tiers ?? []).map((t, i) => (
            <div key={t.id ?? i} className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold capitalize text-ink-primary">
                {t.id} — <span className="tabular">${((t.price_cents ?? 0) / 100).toFixed(0)}</span>
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="label">Display name</label>
                  <input
                    className="input"
                    value={t.name ?? ""}
                    onChange={(e) => setTiers((tiers ?? []).map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                  />
                </div>
                <div>
                  <label className="label">Price (USD cents)</label>
                  <input
                    className="input tabular"
                    type="number"
                    min={0}
                    value={t.price_cents ?? 0}
                    onChange={(e) => setTiers((tiers ?? []).map((x, j) => (j === i ? { ...x, price_cents: Number(e.target.value) } : x)))}
                  />
                </div>
                <div>
                  <label className="label">Tagline</label>
                  <input
                    className="input"
                    value={t.tag ?? ""}
                    onChange={(e) => setTiers((tiers ?? []).map((x, j) => (j === i ? { ...x, tag: e.target.value } : x)))}
                  />
                </div>
                <div>
                  <label className="label">Button label</label>
                  <input
                    className="input"
                    value={t.cta ?? ""}
                    onChange={(e) => setTiers((tiers ?? []).map((x, j) => (j === i ? { ...x, cta: e.target.value } : x)))}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Features (one per line)</label>
                  <textarea
                    className="input"
                    rows={5}
                    value={(t.features ?? []).join("\n")}
                    onChange={(e) => setTiers((tiers ?? []).map((x, j) => (j === i ? { ...x, features: e.target.value.split("\n") } : x)))}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="sticky bottom-4 mt-5 flex justify-end">
            <button
              className="btn-primary shadow-lg"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({ key: "pricing", body: { currency: "USD", tiers: tiers ?? [] } })}
            >
              {saveMut.isPending ? "Saving…" : "Save pricing"}
            </button>
          </div>
          <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-primary">FAQ items</h2>
            {(faqs ?? []).map((f, i) => (
              <div key={i} className="space-y-2 rounded-[14px] border border-[#e2eceb] p-3">
                <input
                  className="input"
                  value={f.q}
                  placeholder="Question"
                  onChange={(e) => setFaqs((faqs ?? []).map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
                />
                <textarea
                  className="input"
                  rows={2}
                  value={f.a}
                  placeholder="Answer"
                  onChange={(e) => setFaqs((faqs ?? []).map((x, j) => (j === i ? { ...x, a: e.target.value } : x)))}
                />
                <button
                  className="text-xs font-medium text-[#991b1b]"
                  onClick={() => setFaqs((faqs ?? []).filter((_, j) => j !== i))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              className="btn-secondary"
              onClick={() => setFaqs([...(faqs ?? []), { q: "", a: "" }])}
            >
              + Add question
            </button>
          </div>
          <div className="sticky bottom-4 mt-5 flex justify-end">
            <button
              className="btn-primary shadow-lg"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({ key: "faqs", body: faqs ?? [] })}
            >
              {saveMut.isPending ? "Saving…" : "Save faqs"}
            </button>
          </div>
        </div>
      )}

      {tab === "media" && (
        <div className="max-w-2xl space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink-primary">Site media</h2>
          <p className="text-xs text-ink-secondary">
            Empty = use the built-in default. Uploaded images are converted to
            WebP automatically.
          </p>
          <div>
            <label className="label">Logo (navbar + footer)</label>
            <ImageUploader
              value={cur.media?.logo_url ?? ""}
              onChange={(url) => set("media", "logo_url", url)}
            />
          </div>
          <div>
            <label className="label">Social share image (og:image)</label>
            <ImageUploader
              value={cur.media?.og_image ?? ""}
              onChange={(url) => set("media", "og_image", url)}
            />
          </div>
          <SaveBar k="media" />
        </div>
      )}

      {tab === "footer" && (
        <div className="max-w-2xl space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink-primary">Footer & socials</h2>
          {FOOTER_FIELDS.map(([f, label, type]) => (
            <div key={f}>
              <label className="label">{label}</label>
              <input
                className={`input ${type === "url" ? "font-mono text-[13px]" : ""}`}
                value={cur.footer?.[f] ?? ""}
                onChange={(e) => set("footer", f, e.target.value)}
                placeholder={type === "url" ? "https://…" : ""}
              />
            </div>
          ))}
          <SaveBar k="footer" />
        </div>
      )}
        </div>
        <div className="min-w-0 xl:sticky xl:top-6">
          <SitePreview tab={tab} reloadKey={previewKey} />
        </div>
      </div>
    </div>
  );
}
