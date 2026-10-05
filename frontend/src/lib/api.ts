export const API: string =
  (import.meta as unknown as { env: Record<string, string | undefined> }).env.PUBLIC_API_URL ??
  'http://localhost:8080/api/v1';

export interface Portfolio {
  id: string;
  title: string;
  category: 'Tech' | 'F&B' | 'Fashion' | 'Health' | string;
  image: string;
  logo?: string;
  featured?: boolean;
}

export interface CaseStudy {
  slug: string;
  title: string;
  client: string;
  industry: string;
  result: string;
  mockup: string;
  logo: string;
  excerpt: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  cover: string;
}

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
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
  { id: 'p1', title: 'Nexora SaaS', category: 'Tech', image: pic('nexora'), featured: true },
  { id: 'p2', title: 'Kopi Lantai', category: 'F&B', image: pic('kopi'), featured: true },
  { id: 'p3', title: 'Maison Rue', category: 'Fashion', image: pic('maison'), featured: true },
  { id: 'p4', title: 'VitalCare', category: 'Health', image: pic('vital'), featured: true },
  { id: 'p5', title: 'Cloudgrid', category: 'Tech', image: pic('cloudgrid') },
  { id: 'p6', title: 'Saffron House', category: 'F&B', image: pic('saffron') },
  { id: 'p7', title: 'Atelier Nord', category: 'Fashion', image: pic('atelier') },
  { id: 'p8', title: 'PulseFit', category: 'Health', image: pic('pulsefit') },
];

export const FALLBACK_CASES: CaseStudy[] = [
  { slug: 'nexora-rebrand', title: 'Nexora doubles signup conversion', client: 'Nexora', industry: 'SaaS', result: '+112% signup conversion', mockup: '/cases/nexora-mockup.svg', logo: '/cases/nexora-logo.svg', excerpt: 'A 48-hour rebrand that turned a generic SaaS mark into a conversion asset.' },
  { slug: 'kopi-lantai', title: 'Kopi Lantai brews a franchise-ready brand', client: 'Kopi Lantai', industry: 'F&B', result: '3 new outlets in 90 days', mockup: '/cases/kopi-mockup.svg', logo: '/cases/kopi-logo.svg', excerpt: 'Warm, memorable identity built for cups, signage, and social.' },
  { slug: 'maison-rue', title: 'Maison Rue goes premium', client: 'Maison Rue', industry: 'Fashion', result: '+68% average order value', mockup: '/cases/maison-mockup.svg', logo: '/cases/maison-logo.svg', excerpt: 'Serif wordmark and system that lifted perceived value overnight.' },
  { slug: 'vitalcare', title: 'VitalCare earns patient trust', client: 'VitalCare', industry: 'Health', result: '4.9★ across 2k reviews', mockup: '/cases/vital-mockup.svg', logo: '/cases/vital-logo.svg', excerpt: 'Calm, clinical identity designed for trust at first glance.' },
];

export const FALLBACK_POSTS: BlogPost[] = [
  { slug: 'logo-design-cost-2026', title: 'How much does a logo cost in 2026?', excerpt: 'Freelancer vs agency vs LogoPulse — honest numbers.', date: '2026-09-10', cover: pic('blog-cost', 800, 450) },
  { slug: 'rebrand-checklist', title: 'The 10-point rebrand checklist', excerpt: 'Know exactly when your startup has outgrown its logo.', date: '2026-08-22', cover: pic('blog-checklist', 800, 450) },
  { slug: 'logo-mistakes', title: '7 logo mistakes that scare customers away', excerpt: 'Fix these before your next launch.', date: '2026-07-30', cover: pic('blog-mistakes', 800, 450) },
];

export const FALLBACK_TESTIMONIALS: Testimonial[] = [
  { name: 'Sarah Chen', role: 'Founder, Nexora', avatar: 'https://i.pravatar.cc/96?img=47', quote: 'Two concepts on day one, final files on day two. Our signup page finally looks like the product we built.', rating: 5 },
  { name: 'Daniel Okafor', role: 'CEO, Cloudgrid', avatar: 'https://i.pravatar.cc/96?img=12', quote: 'The money-back guarantee sold me. The quality kept me. Best $149 I have spent on this company.', rating: 5 },
  { name: 'Maria Santos', role: 'Owner, Saffron House', avatar: 'https://i.pravatar.cc/96?img=32', quote: 'Customers photograph our cups now. The logo paid for itself within a month.', rating: 5 },
  { name: 'James Wright', role: 'CMO, VitalCare', avatar: 'https://i.pravatar.cc/96?img=59', quote: 'Professional process, zero chasing. Revisions came back fast and actually better.', rating: 5 },
  { name: 'Aisha Rahman', role: 'Founder, Atelier Nord', avatar: 'https://i.pravatar.cc/96?img=45', quote: 'It feels like a $5k agency identity. Investors noticed immediately.', rating: 5 },
  { name: 'Tom Becker', role: 'Founder, PulseFit', avatar: 'https://i.pravatar.cc/96?img=68', quote: 'Delivered in 48 hours as promised. The brand kit saved our designer weeks.', rating: 5 },
];

export const getPortfolio = () => safe<Portfolio[]>('/portfolio', FALLBACK_PORTFOLIO);
export const getCases = () => safe<CaseStudy[]>('/case-studies', FALLBACK_CASES);
export const getPosts = () => safe<BlogPost[]>('/blog', FALLBACK_POSTS);
export const getTestimonials = () => safe<Testimonial[]>('/testimonials', FALLBACK_TESTIMONIALS);
