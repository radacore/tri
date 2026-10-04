import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, put } from "../api/client";
import ImageUploader from "../components/ImageUploader";
import SitePreview from "../components/SitePreview";
import { toast } from "../components/Layout";

type Tab = "hero" | "sections" | "steps" | "pricing" | "pages" | "contact" | "media" | "footer";

const TABS: { id: Tab; label: string }[] = [
  { id: "hero", label: "Hero" },
  { id: "sections", label: "Sections" },
  { id: "steps", label: "Steps" },
  { id: "pricing", label: "Pricing & FAQ" },
  { id: "pages", label: "Pages" },
  { id: "contact", label: "Nav & Contact" },
  { id: "media", label: "Media" },
  { id: "footer", label: "Footer & Socials" },
];

const PAGE_GROUPS: { title: string; prefix: string; fields: [string, string][] }[] = [
  {
    title: "Order page", prefix: "",
    fields: [
      ["order_kicker", "Kicker"], ["order_title", "Title"], ["order_sub", "Subtitle"],
      ["order_s1", "Step 1"], ["order_s2", "Step 2"], ["order_s3", "Step 3"],
      ["order_f_name", "Name label"], ["order_ph_name", "Name placeholder"],
      ["order_f_biz", "Company label"], ["order_ph_biz", "Company placeholder"],
      ["order_f_ind", "Industry label"], ["order_ph_ind", "Industry placeholder"],
      ["order_f_target", "Target label"], ["order_ph_target", "Target placeholder"],
      ["order_f_contact", "Contact label"], ["order_ph_contact", "Contact placeholder"],
      ["order_f_vibe", "Vibe label"], ["order_vibe_hint", "Vibe hint"],
      ["order_f_color", "Colors label"], ["order_f_custom", "Custom label"],
      ["order_f_notes", "Notes label"], ["order_ph_notes", "Notes placeholder"],
      ["order_review", "Review button"], ["order_review_title", "Review title"],
      ["order_back", "Back button"], ["order_continue", "Continue button"],
      ["order_send_title", "Send title"], ["order_send_sub", "Send subtitle"],
      ["order_wa", "WhatsApp button"], ["order_mail", "Email button"],
      ["order_alert", "Missing fields alert"], ["order_alert_vibe", "Missing vibe alert"],
      ["order_r_plan", "Summary: plan"], ["order_r_name", "Summary: name"],
      ["order_r_biz", "Summary: company"], ["order_r_ind", "Summary: industry"],
      ["order_r_target", "Summary: target"], ["order_r_vibe", "Summary: vibe"],
      ["order_r_color", "Summary: colors"], ["order_r_contact", "Summary: contact"],
      ["order_r_notes", "Summary: references"],
      ["wa_greet", "WA greeting"], ["wa_name", "WA: name"], ["wa_biz", "WA: company"],
      ["wa_plan", "WA: plan"], ["wa_ind", "WA: industry"], ["wa_target", "WA: target"],
      ["wa_vibe", "WA: vibe"], ["wa_color", "WA: colors"], ["wa_contact", "WA: contact"],
      ["wa_notes", "WA: references"], ["mail_subj", "Email subject"],
      ["order_cp_title", "Picker title"], ["order_cp_use", "Picker use"],
      ["order_cp_cancel", "Picker cancel"], ["order_cp_remove", "Picker remove"],
    ],
  },
  {
    title: "Contact page", prefix: "",
    fields: [
      ["contact_kicker", "Kicker"], ["contact_title", "Title"], ["contact_sub", "Subtitle"],
      ["contact_else", "Elsewhere label"], ["contact_fname", "Name label"],
      ["contact_femail", "Email label"], ["contact_fmsg", "Message label"],
      ["contact_ph_msg", "Message placeholder"], ["contact_send", "Send button"],
    ],
  },
  {
    title: "About page", prefix: "",
    fields: [["about_kicker", "Kicker"], ["about_title", "Title"], ["about_p1", "Paragraph 1"], ["about_p2", "Paragraph 2"]],
  },
  {
    title: "Index & legal pages", prefix: "",
    fields: [
      ["blog_title", "Blog title"], ["cases_title", "Case studies title"],
      ["terms_title", "Terms title"], ["privacy_title", "Privacy title"],
      ["n404_title", "404 title"], ["n404_text", "404 text"],
      ["n404_home", "404 home button"], ["n404_pricing", "404 pricing button"],
    ],
  },
  {
    title: "Legal clauses", prefix: "",
    fields: [
      ["terms_h1", "Terms 1 head"], ["terms_b1", "Terms 1 body"],
      ["terms_h2", "Terms 2 head"], ["terms_b2", "Terms 2 body"],
      ["terms_h3", "Terms 3 head"], ["terms_b3", "Terms 3 body"],
      ["terms_h4", "Terms 4 head"], ["terms_b4", "Terms 4 body"],
      ["terms_h5", "Terms 5 head"], ["terms_b5", "Terms 5 body"],
      ["priv_h1", "Privacy 1 head"], ["priv_b1", "Privacy 1 body"],
      ["priv_h2", "Privacy 2 head"], ["priv_b2", "Privacy 2 body"],
      ["priv_h3", "Privacy 3 head"], ["priv_b3", "Privacy 3 body"],
      ["priv_h4", "Privacy 4 head"], ["priv_b4", "Privacy 4 body"],
    ],
  },
];

