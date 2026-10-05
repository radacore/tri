import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Calendar,
  DollarSign,
  Hourglass,
  MoreHorizontal,
  ShoppingCart,
  Users,
} from "lucide-react";
import { centsToUSD, get, type DashboardStats } from "../api/client";
import StatsCard from "../components/StatsCard";
import Badge from "../components/Badge";

const EMPTY: DashboardStats = {
  total_orders: 0,
  revenue_cents: 0,
  pending_orders: 0,
  featured_count: 0,
  revenue_by_month: [],
  orders_by_status: [],
  recent_orders: [],
};

function Donut({ segments }: { segments: { value: number; color: string; label: string }[] }) {
  const total = segments.reduce((a, s) => a + s.value, 0) || 1;
  const R = 58;
  const C = 2 * Math.PI * R;
  const [on, setOn] = useState(false);
  const [tip, setTip] = useState<{ x: number; y: number; i: number } | null>(null);
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setOn(true)));
    return () => cancelAnimationFrame(t);
  }, []);
  let acc = 0;
  const move = (e: React.MouseEvent, i: number) => {
    const box = (e.currentTarget.ownerSVGElement?.getBoundingClientRect() ?? e.currentTarget.getBoundingClientRect());
    setTip({ x: e.clientX - box.left, y: e.clientY - box.top, i });
  };
  return (
    <div className="relative">
      <svg className="h-56 w-56 -rotate-90" viewBox="0 0 160 160" onMouseLeave={() => setTip(null)}>
        {segments.map((s, i) => {
          const len = (s.value / total) * C;
          const el = (
            <circle
              key={i}
              cx="80"
              cy="80"
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={tip && tip.i !== i ? 16 : 22}
              strokeDasharray={`${on ? len : 0} ${C}`}
              strokeDashoffset={-acc}
              opacity={tip && tip.i !== i ? 0.45 : 1}
              style={{ transition: "stroke-dasharray 0.9s ease, stroke-dashoffset 0.9s ease, stroke-width 0.2s ease, opacity 0.2s ease", cursor: "pointer" }}
              onMouseEnter={(e) => move(e, i)}
              onMouseMove={(e) => move(e, i)}
            >
              <title>{`${s.label}: ${s.value} (${Math.round((s.value / total) * 100)}%)`}</title>
            </circle>
          );
          acc += len;
          return el;
        })}
      </svg>
      {tip && (
        <div
          className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap rounded-lg bg-[#0f3738] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg"
          style={{ left: Math.min(Math.max(tip.x, 60), 180), top: Math.max(tip.y - 14, 0) }}
        >
          {segments[tip.i].label}: {segments[tip.i].value} ({Math.round((segments[tip.i].value / total) * 100)}%)
        </div>
      )}
    </div>
  );
}

const STATUS_COLORS = ["#cde9a7", "#a9e4de", "#f8c0c8", "#c3d2fc", "#e2eceb"];

