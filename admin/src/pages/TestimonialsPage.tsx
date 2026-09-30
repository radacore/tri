import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Star, Trash2 } from "lucide-react";
import {
  del,
  get,
  post,
  put,
  type Testimonial,
} from "../api/client";
import ImageUploader from "../components/ImageUploader";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

const EMPTY = { name: "", role: "", company: "", avatar_url: "", quote: "", rating: 5, featured: false, published: true };

function Stars({ value, onPick }: { value: number; onPick?: (n: number) => void }) {
  return (
    <div className="flex gap-1 text-lg">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onPick?.(n)} className={n <= value ? "text-amber-500" : "text-[#cbdcda]"}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function TestimonialsPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async (): Promise<Testimonial[]> => {
      try {
        const r = await get<Testimonial[] | { items: Testimonial[] }>("/testimonials");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const items = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/testimonials/${f.id}`, f) : post("/admin/testimonials", f),
    onSuccess: () => {
      toast("Testimonial saved");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/testimonials/${id}`),
    onSuccess: () => {
      toast("Testimonial deleted");
      void qc.invalidateQueries({ queryKey: ["testimonials"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModal({ ...EMPTY })}>
          <Plus className="h-4 w-4" /> Add Testimonial
        </button>
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-44 animate-pulse rounded-[24px] bg-white" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[24px] bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-base font-semibold text-ink-primary">No testimonials yet</p>
          <p className="mt-1 text-sm text-ink-secondary">Add the first customer review.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {items.map((t, i) => (
            <div key={t.id} className="anim-rise rounded-[24px] bg-white p-5 shadow-sm" style={{ "--i": Math.min(i, 8) } as React.CSSProperties}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {t.avatar_url ? (
                    <img src={t.avatar_url} alt={t.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <span className="grid h-9 w-9 place-items-center rounded-full bg-brand-subtle text-xs font-bold text-brand">
                      {t.name.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p className="text-sm font-semibold text-ink-primary">{t.name}</p>
                    <p className="text-xs text-ink-secondary">{[t.role, t.company].filter(Boolean).join(" · ")}</p>
                  </div>
                </div>
                <Stars value={t.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-secondary">“{t.quote}”</p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                {t.featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#fef3c7] px-2.5 py-1 font-semibold text-[#92400e]">
                    <Star className="h-3 w-3" /> Featured
                  </span>
                )}
                {!t.published && (
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 font-semibold text-ink-secondary">Draft</span>
                )}
                <span className="flex-1" />
                <button aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary" onClick={() => setModal({ ...EMPTY, ...t, role: t.role ?? "", company: t.company ?? "", avatar_url: t.avatar_url ?? "" })}><Pencil className="h-3.5 w-3.5" /></button>
                <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete testimonial?", t.name, () => delMut.mutate(t.id))}><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f3738]/25 p-4 backdrop-blur-[4px]">
          <div className="anim-pop max-h-[90vh] w-full max-w-[600px] overflow-y-auto rounded-[24px] bg-white p-7 shadow-xl">
            <h2 className="text-base font-semibold text-ink-primary">{modal.id ? "Edit" : "Add"} Testimonial</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="label">Name</label>
                <input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Role</label>
                <input className="input" value={modal.role} onChange={(e) => setModal({ ...modal, role: e.target.value })} />
              </div>
              <div>
                <label className="label">Company</label>
                <input className="input" value={modal.company} onChange={(e) => setModal({ ...modal, company: e.target.value })} />
              </div>
              <div>
                <label className="label">Rating</label>
                <div className="pt-1"><Stars value={modal.rating} onPick={(n) => setModal({ ...modal, rating: n })} /></div>
              </div>
              <div className="sm:col-span-2">
                <label className="label">Photo</label>
                <ImageUploader value={modal.avatar_url} onChange={(url) => setModal({ ...modal, avatar_url: url })} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Quote</label>
                <textarea className="input" rows={3} value={modal.quote} onChange={(e) => setModal({ ...modal, quote: e.target.value })} />
              </div>
              <label className="flex items-center gap-2 text-sm text-ink-primary">
                <input type="checkbox" className="h-[18px] w-[18px] accent-[#0f3738]" checked={modal.featured} onChange={(e) => setModal({ ...modal, featured: e.target.checked })} /> Featured on homepage
              </label>
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
