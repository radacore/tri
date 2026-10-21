// Helper bersama untuk kartu portfolio: dipakai PortfolioGrid (homepage),
// /portfolio, dan /portfolio/[category]. Data selalu dari API agar item yang
// diubah di admin langsung tampil.

import { escapeHTML } from './html';

export interface PortfolioCard {
  id?: string;
  title: string;
  category?: string | null;
  image_url: string;
  description?: string | null;
  featured?: boolean;
}

export interface Category {
  name: string;
  slug: string;
}

/** Nama kategori unik sesuai urutan kemunculan; dipakai saat /categories kosong. */
export function categoriesFrom(items: PortfolioCard[]): string[] {
  const out: string[] = [];
  for (const it of items) {
    const c = (it.category || '').trim();
    if (c && !out.includes(c)) out.push(c);
  }
  return out;
}

export async function fetchPortfolio(limit = 24): Promise<PortfolioCard[]> {
  const base = window.__lpApiBase || '/api/v1';
  try {
    const r = await fetch(`${base}/portfolio?limit=${limit}`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    const list = (j && (j.data ?? j)) || [];
    if (!Array.isArray(list)) return [];
    return list.filter((p: PortfolioCard) => p && p.image_url);
  } catch {
    return [];
  }
}

/** Kategori dari admin, urut sort_order. Dipakai filter pill di dua halaman. */
export async function fetchCategories(): Promise<Category[]> {
  const base = window.__lpApiBase || '/api/v1';
  try {
    const r = await fetch(`${base}/categories`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    const list = (j && (j.data ?? j)) || [];
    if (!Array.isArray(list)) return [];
    return list
      .filter((c: Category) => c && c.slug && c.name)
      .map((c: Category) => ({ name: String(c.name), slug: String(c.slug) }));
  } catch {
    return [];
  }
}

/** Markup satu kartu; kelas tambahan dipakai homepage untuk sembunyikan item ke-5+ di mobile. */
export function portfolioCardHTML(p: PortfolioCard, extraClass = ''): string {
  const cat = p.category || '';
  return `<button type="button" data-category="${escapeHTML(cat)}" data-full="${escapeHTML(p.image_url)}" data-title="${escapeHTML(p.title)}" class="pf-item group relative overflow-hidden rounded-2xl text-left sm:rounded-3xl ${extraClass}">
        <img src="${escapeHTML(p.image_url)}" alt="${escapeHTML(p.title)}" loading="lazy" decoding="async" width="600" height="450" class="aspect-[4/3] h-full w-full object-cover transition-all duration-300 group-hover:scale-105" />
        <span class="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 to-transparent" aria-hidden="true"></span>
        <span class="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true"></span>
        ${cat ? `<span class="absolute left-4 top-4 rounded-full bg-black/50 backdrop-blur-md text-white text-xs px-3 py-1 font-semibold">${escapeHTML(cat)}</span>` : ''}
        <span class="absolute bottom-4 left-4 right-4 text-white font-medium text-base md:text-lg leading-snug">${escapeHTML(p.title)}</span>
      </button>`;
}
