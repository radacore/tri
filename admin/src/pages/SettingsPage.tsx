import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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

export default function SettingsPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pricing" | "content" | "security">("pricing");
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
      toast("Settings tersimpan");
      setLocal(null);
      void qc.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (e: any) => toast(`Gagal simpan: ${e?.message ?? "API offline?"}`),
  });

  const passMut = useMutation({
    mutationFn: (password: string) => post("/admin/change-password", { password }),
    onSuccess: () => {
      toast("Password diganti");
      setNewPass("");
    },
    onError: (e: any) => toast(`Gagal ganti password: ${e?.message ?? "error"}`),
  });

  const setPricing = (k: keyof Pricing, v: number) =>
    setLocal({ ...cur, pricing: { ...(cur.pricing as Pricing), [k]: v } });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Settings</h1>
      <div className="flex gap-1 text-sm">
        {(["pricing", "content", "security"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-3 py-1.5 font-semibold ${tab === t ? "bg-[#0158FE] text-white" : "border text-slate-600"}`}
          >
            {t === "pricing" ? "Pricing" : t === "content" ? "Konten & FAQ" : "Security & Email"}
          </button>
        ))}
      </div>

      {tab === "pricing" && (
        <div className="card max-w-xl space-y-3 p-5">
          <h2 className="font-semibold">Harga paket (USD cents)</h2>
          {(["starter_cents", "professional_cents", "premium_cents"] as const).map((k) => (
            <div key={k}>
              <label className="label">{k} → ${(Number(cur.pricing?.[k] ?? 0) / 100).toFixed(2)} USD</label>
              <input
                className="input"
                type="number"
                min={0}
                value={cur.pricing?.[k] ?? 0}
                onChange={(e) => setPricing(k, Number(e.target.value))}
              />
            </div>
          ))}
          <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(cur)}>
            {saveMut.isPending ? "Saving…" : "Simpan Pricing"}
          </button>
        </div>
      )}

      {tab === "content" && (
        <div className="card max-w-2xl space-y-3 p-5">
          <h2 className="font-semibold">Hero text</h2>
          <label className="label">Hero title</label>
          <input className="input" value={cur.hero_title ?? ""} onChange={(e) => setLocal({ ...cur, hero_title: e.target.value })} />
          <label className="label">Hero subtitle</label>
          <textarea className="input" rows={2} value={cur.hero_subtitle ?? ""} onChange={(e) => setLocal({ ...cur, hero_subtitle: e.target.value })} />
          <h2 className="pt-2 font-semibold">FAQ</h2>
          <ul className="space-y-2 text-sm">
            {(cur.faq ?? []).map((f, i) => (
              <li key={i} className="rounded border p-2">
                <p className="font-semibold">{f.q}</p>
                <p className="text-slate-600">{f.a}</p>
                <button
                  className="mt-1 text-xs text-red-600"
                  onClick={() => setLocal({ ...cur, faq: (cur.faq ?? []).filter((_, j) => j !== i) })}
                >
                  Hapus
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input className="input" placeholder="Pertanyaan" value={faqDraft.q} onChange={(e) => setFaqDraft({ ...faqDraft, q: e.target.value })} />
            <input className="input" placeholder="Jawaban" value={faqDraft.a} onChange={(e) => setFaqDraft({ ...faqDraft, a: e.target.value })} />
            <button
              className="rounded border px-3 text-sm"
              onClick={() => {
                if (!faqDraft.q) return;
                setLocal({ ...cur, faq: [...(cur.faq ?? []), { ...faqDraft }] });
                setFaqDraft({ q: "", a: "" });
              }}
            >
              +
            </button>
          </div>
          <button className="btn-primary" disabled={saveMut.isPending} onClick={() => saveMut.mutate(cur)}>
            {saveMut.isPending ? "Saving…" : "Simpan Konten"}
          </button>
        </div>
      )}

      {tab === "security" && (
        <div className="max-w-xl space-y-4">
          <div className="card space-y-3 p-5">
            <h2 className="font-semibold">Ganti password admin</h2>
            <input
              className="input"
              type="password"
              placeholder="Password baru (min 8 karakter)"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button
              className="btn-primary"
              disabled={passMut.isPending || newPass.length < 8}
              onClick={() => passMut.mutate(newPass)}
            >
              {passMut.isPending ? "Saving…" : "Ganti Password"}
            </button>
          </div>
          <div className="card p-5 text-sm text-slate-600">
            <h2 className="font-semibold text-slate-900">Email templates</h2>
            <p className="mt-1">
              Notifikasi email dikirim otomatis saat status order berubah
              (pending → paid → in_progress → revision → completed → delivered).
              Template dikelola di backend (env SMTP_*); admin cukup memastikan
              alamat email pelanggan valid di halaman Orders.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
