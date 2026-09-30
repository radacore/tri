import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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

export default function DashboardPage() {
  const { data, isError } = useQuery({
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

  const revenue = (s.revenue_by_month ?? []).map((r) => ({
    month: r.month,
    revenue: r.revenue_cents / 100,
  }));
  const byStatus = (s.orders_by_status ?? []).map((r) => ({
    status: r.status,
    count: r.count,
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      {isError && (
        <p className="text-sm text-amber-700">
          API offline — menampilkan empty state.
        </p>
      )}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Revenue"
          value={centsToUSD(s.revenue_cents)}
          hint="Total revenue (USD)"
        />
        <StatsCard title="Total Orders" value={String(s.total_orders)} />
        <StatsCard title="Pending" value={String(s.pending_orders)} />
        <StatsCard
          title="Featured"
          value={String(s.featured_count ?? 0)}
          hint={`New customers: ${s.new_customers ?? 0}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Revenue per bulan (USD)</h2>
          {revenue.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Belum ada data revenue.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#0158FE"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="card p-4">
          <h2 className="mb-2 font-semibold">Orders per status</h2>
          {byStatus.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Belum ada data status.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byStatus}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" fontSize={11} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0158FE" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card p-4">
        <h2 className="mb-2 font-semibold">5 Order terbaru</h2>
        {(s.recent_orders ?? []).length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Belum ada order.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-2">ID</th>
                <th>Customer</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {(s.recent_orders ?? []).slice(0, 5).map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-2 font-mono text-xs">{o.id.slice(0, 8)}</td>
                  <td>{o.customer_name}</td>
                  <td>{o.tier}</td>
                  <td>
                    <Badge status={o.status} />
                  </td>
                  <td>{centsToUSD(o.total_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Link to="/portfolio" className="btn-primary">
          + Tambah Portfolio
        </Link>
        <Link to="/blog" className="rounded-lg border px-4 py-2 text-sm font-semibold">
          Tulis Artikel
        </Link>
        <Link
          to="/orders"
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Lihat Pending Orders
        </Link>
      </div>
    </div>
  );
}
