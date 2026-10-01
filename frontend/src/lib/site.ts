import { API } from "./api";

// Website Identity: override teks & gambar landing dari admin (/identity).
// API mati = konten bawaan (fallback HTML) tetap tampil.
type Settings = Record<string, any>;
let cache: Settings | null = null;

export async function loadSite(): Promise<Settings> {
  if (cache) return cache;
  try {
    const r = await fetch(`${API}/settings`);
    if (r.ok) {
      const j = await r.json();
      cache = (j && (j.data ?? j)) || {};
    }
  } catch {
    /* offline — pakai fallback */
  }
  cache = cache ?? {};
  return cache;
}

function get(obj: any, path: string): any {
  return path
    .split(".")
    .reduce((o, k) => (o == null ? o : o[k]), obj);
}

export function applySite(s: Settings) {
  document.querySelectorAll("[data-site]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site") || "");
    if (typeof v === "string" && v !== "") el.textContent = v;
  });
  // harga dalam cents -> "$49"
  document.querySelectorAll("[data-site-price]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site-price") || "");
    if (typeof v === "number" && v > 0) {
      const usd = v / 100;
      el.textContent = "$" + (Number.isInteger(usd) ? String(usd) : usd.toFixed(2));
    }
  });
  document.querySelectorAll("[data-site-href]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site-href") || "");
    if (typeof v === "string" && v !== "")
      el.setAttribute("href", v);
  });
  document.querySelectorAll<HTMLImageElement>("[data-site-src]").forEach(
    (el) => {
      const v = get(s, el.getAttribute("data-site-src") || "");
      if (typeof v === "string" && v !== "") el.src = v;
    }
  );
  // logo: ganti badge "L" dengan <img> bila logo_url diisi
  const logo = get(s, "media.logo_url");
  if (typeof logo === "string" && logo !== "") {
    document.querySelectorAll("[data-site-logo]").forEach((el) => {
      if (el.querySelector("img")) return;
      const img = document.createElement("img");
      img.src = logo;
      img.alt = "LogoPulse";
      img.className = "h-8 w-8 rounded-full object-contain";
      el.replaceChildren(img);
    });
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    loadSite().then(applySite).catch(() => {});
  });
}
