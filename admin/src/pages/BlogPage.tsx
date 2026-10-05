import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import {
  del,
  get,
  type BlogPost,
} from "../api/client";
import DataTable from "../components/DataTable";
import Badge from "../components/Badge";
import { useConfirm } from "../components/ConfirmDialog";
import { toast } from "../components/Layout";

export default function BlogPage() {
  const qc = useQueryClient();
  const { dialog, ask } = useConfirm();
  const { data, isLoading } = useQuery({
    queryKey: ["blog"],
    queryFn: async (): Promise<BlogPost[]> => {
      try {
        const r = await get<BlogPost[] | { items: BlogPost[] }>("/admin/blog");
        return Array.isArray(r) ? r : (r.items ?? []);
      } catch {
        return [];
      }
    },
  });
  const items = data ?? [];

  const delMut = useMutation({
    mutationFn: (id: string) => del(`/admin/blog/${id}`),
    onSuccess: () => {
      toast("Article deleted");
      void qc.invalidateQueries({ queryKey: ["blog"] });
    },
    onError: (e: any) => toast(`Delete failed: ${e?.message ?? "error"}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight text-ink-primary">Blog</h1>
      <div className="flex items-center justify-end">
        <Link to="/blog/new" className="btn-primary inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New Article
        </Link>
      </div>
          <DataTable<BlogPost>
            title="All Articles"
            loading={isLoading}
            data={items}
            searchKeys={["title", "slug", "category"]}
            searchPlaceholder="Search articles…"
            columns={[
              { key: "title", label: "Title", sortable: true, render: (r) => <span className="font-semibold">{r.title}</span> },
              { key: "category", label: "Category" },
              { key: "published", label: "Status", render: (r) => <Badge status={r.published ? "completed" : "pending"} /> },
              { key: "published_at", label: "Publish At", render: (r) => <span className="tabular text-xs text-ink-secondary">{(r.published_at ?? "").slice(0, 16).replace("T", " ") || "—"}</span> },
              { key: "actions", label: "Actions", render: (r) => (
                <div className="flex gap-1.5">
                  <Link aria-label="Edit" to={`/blog/${r.id}`} className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary"><Pencil className="h-3.5 w-3.5" /></Link>
                  <button aria-label="Delete" className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] text-[#991b1b] transition hover:bg-[#fee2e2]" onClick={() => ask("Delete article?", r.title, () => delMut.mutate(r.id))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ) },
            ]}
          />
      {dialog}
      
    </div>
  );
}