export default function DashboardPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        return await get<DashboardStats>("/admin/dashboard");
      } catch {
        return EMPTY;
      }
    },
  });
  const s = data ?? EMPTY;

  const byStatus = (s.orders_by_status ?? []).map((r) => ({
    status: r.status,
    count: r.count,
  }));
  const weeks = s.revenue_by_week ?? [];
  const maxRev = Math.max(1, ...weeks.map((w) => w.revenue_cents));
  const [barsOn, setBarsOn] = useState(false);
  const [barTip, setBarTip] = useState<number | null>(null);
  useEffect(() => {
    const t = requestAnimationFrame(() => requestAnimationFrame(() => setBarsOn(true)));
    return () => cancelAnimationFrame(t);
  }, [byStatus.length]);

  return (
    <div className="space-y-6">
      <p className="anim-rise text-2xl font-bold tracking-tight text-ink-primary">
        Welcome back, Admin!
      </p>

      <section className="anim-rise rounded-[26px] bg-white p-5 shadow-sm md:p-6" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-semibold tracking-tight text-ink-primary">
            Business Results
          </h2>
          <span className="flex items-center gap-2 rounded-full border border-[#d6e5e4] px-3 py-1.5 text-xs font-medium text-ink-primary">
            <Calendar className="h-3.5 w-3.5 text-ink-secondary" />
            This Month
          </span>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-[20px] bg-surface-muted"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Revenue"
              value={centsToUSD(s.revenue_cents)}
              hint="USD · paid orders"
              tone="lime"
              icon={DollarSign}
              bars={[30, 55, 75, 100]}
            />
            <StatsCard
              title="Total Orders"
              value={String(s.total_orders)}
              hint="All time"
              tone="teal"
              icon={ShoppingCart}
              bars={[40, 65, 100, 55]}
            />
            <StatsCard
              title="Pending Orders"
              value={String(s.pending_orders)}
              hint="Needs attention"
              tone="pink"
              icon={Hourglass}
              bars={[50, 90, 60, 35]}
            />
            <StatsCard
              title="Featured Items"
              value={String(s.featured_count ?? 0)}
              hint={`New customers: ${s.new_customers ?? 0}`}
              tone="purple"
              icon={Users}
              bars={[35, 55, 80, 100]}
            />
          </div>
        )}
      </section>

      <div className="anim-rise grid grid-cols-1 gap-6 lg:grid-cols-12" style={{ "--i": 2 } as React.CSSProperties}>
        <div className="flex flex-col justify-between rounded-[26px] bg-white p-6 shadow-sm lg:col-span-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-ink-primary">
              Orders by Status
            </h2>
            <button
              aria-label="More options"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#e4eeed] text-ink-secondary transition hover:text-ink-primary"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          {isError && (
            <p className="py-2 text-xs text-[#92400e]">
              API offline — showing empty state.
            </p>
          )}
          {byStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">
              No status data yet.
            </p>
          ) : (
            <>
              <div className="relative my-3 flex items-center justify-center">
                <Donut
                  segments={byStatus.map((b, i) => ({
                    value: b.count,
                    color: STATUS_COLORS[i % STATUS_COLORS.length],
                    label: b.status.replace(/_/g, " "),
                  }))}
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xs font-medium text-ink-secondary">
                    Total
                  </span>
                  <span className="tabular text-2xl font-extrabold tracking-tight text-ink-primary">
                    {s.total_orders}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3 text-xs text-ink-secondary">
                {byStatus.map((b, i) => (
                  <span key={b.status} className="flex items-center gap-1.5">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: STATUS_COLORS[i % STATUS_COLORS.length],
                      }}
                    />
                    <span className="capitalize">
                      {b.status.replace(/_/g, " ")}
                    </span>
                  </span>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-col justify-between rounded-[26px] bg-white p-6 shadow-sm lg:col-span-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-semibold tracking-tight text-ink-primary">
              Weekly Revenue
            </h2>
            <span className="text-xs font-medium text-ink-secondary">Last 8 weeks · paid orders</span>
          </div>
          {weeks.length === 0 ? (
            <p className="py-8 text-center text-sm text-ink-secondary">
              No revenue data yet.
            </p>
          ) : (
            <div className="flex h-64 items-stretch gap-4 pt-2">
              <div className="flex shrink-0 flex-col justify-between py-2 text-[11px] font-medium tabular text-ink-muted">
                <span>{centsToUSD(maxRev).replace(".00", "")}</span>
                <span>{centsToUSD(Math.round(maxRev * 0.66)).replace(".00", "")}</span>
                <span>{centsToUSD(Math.round(maxRev * 0.33)).replace(".00", "")}</span>
                <span>$0</span>
              </div>
              <div className="grid h-full flex-1 grid-cols-8 items-end gap-2 sm:gap-3">
                {weeks.map((w, i) => {
                  const d = w.week.split("-");
                  const label = d.length === 3 ? `${d[2]}/${d[1]}` : w.week;
                  return (
                    <div
                      key={w.week}
                      className="relative flex h-full flex-col items-center justify-end"
                      onMouseEnter={() => setBarTip(i)}
                      onMouseLeave={() => setBarTip(null)}
                    >
                      {barTip === i && (
                        <div className="pointer-events-none absolute -top-1 z-10 -translate-y-full whitespace-nowrap rounded-lg bg-[#0f3738] px-2.5 py-1.5 text-xs font-semibold text-white shadow-lg">
                          {centsToUSD(w.revenue_cents)} · w/c {label}
                        </div>
                      )}
                      <div className="flex h-full w-full max-w-[40px] flex-col justify-end rounded-full bg-[#eef6f5] p-1.5">
                        <div
                          className="w-full rounded-full shadow-inner"
                          style={{
                            height: barsOn ? `${Math.max(w.revenue_cents > 0 ? 8 : 2, (w.revenue_cents / maxRev) * 100)}%` : "2%",
                            background: w.revenue_cents > 0 ? STATUS_COLORS[i % STATUS_COLORS.length] : "#cbdcda",
                            opacity: barTip === null || barTip === i ? 1 : 0.45,
                            transition: "height 0.9s cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease",
                            cursor: "pointer",
                          }}
                        />
                      </div>
                      <span className="mt-3 max-w-full truncate text-[11px] font-medium tabular text-ink-secondary">
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <section className="anim-rise rounded-[26px] bg-white p-6 shadow-sm" style={{ "--i": 3 } as React.CSSProperties}>
        <h2 className="mb-5 text-base font-semibold tracking-tight text-ink-primary">
          Recent Orders
        </h2>
        {(s.recent_orders ?? []).length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm font-semibold text-ink-primary">
              No orders yet
            </p>
            <p className="mt-1 text-xs text-ink-secondary">
              New orders from the website will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#e2eceb] text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Tier</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f2f7f6]">
                {(s.recent_orders ?? []).slice(0, 5).map((o) => (
                  <tr
                    key={o.id}
                    className="transition-colors hover:bg-surface-hover"
                  >
                    <td className="tabular px-4 py-3.5 font-mono text-xs">
                      {o.id.slice(0, 8)}
                    </td>
                    <td className="px-4 py-3.5 font-medium">
                      {o.customer_name}
                    </td>
                    <td className="px-4 py-3.5 capitalize">{o.tier}</td>
                    <td className="px-4 py-3.5">
                      <Badge status={o.status} />
                    </td>
                    <td className="tabular px-4 py-3.5 font-semibold">
                      {centsToUSD(o.total_cents)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="anim-rise flex flex-wrap gap-2" style={{ "--i": 4 } as React.CSSProperties}>
        <Link to="/portfolio" className="btn-primary">
          + Add Portfolio Item
        </Link>
        <Link to="/blog" className="btn-secondary">
          Write Article
        </Link>
        <Link to="/orders" className="btn-secondary">
          View Pending Orders
        </Link>
      </div>
    </div>
  );
}
