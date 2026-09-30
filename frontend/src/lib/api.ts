export const API: string =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env.PUBLIC_API_URL ??
  'http://localhost:8080/api/v1';

export interface Portfolio {
  id: string;
  title: string;
  category: 'Tech' | 'F&B' | 'Fashion' | 'Health' | string;
  image: string;
  logo?: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  titleId?: string;
  client: string;
  industry: string;
  result: string;
  resultId?: string;
  mockup: string;
  logo: string;
  excerpt: string;
  excerptId?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  titleId?: string;
  excerpt: string;
  excerptId?: string;
  date: string;
  cover: string;
}

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
  quoteId?: string;
  rating: number;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const r = await fetch(`${API}${path}`, init);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json() as Promise<T>;
}

async function safe<T>(path: string, fallback: T): Promise<T> {
  try {
    return await api<T>(path);
  } catch {
    return fallback;
  }
}

const pic = (seed: string, w = 600, h = 450) => `https://picsum.photos/seed/${seed}/${w}/${h}.webp`;

export const FALLBACK_PORTFOLIO: Portfolio[] = [
  { id: 'p1', title: 'Nexora SaaS', category: 'Tech', image: pic('nexora') },
  { id: 'p2', title: 'Kopi Lantai', category: 'F&B', image: pic('kopi') },
  { id: 'p3', title: 'Maison Rue', category: 'Fashion', image: pic('maison') },
  { id: 'p4', title: 'VitalCare', category: 'Health', image: pic('vital') },
  { id: 'p5', title: 'Cloudgrid', category: 'Tech', image: pic('cloudgrid') },
  { id: 'p6', title: 'Saffron House', category: 'F&B', image: pic('saffron') },
  { id: 'p7', title: 'Atelier Nord', category: 'Fashion', image: pic('atelier') },
  { id: 'p8', title: 'PulseFit', category: 'Health', image: pic('pulsefit') },
];

export const FALLBACK_CASES: CaseStudy[] = [
  { slug: 'nexora-rebrand', title: 'Nexora doubles signup conversion', titleId: 'Nexora melipatgandakan konversi signup', client: 'Nexora', industry: 'SaaS', result: '+112% signup conversion', resultId: '+112% konversi signup', mockup: pic('nexora-mockup'), logo: pic('nexora-logo', 400, 300), excerpt: 'A 48-hour rebrand that turned a generic SaaS mark into a conversion asset.', excerptId: 'Rebrand 48 jam yang mengubah logo SaaS generik menjadi aset konversi.' },
  { slug: 'kopi-lantai', title: 'Kopi Lantai brews a franchise-ready brand', titleId: 'Kopi Lantai menyeduh brand siap franchise', client: 'Kopi Lantai', industry: 'F&B', result: '3 new outlets in 90 days', resultId: '3 outlet baru dalam 90 hari', mockup: pic('kopi-mockup'), logo: pic('kopi-logo', 400, 300), excerpt: 'Warm, memorable identity built for cups, signage, and social.', excerptId: 'Identitas hangat dan berkesan, dibangun untuk cup, signage, dan media sosial.' },
  { slug: 'maison-rue', title: 'Maison Rue goes premium', titleId: 'Maison Rue naik kelas premium', client: 'Maison Rue', industry: 'Fashion', result: '+68% average order value', resultId: '+68% nilai order rata-rata', mockup: pic('maison-mockup'), logo: pic('maison-logo', 400, 300), excerpt: 'Serif wordmark and system that lifted perceived value overnight.', excerptId: 'Wordmark serif dan sistem yang mengangkat persepsi nilai dalam semalam.' },
  { slug: 'vitalcare', title: 'VitalCare earns patient trust', titleId: 'VitalCare meraih kepercayaan pasien', client: 'VitalCare', industry: 'Health', result: '4.9★ across 2k reviews', resultId: '4,9★ dari 2rb ulasan', mockup: pic('vital-mockup'), logo: pic('vital-logo', 400, 300), excerpt: 'Calm, clinical identity designed for trust at first glance.', excerptId: 'Identitas tenang dan klinis yang dirancang untuk dipercaya sejak pandangan pertama.' },
];

