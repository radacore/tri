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
  return (await res.json()) as T;
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
  return handle<UploadResult>(res);
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
  tier: string;
  status: OrderStatus;
  total_cents: number;
  currency?: string;
  brief?: Record<string, unknown> | string | null;
  deliverables?: string[] | null;
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
];
