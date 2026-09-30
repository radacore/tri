import { useMemo, useState } from "react";
import { ChevronDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  value?: (row: T) => string | number;
}

export default function DataTable<T extends { id?: string }>({
  columns,
  data,
  searchKeys = [],
  searchPlaceholder = "Search…",
  pageSize = 10,
}: {
  columns: Column<T>[];
  data: T[];
  searchKeys?: (keyof T)[];
  searchPlaceholder?: string;
  pageSize?: number;
}) {
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let rows = data;
    const needle = q.trim().toLowerCase();
    if (needle && searchKeys.length > 0) {
      rows = rows.filter((r) =>
        searchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(needle)
        )
      );
    }
    if (sortKey) {
      const col = columns.find((c) => c.key === sortKey);
      if (col) {
        rows = [...rows].sort((a, b) => {
          const av = col.value
            ? col.value(a)
            : String((a as any)[col.key] ?? "");
          const bv = col.value
            ? col.value(b)
            : String((b as any)[col.key] ?? "");
          if (av < bv) return -1 * sortDir;
          if (av > bv) return 1 * sortDir;
          return 0;
        });
      }
    }
    return rows;
  }, [data, q, searchKeys, sortKey, sortDir, columns]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const slice = filtered.slice(
    safePage * pageSize,
    safePage * pageSize + pageSize
  );
  const from = filtered.length === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min(filtered.length, safePage * pageSize + pageSize);

  return (
    <div>
      {searchKeys.length > 0 && (
        <div className="relative mb-4 max-w-xs">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-muted" />
          <input
            className="input input-pill w-full pl-10"
            placeholder={searchPlaceholder}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(0);
            }}
          />
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#e2eceb]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-muted"
                >
                  {c.sortable ? (
                    <button
                      className="inline-flex items-center gap-1 hover:text-ink-primary"
                      onClick={() => {
                        if (sortKey === c.key) {
                          setSortDir((d) => (d === 1 ? -1 : 1));
                        } else {
                          setSortKey(c.key);
                          setSortDir(1);
                        }
                      }}
                    >
                      {c.label}
                      <ChevronDown
                        className={`h-3 w-3 transition-transform ${sortKey === c.key && sortDir === -1 ? "rotate-180" : ""} ${sortKey === c.key ? "opacity-100" : "opacity-30"}`}
                      />
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2f7f6]">
            {slice.map((row, i) => (
              <tr
                key={(row as any).id ?? i}
                className="anim-rise transition-colors hover:bg-surface-hover"
                style={{ "--i": Math.min(i, 8) } as React.CSSProperties}
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3.5 text-ink-primary">
                    {c.render
                      ? c.render(row)
                      : String((row as any)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center">
                  <p className="text-sm font-semibold text-ink-primary">
                    No results found
                  </p>
                  <p className="mt-1 text-xs text-ink-secondary">
                    Try a different search, or check that the API is online.
                  </p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4 flex items-center justify-between text-xs text-ink-secondary">
        <span className="tabular">
          Showing {from}–{to} of {filtered.length} items
        </span>
        <div className="flex items-center gap-2">
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary disabled:opacity-40"
            disabled={safePage <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="tabular font-semibold text-ink-primary">
            {safePage + 1} / {pages}
          </span>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary disabled:opacity-40"
            disabled={safePage >= pages - 1}
            onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
            aria-label="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