export const FALLBACK_POSTS: BlogPost[] = [
  { slug: 'logo-design-cost-2026', title: 'How much does a logo cost in 2026?', titleId: 'Berapa biaya logo di 2026?', excerpt: 'Freelancer vs agency vs LogoPulse — honest numbers.', excerptId: 'Freelancer vs agensi vs LogoPulse — angka jujur.', date: '2026-09-10', cover: pic('blog-cost', 800, 450) },
  { slug: 'rebrand-checklist', title: 'The 10-point rebrand checklist', titleId: 'Checklist rebrand 10 poin', excerpt: 'Know exactly when your startup has outgrown its logo.', excerptId: 'Ketahui tepatnya kapan startup-mu sudah kebesaran logo.', date: '2026-08-22', cover: pic('blog-checklist', 800, 450) },
  { slug: 'logo-mistakes', title: '7 logo mistakes that scare customers away', titleId: '7 kesalahan logo yang mengusir pelanggan', excerpt: 'Fix these before your next launch.', excerptId: 'Perbaiki ini sebelum launching berikutnya.', date: '2026-07-30', cover: pic('blog-mistakes', 800, 450) },
];

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Chen', role: 'Founder, Nexora', avatar: 'https://i.pravatar.cc/96?img=47', quote: 'Two concepts on day one, final files on day two. Our signup page finally looks like the product we built.', quoteId: 'Dua konsep di hari pertama, file final di hari kedua. Halaman signup kami akhirnya terlihat seperti produk yang kami bangun.', rating: 5 },
  { name: 'Daniel Okafor', role: 'CEO, Cloudgrid', avatar: 'https://i.pravatar.cc/96?img=12', quote: 'The money-back guarantee sold me. The quality kept me. Best $149 I have spent on this company.', quoteId: 'Garansi uang kembali yang meyakinkanku. Kualitas yang membuatku bertahan. $149 terbaik yang pernah kukeluarkan untuk perusahaan ini.', rating: 5 },
  { name: 'Maria Santos', role: 'Owner, Saffron House', avatar: 'https://i.pravatar.cc/96?img=32', quote: 'Customers photograph our cups now. The logo paid for itself within a month.', quoteId: 'Pelanggan sekarang memotret cup kami. Logonya balik modal dalam sebulan.', rating: 5 },
  { name: 'James Wright', role: 'CMO, VitalCare', avatar: 'https://i.pravatar.cc/96?img=59', quote: 'Professional process, zero chasing. Revisions came back fast and actually better.', quoteId: 'Proses profesional, tanpa perlu mengejar. Revisi kembali cepat dan malah lebih bagus.', rating: 5 },
  { name: 'Aisha Rahman', role: 'Founder, Atelier Nord', avatar: 'https://i.pravatar.cc/96?img=45', quote: 'It feels like a $5k agency identity. Investors noticed immediately.', quoteId: 'Rasanya seperti identitas agensi $5rb. Investor langsung menyadarinya.', rating: 5 },
  { name: 'Tom Becker', role: 'Founder, PulseFit', avatar: 'https://i.pravatar.cc/96?img=68', quote: 'Delivered in 48 hours as promised. The brand kit saved our designer weeks.', quoteId: 'Terkirim 48 jam sesuai janji. Brand kit-nya menghemat waktu desainer kami berminggu-minggu.', rating: 5 },
];

export const getPortfolio = () => safe<Portfolio[]>('/portfolio', FALLBACK_PORTFOLIO);
export const getCases = () => safe<CaseStudy[]>('/case-studies', FALLBACK_CASES);
export const getPosts = () => safe<BlogPost[]>('/posts', FALLBACK_POSTS);
export const getTestimonials = () => safe<Testimonial[]>('/testimonials', FALLBACK_TESTIMONIALS);
