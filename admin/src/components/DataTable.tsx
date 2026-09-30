import { useMemo, useState } from "react";

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
  pageSize = 10,
}: {
  columns: Column<T>[];
  data: T[];
  searchKeys?: (keyof T)[];
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

  return (
    <div>
      {searchKeys.length > 0 && (
        <input
          className="input mb-3 max-w-sm"
          placeholder="Search…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
        />
      )}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b text-left text-xs uppercase text-slate-500">
              {columns.map((c) => (
                <th key={c.key} className="px-4 py-2">
                  {c.sortable ? (
                    <button
                      className="font-semibold hover:text-slate-800"
                      onClick={() => {
                        if (sortKey === c.key) {
                          setSortDir((d) => (d === 1 ? -1 : 1));
                        } else {
                          setSortKey(c.key);
                          setSortDir(1);
                        }
                      }}
                    >
                      {c.label}{" "}
                      {sortKey === c.key ? (sortDir === 1 ? "↑" : "↓") : ""}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((row, i) => (
              <tr key={(row as any).id ?? i} className="border-b last:border-0">
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-2">
                    {c.render
                      ? c.render(row)
                      : String((row as any)[c.key] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
            {slice.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-slate-500"
                >
                  No data. API mungkin offline — tampilkan empty state.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-2 flex items-center gap-2 text-sm text-slate-600">
        <button
          className="rounded border px-2 py-1 disabled:opacity-40"
          disabled={safePage <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Prev
        </button>
        <span>
          Page {safePage + 1} / {pages} · {filtered.length} rows
        </span>
        <button
          className="rounded border px-2 py-1 disabled:opacity-40"
          disabled={safePage >= pages - 1}
          onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
