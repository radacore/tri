import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { get, post, put } from "../api/client";
import { toast } from "../components/Layout";

interface Pricing {
  starter_cents: number;
  professional_cents: number;
  premium_cents: number;
}
interface SiteSettings {
  pricing?: Pricing;
  hero_title?: string;
  hero_subtitle?: string;
  faq?: { q: string; a: string }[];
}

const DEFAULTS: SiteSettings = {
  pricing: { starter_cents: 4900, professional_cents: 14900, premium_cents: 39900 },
  hero_title: "",
  hero_subtitle: "",
  faq: [],
};

const TABS = [
  { id: "pricing", label: "Pricing" },
  { id: "content", label: "Content & FAQ" },
  { id: "security", label: "Security & Email" },
] as const;

export default function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("pricing");
  const [faqDraft, setFaqDraft] = useState({ q: "", a: "" });
  const [newPass, setNewPass] = useState("");

  const { data } = useQuery({
    queryKey: ["settings"],
    queryFn: async (): Promise<SiteSettings> => {
      try {
        return await get<SiteSettings>("/admin/settings");
      } catch {
        return DEFAULTS;
      }
    },
  });
  const s: SiteSettings = { ...DEFAULTS, ...(data ?? {}), pricing: { ...DEFAULTS.pricing, ...(data?.pricing ?? {}) } };
  const [local, setLocal] = useState<SiteSettings | null>(null);
  const cur = local ?? s;

  const saveMut = useMutation({
    mutationFn: (body: SiteSettings) => put("/admin/settings", body),
    onSuccess: () => {
      toast("Settings saved");
      setLocal(null);
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "API offline?"}`),
  });

  const passMut = useMutation({
    mutationFn: (password: string) => post("/admin/change-password", { password }),
    onSuccess: () => {
      toast("Password changed");
      setNewPass("");
    },
    onError: (e: any) => toast(`Password change failed: ${e?.message ?? "error"}`),
  });

  const setPricing = (k: keyof Pricing, v: number) =>
    setLocal({ ...cur, pricing: { ...(cur.pricing as Pricing), [k]: v } });

  return (
    <div className="space-y-4">
      <div className="flex gap-1 text-sm">
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

      {tab === "pricing" && (
        <div className="max-w-xl space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink-primary">Plan prices (USD cents)</h2>
          {(["starter_cents", "professional_cents", "premium_cents"] as const).map((k) => (
            <div key={k}>
              <label className="label">
                {k.replace("_cents", "")} → <span className="tabular">${(Number(cur.pricing?.[k] ?? 0) / 100).toFixed(2)} USD</span>
              </label>
              <input
                className="input tabular"
                type="number"
                min={0}
                value={cur.pricing?.[k] ?? 0}
                onChange={(e) => setPricing(k, Number(e.target.value))}
              />
            </div>
          ))}
          <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(cur)}>
            {saveMut.isPending ? "Saving…" : "Save Pricing"}
          </button>
        </div>
      )}

      {tab === "content" && (
        <div className="max-w-2xl space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-ink-primary">Hero text</h2>
          <div>
            <label className="label">Hero title</label>
            <input className="input" value={cur.hero_title ?? ""} onChange={(e) => setLocal({ ...cur, hero_title: e.target.value })} />
          </div>
          <div>
            <label className="label">Hero subtitle</label>
            <textarea className="input" rows={2} value={cur.hero_subtitle ?? ""} onChange={(e) => setLocal({ ...cur, hero_subtitle: e.target.value })} />
          </div>
          <h2 className="pt-2 text-base font-semibold text-ink-primary">FAQ</h2>
          <ul className="space-y-2 text-sm">
            {(cur.faq ?? []).map((f, i) => (
              <li key={i} className="rounded-[14px] border border-[#e2eceb] p-3">
                <p className="font-semibold text-ink-primary">{f.q}</p>
                <p className="text-ink-secondary">{f.a}</p>
                <button
                  className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-[#991b1b]"
                  onClick={() => setLocal({ ...cur, faq: (cur.faq ?? []).filter((_, j) => j !== i) })}
                >
                  <Trash2 className="h-3 w-3" /> Remove
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input className="input" placeholder="Question" value={faqDraft.q} onChange={(e) => setFaqDraft({ ...faqDraft, q: e.target.value })} />
            <input className="input" placeholder="Answer" value={faqDraft.a} onChange={(e) => setFaqDraft({ ...faqDraft, a: e.target.value })} />
            <button
              aria-label="Add FAQ"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-hover"
              onClick={() => {
                if (!faqDraft.q) return;
                setLocal({ ...cur, faq: [...(cur.faq ?? []), { ...faqDraft }] });
                setFaqDraft({ q: "", a: "" });
              }}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(cur)}>
            {saveMut.isPending ? "Saving…" : "Save Content"}
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="max-w-xl space-y-4">
          <div className="space-y-4 rounded-[24px] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-ink-primary">Change admin password</h2>
            <input
              className="input"
              type="password"
              placeholder="New password (min 8 characters)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button
              className="btn-primary"
              disabled={passMut.isPending || newPass.length < 8}
              onClick={() => passMut.mutate(newPass)}
            >
              {passMut.isPending ? "Saving…" : "Change Password"}
            </button>
          </div>
          <div className="rounded-[24px] bg-white p-5 text-sm text-ink-secondary shadow-sm">
            <h2 className="font-semibold text-ink-primary">Email templates</h2>
            <p className="mt-1">
              Notification emails are sent automatically when an order status changes
              (pending → paid → in_progress → revision → completed → delivered).
              Templates are managed in the backend (SMTP_* env); here just make sure
              customer email addresses are valid on the Orders page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
