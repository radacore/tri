import { API } from "./api";

// Website Identity: override teks & gambar landing dari admin (/identity).
// API mati = konten bawaan (fallback HTML) tetap tampil.
type Settings = Record<string, any>;
let cache: Settings | null = null;

export async function loadSite(): Promise<Settings> {
  if (cache) return cache;
  try {
    // no-store: jangan biarkan browser heuristic-cache; preview admin
    // harus selalu baca nilai terbaru setelah save
    const r = await fetch(`${API}/settings`, { cache: "no-store" });
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

function escHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  // tampil/sembunyi elemen (toggle sosmed footer); default tampil bila key belum ada
  document.querySelectorAll("[data-site-show]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site-show") || "");
    (el as HTMLElement).style.display = v === false ? "none" : "";
  });
  // placeholder input/textarea
  document.querySelectorAll("[data-site-ph]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site-ph") || "");
    if (typeof v === "string" && v !== "")
      (el as HTMLInputElement | HTMLTextAreaElement).placeholder = v;
  });
  // <form action> (mailto tujuan)
  document.querySelectorAll("[data-site-form]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site-form") || "");
    if (typeof v === "string" && v !== "")
      el.setAttribute("action", v);
  });
  document.querySelectorAll("meta[data-site-content]").forEach((el) => {
    const v = get(s, el.getAttribute("data-site-content") || "");
    if (typeof v === "string" && v !== "")
      el.setAttribute("content", v);
  });
  document.querySelectorAll<HTMLImageElement>("[data-site-src]").forEach(
    (el) => {
      const v = get(s, el.getAttribute("data-site-src") || "");
      if (typeof v === "string" && v !== "") el.src = v;
    }
  );
  // daftar fitur pricing: render ulang penuh agar tambah/kurang baris ikut
  document.querySelectorAll("[data-site-features]").forEach((ul) => {
    const arr = get(s, ul.getAttribute("data-site-features") || "");
    if (!Array.isArray(arr) || arr.length === 0) return;
    ul.innerHTML = arr
      .map(
        (f) =>
          `<li class="flex gap-2.5"><svg class="mt-0.5 h-4 w-4 shrink-0 text-primary" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><path d="M4 10.5 8.5 15 16 6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>${escHtml(String(f))}</span></li>`
      )
      .join("");
  });
  // daftar FAQ: render ulang penuh agar tambah/kurang item ikut
  document.querySelectorAll("[data-site-faq]").forEach((box) => {
    const arr = get(s, box.getAttribute("data-site-faq") || "");
    if (!Array.isArray(arr) || arr.length === 0) return;
    box.innerHTML = arr
      .map(
        (it: any) =>
          `<div class="faq-item rounded-2xl bg-white ring-1 ring-slate-900/10 overflow-hidden" style="border-radius:20px">` +
          `<button type="button" class="faq-toggle flex w-full items-center justify-between gap-4 px-5 py-4 text-left font-bold hover:text-primary transition-colors" aria-expanded="false">` +
          `<span>${escHtml(String(it.q ?? ""))}</span>` +
          `<svg class="faq-chevron h-5 w-5 shrink-0 text-primary" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M5 7.5 10 12.5 15 7.5" stroke-linecap="round" stroke-linejoin="round"/></svg>` +
          `</button><div class="faq-answer"><div><p class="px-5 pb-5 text-[15px] text-slate-600 leading-relaxed">${escHtml(String(it.a ?? ""))}</p></div></div></div>`
      )
      .join("");
  });
  // kolase hero: bagi rata ke 3 kolom, tiap kolom digandakan untuk loop mulus
  document.querySelectorAll("[data-site-collage]").forEach((track) => {
    const all = get(s, "hero_images.images");
    const list = Array.isArray(all) && all.length > 0 ? all : get(s, "hero_images");
    if (!Array.isArray(list) || list.length === 0) return;
    const col = Number(track.getAttribute("data-site-collage") || "0");
    const per = Math.ceil(list.length / 3);
    const slice = list.slice(col * per, col * per + per);
    if (slice.length === 0) return;
    const imgs = slice.concat(slice);
    track.innerHTML = imgs
      .map(
        (src) =>
          `<img src="${escHtml(String(src))}" alt="" width="400" height="350" loading="lazy" decoding="async" class="w-full rounded-2xl object-cover ring-1 ring-slate-900/10" style="border-radius:16px" />`
      )
      .join("");
  });
  const logo = get(s, "media.logo_url");
  if (typeof logo === "string" && logo !== "") {
    document.querySelectorAll("[data-site-logo]").forEach((el) => {
      if (el.querySelector("img")) return;
      const img = document.createElement("img");
      img.src = logo;
      img.alt = "BrandingPulse";
      img.className = "h-8 w-8 rounded-full object-contain";
      el.replaceChildren(img);
    });
  }
}

if (typeof document !== "undefined") {
  const boot = () => {
    loadSite().then(applySite).catch(() => {});
  };
  // Modul Astro bisa dieksekusi setelah DOMContentLoaded terlewat —
  // cek readyState agar loader tetap jalan.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
}
