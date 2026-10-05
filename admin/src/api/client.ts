const RAW = (import.meta as any).env?.VITE_API_URL as string | undefined;
export const API_BASE: string =
  RAW && RAW.length > 0 ? RAW : "http://localhost:8080/api/v1";

function authHeaders(extra?: HeadersInit): HeadersInit {
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("logopulse_token")
      : null;
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(extra ?? {}),
  };
}

async function handle<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    // Sesi kedaluwarsa / token tak valid: bersihkan + tendang ke login.
    // Jangan redirect bila sudah di halaman login (hindari loop).
    try {
      localStorage.removeItem("logopulse_token");
    } catch {
      /* ignore */
    }
    if (
      typeof window !== "undefined" &&
      !window.location.pathname.endsWith("/login")
    ) {
      window.location.assign("/admin/login?expired=1");
    }
    throw new Error("Session expired. Please sign in again.");
  }
  if (!res.ok) {
    let msg = `API ${res.status}`;
    try {
      const j = await res.json();
      if (j && (j.message || j.error)) msg = j.message || j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as unknown as T;
  const body = (await res.json()) as unknown;
  return normalize<T>(body);
}

// Backend membungkus semua respons dalam envelope { data } / { data, meta },
// sementara halaman admin memakai bentuk mentah. Normalisasi di satu tempat
// + samakan nama field (package_tier -> tier, amount -> total_cents,
// pending_count -> pending_orders) agar tabel langsung terisi.
function normalizeOrder<T>(o: T): T {
  if (o && typeof o === "object" && "package_tier" in o) {
    const r = o as Record<string, unknown>;
    if (r.tier === undefined) r.tier = r.package_tier;
    if (r.total_cents === undefined)
      r.total_cents = (r.amount as number) ?? 0;
  }
  return o;
}

function normalize<T>(body: unknown): T {
  const v =
    body && typeof body === "object" && "data" in (body as Record<string, unknown>)
      ? (body as Record<string, unknown>).data
      : body;
  if (Array.isArray(v)) return v.map(normalizeOrder) as unknown as T;
  if (v && typeof v === "object") {
    const r = v as Record<string, unknown>;
    normalizeOrder(r);
    if ("pending_count" in r && !("pending_orders" in r))
      r.pending_orders = r.pending_count;
    if ("thumbnail_url" in r && !("thumbnail" in r))
      (r as Record<string, unknown>).thumbnail = r.thumbnail_url;
    if (Array.isArray(r.recent_orders))
      r.recent_orders = r.recent_orders.map(normalizeOrder);
  }
  return v as T;
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  });
  return handle<T>(res);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function put<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PUT",
    headers: authHeaders({ "Content-Type": "application/json" }),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return handle<T>(res);
}

export async function del<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "DELETE",
    headers: authHeaders(),
  });
  return handle<T>(res);
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  const token =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("logopulse_token")
      : null;
  const res = await fetch(`${API_BASE}/admin/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: fd,
  });
  const out = await handle<UploadResult>(res);
  // Server mengembalikan path relatif (/uploads/...) yang hanya dikenal API.
  // Jadikan absolut ke origin API agar preview admin + landing bisa memuatnya.
  if (out && typeof out.url === "string" && out.url.startsWith("/")) {
    out.url = API_BASE.replace(/\/api\/v1\/?$/, "") + out.url;
  }
  return out;
}

/* ---------- Types ---------- */

export type OrderStatus =
  | "pending"
  | "paid"
  | "in_progress"
  | "revision"
  | "completed"
  | "delivered";

export type OrderTier = "starter" | "professional" | "premium";

export interface OrderHistoryEntry {
  status: string;
  at: string;
  note?: string;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  tier: string;
  status: OrderStatus;
  total_cents: number;
  currency?: string;
  brief?: Record<string, unknown> | string | null;
  deliverables?: string[] | null;
  payment_proof?: string | null;
  notes?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at?: string;
  history?: OrderHistoryEntry[];
}

export interface PortfolioItem {
  id: string;
  title: string;
  category: string;
  image_url: string;
  description?: string;
  featured?: boolean;
  published?: boolean;
  sort_order?: number;
}

export interface CaseStudy {
  id: string;
  title: string;
  slug: string;
  industry?: string;
  hero_image?: string;
  content?: string;
  published?: boolean;
  client?: string;
  result?: string;
  excerpt?: string;
  logo?: string;
  mockup?: string;
  year?: string;
  website?: string;
  created_at?: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category?: string;
  thumbnail?: string;
  content?: string;
  meta_title?: string;
  meta_description?: string;
  published?: boolean;
  published_at?: string | null;
  created_at?: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar_url?: string;
  quote: string;
  rating: number;
  featured?: boolean;
  published?: boolean;
}

export interface ClientLogo {
  id: string;
  name: string;
  logo_url: string;
  website?: string;
  sort_order?: number;
  published?: boolean;
}

export interface DashboardStats {
  total_orders: number;
  revenue_cents: number;
  pending_orders: number;
  featured_count?: number;
  new_customers?: number;
  revenue_by_month?: { month: string; revenue_cents: number }[];
  orders_by_status?: { status: string; count: number }[];
  recent_orders?: Order[];
}

export interface UploadResult {
  url: string;
  format?: string;
  width?: number;
  height?: number;
  size_kb?: number;
}

export function centsToUSD(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "in_progress",
  "revision",
  "completed",
  "delivered",
  "cancelled",
  "refunded",
];