const HERO_FIELDS: [string, string][] = [
  ["t1", "Title part 1"],
  ["t2", "Title accent 1 (italic)"],
  ["t3", "Title part 2"],
  ["t4", "Title accent 2 (italic)"],
  ["sub", "Subtitle"],
  ["cta1", "Primary button"],
  ["cta2", "Secondary button"],
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
    <div className="mt-5 flex justify-end">
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
          <div className="mt-5 flex justify-end">
            <button
              className="btn-primary shadow-lg"
              disabled={saveMut.isPending}
              onClick={() => saveMut.mutate({ key: "how_steps", body: steps ?? [] })}
            >
              {saveMut.isPending ? "Saving…" : "Save steps"}
            </button>
          </div>
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
                    spellCheck={false}
                    value={(t.features ?? []).join("\n")}
                    onChange={(e) => setTiers((tiers ?? []).map((x, j) => (j === i ? { ...x, features: e.target.value.split("\n") } : x)))}
                  />
                </div>
              </div>
            </div>
          ))}
          <div className="mt-5 flex justify-end">
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
          <div className="mt-5 flex justify-end">
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

      {tab === "pages" && (
        <div className="max-w-2xl space-y-4">
          {PAGE_GROUPS.map((g) => (
            <div key={g.title} className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-ink-primary">{g.title}</h2>
              {g.fields.map(([f, label]) => (
                <TextRow
                  key={f}
                  label={label}
                  value={cur.pages?.[f] ?? ""}
                  onChange={(v) => set("pages", f, v)}
                  textarea={/_(sub|text|msg|notes|p1|p2)$/.test(f) || f.length > 200}
                />
              ))}
            </div>
          ))}
          <SaveBar k="pages" />
        </div>
      )}

      {tab === "contact" && (
        <div className="max-w-2xl space-y-4">
          <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-primary">Navbar</h2>
            <TextRow
              label="CTA button"
              value={cur.nav?.cta ?? ""}
              onChange={(v) => set("nav", "cta", v)}
            />
          </div>
          <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-primary">Contact channels</h2>
            {[
              ["email", "Public email"],
              ["email_href", "Email link (mailto:…)"],
              ["hours", "Office hours"],
              ["wa_number", "WhatsApp number (order target)"],
              ["order_email", "Order email target"],
            ].map(([f, label]) => (
              <TextRow
                key={f}
                label={label}
                value={cur.contact?.[f] ?? ""}
                onChange={(v) => set("contact", f, v)}
              />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="sticky bottom-4 mt-5 flex justify-end">
              <button
                className="btn-primary shadow-lg"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate({ key: "nav", body: cur.nav ?? {} })}
              >
                {saveMut.isPending ? "Saving…" : "Save nav"}
              </button>
            </div>
            <div className="sticky bottom-4 mt-5 flex justify-end">
              <button
                className="btn-primary shadow-lg"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate({ key: "contact", body: cur.contact ?? {} })}
              >
                {saveMut.isPending ? "Saving…" : "Save contact"}
              </button>
            </div>
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
          <div>
            <label className="label">Favicon (browser tab icon)</label>
            <ImageUploader
              value={cur.media?.favicon ?? ""}
              onChange={(url) => set("media", "favicon", url)}
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
