import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { del, get, post, put } from "../api/client";
import DataTable from "../components/DataTable";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

export interface Category {
  id: string;
  name: string;
  slug: string;
  sort_order?: number;
  item_count?: number;
}

const EMPTY = { name: "", slug: "", sort_order: 0 };

export default function CategoriesPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const [modal, setModal] = useState<null | (typeof EMPTY & { id?: string })>(null);
  const [moveTo, setMoveTo] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: async (): Promise<Category[]> => {
      try {
        const r = await get<Category[] | { items: Category[] }>("/categories");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const items = data ?? [];

  const saveMut = useMutation({
    mutationFn: (f: typeof EMPTY & { id?: string }) =>
      f.id ? put(`/admin/categories/${f.id}`, f) : post("/admin/categories", f),
    onSuccess: () => {
      toast("Category saved");
      setModal(null);
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: any) => toast(`Save failed: ${e?.message ?? "error"}`),
  });

  const delMut = useMutation({
    mutationFn: ({ id, reassign }: { id: string; reassign?: string }) =>
      del(`/admin/categories/${id}${reassign ? `?reassign=${encodeURIComponent(reassign)}` : ""}`),
    onSuccess: () => {
      toast("Category deleted");
      void qc.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Categories</h1>
      <p className="text-sm text-ink-secondary">
        Used by the portfolio filter on the website. Renaming moves all items
        automatically. Deleting a category with items requires moving them first.
      </p>
      <div className="flex items-center justify-end">
        <button className="btn-primary inline-flex items-center gap-2" onClick={() => setModal({ ...EMPTY, sort_order: items.length })}>
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>
      <section className="rounded-[26px] bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-base font-semibold tracking-tight text-ink-primary">
          All Categories
        </h2>
        {isLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-[14px] bg-surface-muted" />
            ))}
          </div>
        ) : (
          <DataTable<Category>
            data={items}
            searchKeys={["name", "slug"]}
            searchPlaceholder="Search categories…"
            columns={[
              { key: "name", label: "Name", sortable: true, render: (r) => <span className="font-semibold">{r.name}</span> },
              { key: "slug", label: "Slug", render: (r) => <span className="tabular font-mono text-xs text-ink-secondary">/portfolio/{r.slug}</span> },
              { key: "item_count", label: "Items", sortable: true, value: (r) => r.item_count ?? 0, render: (r) => <span className="tabular font-semibold">{r.item_count ?? 0}</span> },
              { key: "actions", label: "Actions", render: (r) => (
                <div className="flex gap-1.5">
                  <button aria-label="Edit" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary" onClick={() => setModal({ name: r.name, slug: r.slug, sort_order: r.sort_order ?? 0, id: r.id })}><Pencil className="h-3.5 w-3.5" /></button>
                  <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete category?", `${r.name} (${r.item_count ?? 0} items). Items must be moved first.`, () => delMut.mutate({ id: r.id, reassign: moveTo || undefined }))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) },
            ]}
          />
        )}
        <div className="mt-4 flex max-w-sm items-center gap-2 text-xs text-ink-secondary">
          <label className="shrink-0 font-semibold" htmlFor="reassign">Move items to:</label>
          <select
            id="reassign"
            className="input input-pill text-xs"
            value={moveTo}
            onChange={(e) => setMoveTo(e.target.value)}
          >
            <option value="">— block if not empty —</option>
            {items.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </section>
      {dialog}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "transparent", backdropFilter: "none", WebkitBackdropFilter: "none" }}>
          <div className="anim-pop w-full max-w-sm rounded-[24px] bg-white p-7 shadow-xl ring-1 ring-black/10">
            <h2 className="text-base font-semibold text-ink-primary">{modal.id ? "Edit" : "Add"} Category</h2>
            <div className="mt-4 space-y-4">
              <div>
                <label className="label">Name</label>
                <input className="input" value={modal.name} onChange={(e) => setModal({ ...modal, name: e.target.value })} placeholder="e.g. Illustration" />
              </div>
              <div>
                <label className="label">Slug (auto if empty)</label>
                <input className="input font-mono" value={modal.slug} onChange={(e) => setModal({ ...modal, slug: e.target.value })} placeholder="illustration" />
              </div>
              <div>
                <label className="label">Sort order</label>
                <input className="input tabular" type="number" value={modal.sort_order} onChange={(e) => setModal({ ...modal, sort_order: Number(e.target.value) })} />
              </div>
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
