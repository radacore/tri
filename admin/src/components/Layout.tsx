import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/auth";

const NAV = [
  { to: "/", label: "Dashboard" },
  { to: "/orders", label: "Orders" },
  { to: "/portfolio", label: "Portfolio" },
  { to: "/case-studies", label: "Case Studies" },
  { to: "/blog", label: "Blog" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/clients", label: "Clients" },
  { to: "/settings", label: "Settings" },
];

let toastFn: ((msg: string) => void) | null = null;
export function toast(msg: string) {
  toastFn?.(msg);
}

export function Toaster() {
  const [msgs, setMsgs] = useState<string[]>([]);
  toastFn = (m: string) => {
    setMsgs((p) => [...p, m]);
    setTimeout(() => setMsgs((p) => p.slice(1)), 3000);
  };
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {msgs.map((m, i) => (
        <div
          key={i}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow"
        >
          {m}
        </div>
      ))}
    </div>
  );
}

export default function Layout() {
  const loc = useLocation();
  const nav = useNavigate();
  const { logout } = useAuth();
  return (
    <div className="flex min-h-screen">
      <aside className="w-56 shrink-0 border-r bg-white p-4">
        <h1 className="mb-4 text-lg font-extrabold text-[#0158FE]">
          LogoPulse Admin
        </h1>
        <nav className="space-y-1">
          {NAV.map((n) => {
            const active =
              n.to === "/"
                ? loc.pathname === "/"
                : loc.pathname.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`block rounded-lg px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-[#0158FE] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b bg-white px-6 py-3">
          <span className="text-sm text-slate-500">{loc.pathname}</span>
          <button
            className="rounded-lg border px-3 py-1.5 text-sm font-semibold"
            onClick={() => {
              logout();
              nav("/login");
            }}
          >
            Logout
          </button>
        </header>
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
      <Toaster />
    </div>
  );
}
