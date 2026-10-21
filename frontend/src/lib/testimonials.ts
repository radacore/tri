// Testimoni untuk marquee homepage. Data diambil dari admin; baris duplikat
// (seed berulang) dibuang supaya marquee tidak menampilkan nama yang sama
// berkali-kali. Dipakai saat build (SSR) dan saat runtime (refresh).

export interface Quote {
  name: string;
  role: string;
  quote: string;
  rating: number;
}

interface ApiTestimonial {
  name?: unknown;
  position?: unknown;
  company?: unknown;
  quote?: unknown;
  rating?: unknown;
}

/** Buang duplikat berdasarkan nama + kutipan, pertahankan urutan API. */
export function dedupeQuotes(list: Quote[]): Quote[] {
  const seen = new Set<string>();
  const out: Quote[] = [];
  for (const t of list) {
    const key = `${t.name}\u0000${t.quote}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function toQuote(t: ApiTestimonial): Quote | null {
  const name = typeof t.name === 'string' ? t.name.trim() : '';
  const quote = typeof t.quote === 'string' ? t.quote.trim() : '';
  if (!name || !quote) return null;
  const role = [t.position, t.company]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(', ');
  return { name, role, quote, rating: Number(t.rating ?? 5) };
}

async function fetchQuotes(base: string, qs: string): Promise<Quote[]> {
  try {
    const r = await fetch(`${base}/testimonials?${qs}`, { cache: 'no-store' });
    if (!r.ok) return [];
    const j = await r.json();
    const list: ApiTestimonial[] = (j && (j.data ?? j)) || [];
    if (!Array.isArray(list)) return [];
    return dedupeQuotes(list.map(toQuote).filter((q): q is Quote => q !== null));
  } catch {
    return [];
  }
}

/**
 * Ambil maksimal `limit` testimoni unik. Yang ditandai featured didahulukan,
 * tetapi bila hasilnya terlalu sedikit (data seed dobel) pakai daftar terbaru.
 */
export async function loadTestimonials(base: string, limit = 8): Promise<Quote[]> {
  const [featured, latest] = await Promise.all([
    fetchQuotes(base, `featured=true&limit=${limit * 2}`),
    fetchQuotes(base, `limit=${limit * 2}`),
  ]);
  const pick = featured.length >= 4 ? featured : latest;
  return pick.slice(0, limit);
}
