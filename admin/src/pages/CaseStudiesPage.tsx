import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  del,
  get,
  type CaseStudy,
} from "../api/client";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

export default function CaseStudiesPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const { data, isLoading } = useQuery({
    queryKey: ["case-studies"],
    queryFn: async (): Promise<CaseStudy[]> => {
      try {
        const r = await get<CaseStudy[] | { items: CaseStudy[] }>("/admin/case-studies");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const items = data ?? [];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Case Studies</h1>
      <div className="flex items-center justify-end">
        <Link to="/case-studies/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Case Study
        </Link>
      </div>
          <DataTable<CaseStudy>
            title="All Case Studies"
            loading={isLoading}
            data={items}
            searchKeys={["title", "slug", "industry"]}
            searchPlaceholder="Search case studies…"
            columns={[
              { key: "title", label: "Title", sortable: true, render: (r) => <span className="font-semibold">{r.title}</span> },
              { key: "slug", label: "Slug", render: (r) => <span className="font-mono text-xs text-ink-secondary">{r.slug}</span> },
              { key: "industry", label: "Industry" },
              { key: "published", label: "Status", render: (r) => <Badge status={r.published ? "completed" : "pending"} /> },
              { key: "actions", label: "Actions", render: (r) => (
                <div className="flex gap-1.5">
                  <Link aria-label="Edit" to={`/case-studies/${r.id}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"><Pencil className="h-3.5 w-3.5" /></Link>
                  <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete case study?", r.title, () => delMut.mutate(r.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) },
            ]}
          />
      {dialog}
      
    </div>
  );
}
