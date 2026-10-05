export default function Pager({
  page,
  pages,
  onPage,
  from,
  to,
  total,
}: {
  page: number;
  pages: number;
  onPage: (p: number) => void;
  from: number;
  to: number;
  total: number;
}) {
  if (pages <= 1) return null;
  const nums: (number | "…")[] = [];
  for (let i = 0; i < pages; i++) {
    if (i === 0 || i === pages - 1 || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
      <p className="tabular text-xs text-ink-secondary">
        Showing {from}–{to} of {total}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white px-2.5 text-xs font-semibold text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary disabled:opacity-40"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
        >
          ←
        </button>
        {nums.map((n, i) =>
          n === "…" ? (
            <span key={`e${i}`} className="px-1 text-xs text-ink-muted">…</span>
          ) : (
            <button
              key={n}
              onClick={() => onPage(n)}
              aria-label={`Page ${n + 1}`}
              aria-current={n === page ? "page" : undefined}
              className={`tabular flex h-8 min-w-8 items-center justify-center rounded-full px-2.5 text-xs font-semibold transition ${
                n === page
                  ? "bg-brand text-white"
                  : "border border-[#e2eceb] bg-white text-ink-secondary hover:bg-surface-hover hover:text-ink-primary"
              }`}
            >
              {n + 1}
            </button>
          )
        )}
        <button
          className="flex h-8 min-w-8 items-center justify-center rounded-full border border-[#e2eceb] bg-white px-2.5 text-xs font-semibold text-ink-secondary transition hover:bg-surface-hover hover:text-ink-primary disabled:opacity-40"
          disabled={page === pages - 1}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
        >
          →
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, size: number) {
  const pages = Math.max(1, Math.ceil(items.length / size));
  const safe = Math.min(page, pages - 1);
  return {
    slice: items.slice(safe * size, safe * size + size),
    pages,
    safe,
    from: items.length === 0 ? 0 : safe * size + 1,
    to: Math.min(items.length, safe * size + size),
  };
}
