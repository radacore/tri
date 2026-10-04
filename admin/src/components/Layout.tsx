import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  BarChart2,
  Tags,
  CheckCheck,
  FileText,
  Images,
  LayoutDashboard,
  LogOut,
  Newspaper,
  Palette,
  Quote,
  Settings,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "../lib/auth";

const GROUPS: {
  title: string;
  items: { to: string; label: string; icon: typeof LayoutDashboard }[];
}[] = [
  {
    title: "Main Menu",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/orders", label: "Orders", icon: ShoppingCart },
      { to: "/portfolio", label: "Portfolio", icon: Images },
      { to: "/case-studies", label: "Case Studies", icon: BarChart2 },
      { to: "/blog", label: "Blog", icon: Newspaper },
    ],
  },
  {
    title: "Content",
    items: [
      { to: "/testimonials", label: "Testimonials", icon: Quote },
      { to: "/clients", label: "Clients", icon: CheckCheck },
      { to: "/categories", label: "Categories", icon: Tags },
      { to: "/identity", label: "Website Identity", icon: Palette },
    ],
  },
  {
    title: "System",
    items: [{ to: "/settings", label: "Settings", icon: Settings }],
  },
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
          className="anim-pop rounded-[20px] border border-[#e2eceb] bg-white px-5 py-3.5 text-sm text-ink-primary shadow-lg"
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
      <aside className="hidden w-60 shrink-0 flex-col justify-between px-6 py-7 md:flex">
        <div>
          <Link to="/" className="mb-9 flex items-center gap-2.5 px-1">
            <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-sm font-extrabold text-white">
              L
            </span>
            <span className="text-xl font-bold tracking-tight text-ink-primary">
              LogoPulse
            </span>
          </Link>
          {GROUPS.map((g) => (
            <div key={g.title} className="mb-7">
              <p className="mb-3 px-2 text-[11px] font-semibold uppercase tracking-wider text-ink-secondary">
                {g.title}
              </p>
              <nav className="space-y-1">
                {g.items.map((n) => {
                  const active =
                    n.to === "/"
                      ? loc.pathname === "/"
                      : loc.pathname.startsWith(n.to);
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all ${
                        active
                          ? "bg-brand text-white shadow-sm"
                          : "text-ink-secondary hover:bg-surface-hover hover:text-ink-primary"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{n.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          ))}
        </div>
        <button
          onClick={() => {
            logout();
            nav("/login");
          }}
          className="flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium text-ink-secondary transition-all hover:bg-surface-hover hover:text-ink-primary"
        >
          <LogOut className="h-4 w-4" />
          <span>Logout</span>
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-4 px-4 py-6 md:px-8">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-brand text-xs font-bold text-white shadow-xs">
                A
              </span>
              <div className="hidden text-left lg:block">
                <p className="text-xs font-semibold leading-tight text-ink-primary">
                  Admin
                </p>
                <p className="text-[11px] leading-tight text-ink-secondary">
                  Content manager
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                logout();
                nav("/login");
              }}
              className="rounded-full bg-brand px-5 py-2 text-xs font-semibold tracking-wide text-white transition hover:bg-brand-hover md:hidden"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="w-full flex-1 px-4 pb-10 md:px-8">
          <div key={loc.pathname} className="anim-rise">
            <Outlet />
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
