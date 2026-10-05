const STATIC_ROUTES: { path: string; changefreq: string; priority: number }[] = [
  { path: "/", changefreq: "daily", priority: 1.0 },
  { path: "/portfolio/", changefreq: "weekly", priority: 0.8 },
  { path: "/case-studies/", changefreq: "weekly", priority: 0.8 },
  { path: "/blog/", changefreq: "daily", priority: 0.8 },
  { path: "/about/", changefreq: "monthly", priority: 0.5 },
  { path: "/contact/", changefreq: "monthly", priority: 0.5 },
  { path: "/order/", changefreq: "weekly", priority: 0.9 },
  { path: "/privacy/", changefreq: "yearly", priority: 0.3 },
  { path: "/terms/", changefreq: "yearly", priority: 0.3 },
];

const API = import.meta.env.PUBLIC_API_URL ?? "http://localhost:8080/api/v1";
const SITE = import.meta.env.PUBLIC_SITE_URL ?? "https://brandingpulse.co";
const site = SITE.replace(/\/$/, "");

function esc(s: string) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function GET() {
  const urls = [...STATIC_ROUTES.map((r) => ({ ...r, lastmod: "" }))];
  try {
    const [b, c] = await Promise.all([
      fetch(`${API}/blog?limit=100`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      fetch(`${API}/case-studies?limit=100`).then((r) => (r.ok ? r.json() : null)).catch(() => null),
    ]);
    for (const p of (b as any)?.data ?? []) {
      if (p?.slug) urls.push({ path: `/blog/${p.slug}/`, changefreq: "monthly", priority: 0.7, lastmod: String(p.updated_at || p.published_at || "").slice(0, 10) });
    }
    for (const p of (c as any)?.data ?? []) {
      if (p?.slug) urls.push({ path: `/case-studies/${p.slug}/`, changefreq: "monthly", priority: 0.7, lastmod: "" });
    }
  } catch { /* fallback: rute statis saja */ }
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${esc(site + u.path)}</loc><lastmod>${u.lastmod || today}</lastmod><changefreq>${u.changefreq}</changefreq><priority>${u.priority.toFixed(1)}</priority></url>`).join("\n") +
    `\n</urlset>`;
  return new Response(body, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
