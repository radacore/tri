---
name: "LogoPulse Brand Landing Page & Design System"
description: "High-converting, minimalist design-agency landing page featuring floating pill navigation, bento showcases, multi-step process cards, tiered pricing, and shadcn/ui powered admin panel."
version: 1.1.0
source: visual-audit
mode: light
default-mode: light
style-direction: "Minimalist SaaS + Editorial Brand Accent"
mood: "premium, trustworthy, modern, high-precision"
comparable-to: "Logomint, Softriver, Linear, Stripe"
screen-type: "Landing Page & Web App"
target-platform: "Astro v4+ (Public Landing Page) & React SPA with shadcn/ui (Admin Panel)"

# ============================================
# DESIGN TOKENS
# Consumed by Astro & Tailwind CSS v4 via @theme directive
# ============================================

colors:
  # Brand (LogoPulse Blue Palette)
  primary: "#0158FE"
  primary-hover: "#2177FE"
  primary-subtle: "#E2E7F9"
  secondary: "#0A0A0A"
  secondary-hover: "#1E293B"

  # Gradients
  gradient-primary: "linear-gradient(135deg, #0158FE 0%, #2177FE 100%)"
  gradient-dark: "linear-gradient(135deg, #013A9E 0%, #0158FE 100%)"
  gradient-glow: "radial-gradient(ellipse at center, rgba(1, 88, 254, 0.15) 0%, transparent 70%)"

  # Canvas
  background: "#FFFFFF"
  surface: "#F8FAFC"
  surface-2: "#FFFFFF"
  surface-hover: "#F1F5F9"
  dark-surface: "#0A0A0A"
  dark-surface-2: "#141414"

  # Text
  text-primary: "#040815"
  text-secondary: "#64748B"
  text-muted: "#71717B"
  text-on-primary: "#FFFFFF"

  # Lines & Borders
  border: "#E2E8F0"
  border-subtle: "#E4E4E7"
  border-strong: "#CBD5E1"

  # Semantic
  success: "#10B981"
  success-subtle: "#ECFDF5"
  warning: "#F59E0B"
  warning-subtle: "#FFFBEB"
  error: "#EF4444"
  error-subtle: "#FEF2F2"
  info: "#0158FE"
  info-subtle: "#E2E7F9"

typography:
  font-family-display: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  font-family-serif: "'Newsreader', 'Playfair Display', Georgia, serif"
  font-family-body: "'Manrope', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
  font-family-mono: "'JetBrains Mono', ui-monospace, monospace"

  display:
    size: "3.75rem"           # ~60px
    weight: 700
    line-height: 1.1
    letter-spacing: "-0.025em"
  h1:
    size: "3rem"              # ~48px
    weight: 700
    line-height: 1.15
    letter-spacing: "-0.02em"
  h2:
    size: "2.25rem"           # ~36px
    weight: 600
    line-height: 1.25
    letter-spacing: "-0.015em"
  h3:
    size: "1.5rem"            # ~24px
    weight: 600
    line-height: 1.3
    letter-spacing: "-0.01em"
  h4:
    size: "1.25rem"           # ~20px
    weight: 600
    line-height: 1.4
  body-lg:
    size: "1.125rem"          # ~18px
    weight: 400
    line-height: 1.6
  body:
    size: "1rem"              # ~16px
    weight: 400
    line-height: 1.55
  body-sm:
    size: "0.875rem"          # ~14px
    weight: 400
    line-height: 1.5
  label:
    size: "0.875rem"          # ~14px
    weight: 500
    line-height: 1.4
    letter-spacing: "0.01em"
  caption:
    size: "0.75rem"           # ~12px
    weight: 500
    line-height: 1.35
  numeric:
    feature: "tabular-nums"
    weight: 600

spacing:
  base: 8
  scale:
    "0": "0"
    "0.5": "0.125rem"          # 2px
    "1": "0.25rem"             # 4px
    "2": "0.5rem"              # 8px
    "3": "0.75rem"             # 12px
    "4": "1rem"                # 16px
    "5": "1.25rem"             # 20px
    "6": "1.5rem"              # 24px
    "8": "2rem"                # 32px
    "10": "2.5rem"             # 40px
    "12": "3rem"               # 48px
    "16": "4rem"               # 64px
    "20": "5rem"               # 80px
    "24": "6rem"               # 96px

radius:
  none: "0"
  sm: "0.375rem"              # 6px
  md: "0.5rem"                # 8px
  lg: "0.75rem"               # 12px
  xl: "1rem"                  # 16px
  "2xl": "1.25rem"            # 20px
  full: "9999px"

shadow:
  none: "none"
  xs: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
  sm: "0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)"
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)"
  lg: "0 10px 15px -3px rgba(1, 88, 254, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)"
  xl: "0 20px 25px -5px rgba(1, 88, 254, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)"
  nav: "0 10px 30px -10px rgba(0, 0, 0, 0.08)"
  focus: "0 0 0 3px rgba(1, 88, 254, 0.35)"

motion:
  duration-fast: "150ms"
  duration-base: "200ms"
  duration-slow: "300ms"
  duration-reveal: "600ms"
  easing-standard: "cubic-bezier(0.4, 0, 0.2, 1)"
  easing-emphasized: "cubic-bezier(0.2, 0, 0, 1)"
  reveal-distance: "24px"
  stagger-step: "80ms"
  marquee-speed: "36s"
  marquee-speed-slow: "45s"

breakpoints:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
  "2xl": "1536px"

layout:
  max-content-width: "1200px"
  navbar-floating-width: "780px"
  page-padding-x: "1.5rem"
  page-padding-y: "3rem"
  card-padding: "1.75rem"
  section-gap: "5rem"

# ============================================
# COMPONENT BEHAVIOR SPECS (PUBLIC SITE)
# ============================================
components:
  floating-navbar:
    bg: "#000000"
    backdrop: "blur(12px)"
    border: "1px solid rgba(255, 255, 255, 0.1)"
    radius: "{radius.full}"
    shadow: "0 16px 40px rgba(2, 8, 30, 0.35)"
    padding: "0.5rem 1.25rem"
    height: "56px"

  button-primary:
    bg: "{colors.primary}"
    text: "{colors.text-on-primary}"
    padding: "0.625rem 1.25rem"
    radius: "{radius.full}"
    weight: 500
    font-size: "{typography.body-sm.size}"
    hover-bg: "{colors.primary-hover}"
    focus-ring: "{shadow.focus}"
    shadow: "0 4px 14px rgba(1, 88, 254, 0.3)"
    disabled-opacity: 0.5

  button-dark:
    bg: "{colors.secondary}"
    text: "{colors.text-on-primary}"
    padding: "0.625rem 1.5rem"
    radius: "{radius.full}"
    weight: 500
    font-size: "{typography.body-sm.size}"
    hover-bg: "{colors.secondary-hover}"

  button-secondary:
    bg: "{colors.surface-2}"
    text: "{colors.text-primary}"
    border: "1px solid {colors.border-strong}"
    padding: "0.625rem 1.25rem"
    radius: "{radius.full}"
    hover-bg: "{colors.surface-hover}"

  badge-pill:
    bg: "{colors.primary-subtle}"
    text: "{colors.primary}"
    radius: "{radius.full}"
    padding: "0.25rem 0.75rem"
    font-size: "{typography.caption.size}"
    weight: 600

  card-feature:
    bg: "{colors.surface}"
    border: "1px solid {colors.border}"
    radius: "{radius.2xl}"
    padding: "{layout.card-padding}"
    hover-border: "{colors.border-strong}"

  card-pricing:
    bg: "{colors.surface-2}"
    border: "1px solid {colors.border}"
    radius: "{radius.2xl}"
    padding: "2rem"
    shadow: "{shadow.sm}"

  card-pricing-highlighted:
    bg: "{colors.surface-2}"
    border: "2px solid {colors.primary}"
    radius: "{radius.2xl}"
    padding: "2rem"
    shadow: "{shadow.lg}"

  image-tile:
    radius: "{radius.xl}"
    aspect-ratio: "4/5"
    border: "1px solid {colors.border}"

---

# 📖 OVERVIEW
Sistem antarmuka **LogoPulse** menggabungkan presisi minimalis modern (gaya Stripe & Linear) dengan aksen tipografi editorial (gaya Logomint & Softriver). Desain mengandalkan ruang negatif bersih, floating navbar bergaya kapsul, hierarki kartu bento yang menonjolkan visual karya logo secara tajam, serta admin panel berstandar industri berbasis **shadcn/ui**.

# 🎨 COLORS PHILOSOPHY
- **Primary (`#0158FE`) & Hover (`#2177FE`)** — Identitas utama LogoPulse. Berfungsi khusus untuk titik konversi tinggi (CTA tombol "View Pricing", tag rekomendasi paket terpopuler, interactive state, dan highlights).
- **Subtle / Lavender (`#E2E7F9`)** — Latar aksen lembut untuk badge, highlight baris, dan chip kategori agar kontras tetap harmonis tanpa menyilaukan.
- **Secondary / Dark (`#0A0A0A`)** — Elemen solid kontras tinggi untuk tombol aksi sekunder, headline utama, dan dark-mode accents.
- **Surface & Canvas** — Latar putih bersih (`#FFFFFF`) dipadukan dengan permukaan kartu netral (`#F8FAFC`) untuk menciptakan kedalaman bertingkat tanpa bayangan berat.

# 🔤 TYPOGRAPHY PHILOSOPHY
**Dua Elemen Tipografi Inti:**
- **Body & Display Utama**: Inter / Manrope untuk keterbacaan teknis, bobot tegas, dan netralitas modern.
- **Aksen Editorial Serif Italic**: Digunakan secara selektif pada frasa kunci headline display (contoh: "*your money back*" atau "*ready in 48 hours*") menggunakan font `Newsreader` atau `Playfair Display` untuk sentuhan humanis studio desain premium.
- **Angka Finansial & Fitur**: Selalu menggunakan `tabular-nums` untuk perataan vertikal harga paket pada pricing table.

# 📐 SPACING & LAYOUT PHILOSOPHY
- Mengadopsi sistem grid kelipatan 8px yang presisi.
- Kontainer dibatasi maksimal pada 1200px demi menjaga *reading line length* yang nyaman.
- Margin antar seksi dibuat lapang (80px–96px) guna memastikan setiap tahapan konversi memiliki ruang bernapas.

# 🟦 SHAPE & RADIUS PHILOSOPHY
- **Ladder Radius**: Badge/Pill/Button (`full` / 9999px) → Card Image (`xl` / 16px) → Card Feature/Pricing (`2xl` / 20px).
- Sudut membulat halus memberikan impresi ramah, bersahabat, namun tetap profesional.

# 🌫️ ELEVATION PHILOSOPHY
- Navigasi atas melayang menggunakan `backdrop-filter: blur(12px)` dipadukan dengan bayangan difus lembut (`shadow.nav`).
- Kartu informasi mengutamakan garis batas tipis (`1px solid border`) daripada drop shadow pekat.

# 🧩 COMPONENT BEHAVIOR RULES (PUBLIC LANDING PAGE)
- **Floating Bar (black)**: Pill hitam default. Entrance scale dari tengah saat load; scroll turun >140px = mengecil ke tengah (`scale .5`, origin-center) + fade hilang; scroll naik = muncul lagi. `prefers-reduced-motion` = selalu tampil.
- **Pricing Matrix**: Kartu paket rekomendasi (Professional) disorot menggunakan badge pill "Most Popular" dan border solid warna aksen biru `#0158FE`.
- **Checklist Fitur**: Tiap baris dilengkapi ikon centang pembeda fitur unggulan.
- **Marquee & Hover Crossfade**: Galeri mockup berganti visual logo saat pointer diarahkan (hover state).

# ✨ HOMEPAGE SECTION ANIMATIONS (WAJIB PER SECTION)
> Semua 12 section homepage publik WAJIB punya animasi. Implementasi: Astro = CSS + IntersectionObserver (`.reveal` + `.reveal-visible`), React islands = Framer Motion (`whileInView`). Hormati `prefers-reduced-motion: reduce` (matikan semua animasi).

| # | Section | Animasi Wajib | Detail Token |
|---|---------|---------------|--------------|
| 1 | **Navbar** | shrink-to-pill on scroll + nav-pill glide | `duration-base`, `easing-standard`, pill glide `200ms` |
| 2 | **Hero** | staggered fade-up + serif-italic reveal + glow drift + button shine sweep + badge dot pulse | headline `600ms`, stagger `80ms`, CTA scale-active `0.97` |
| 3 | **Client Logo Marquee** | infinite auto-scroll loop, pause on hover | `marquee-speed 30s linear infinite` |
| 4 | **Testimonial Highlight** | fade-up + quote-mark scale-in + avatar pop | `duration-reveal 600ms`, `easing-emphasized` |
| 5 | **Case Studies Preview** | stagger fade-up grid + hover crossfade mockup→logo + image zoom | hover `200ms`, crossfade `300ms` |
| 6 | **Portfolio Gallery** | stagger fade-up + filter fade/scale + hover lift + lightbox fade | filter `200ms`, hover `-4px lift`, `shadow-lg` |
| 7 | **How It Works** | stagger card slide-in + icon pop on inview | stagger `80ms` |
| 8 | **Pricing Table** | highlighted card lift + badge pop + toggle scale + checklist stagger | highlight `translateY(-8px)`, `shadow-lg`, toggle `150ms` |
| 9 | **Testimonials / Reviews** | masonry stagger fade-up + star pop + hover lift | stagger `80ms`, star scale `200ms` |
| 10 | **FAQ** | accordion height-expand + chevron rotate + fade-in answer | expand `300ms`, `easing-standard` |
| 11 | **CTA Banner** | static gradient + button hover brighten + section scale-in (tanpa animasi background-position infinite — memicu repaint) | gradient statis, scale-in `600ms` |
| 12 | **Footer** | fade-in + link underline-slide on hover | `duration-base`, underline `200ms` |

# ⚙️ ADMIN PANEL INTEGRATION (shadcn/ui)
Seluruh antarmuka **Admin Panel** dibangun menggunakan library komponen **[shadcn/ui](https://ui.shadcn.com/)** (React + Radix UI + Tailwind CSS):

1. **Mapping Tema Warna shadcn/ui ke LogoPulse:**
   ```css
   :root {
     --background: 0 0% 100%;
     --foreground: 222.2 84% 4.9%;
     --primary: 221 99% 50%;         /* #0158FE (LogoPulse Blue) */
     --primary-foreground: 210 40% 98%;
     --secondary: 210 40% 96.1%;
     --secondary-foreground: 222.2 47.4% 11.2%;
     --muted: 210 40% 96.1%;
     --muted-foreground: 215.4 16.3% 46.9%;
     --accent: 226 70% 93%;           /* #E2E7F9 (LogoPulse Subtle Lavender) */
     --accent-foreground: 221 99% 50%;
     --destructive: 0 84.2% 60.2%;
     --border: 214.3 31.8% 91.4%;
     --radius: 0.75rem;
   }
   ```

2. **Daftar Komponen shadcn/ui yang Digunakan:**
   - **Table & DataTable** (`@/components/ui/table`): Manajemen list pesanan (Orders), item portfolio, dan artikel blog.
   - **Dialog & Sheet** (`@/components/ui/dialog`, `@/components/ui/sheet`): Modal detail order, preview case study, dan quick-edit drawer.
   - **Form, Input, Textarea, Select** (`@/components/ui/form` via React Hook Form + Zod): Formulir brief, upload hasil desain, dan update status.
   - **Badge** (`@/components/ui/badge`): Status indikator order (`pending` = amber, `paid` = blue, `in_progress` = violet, `completed` = green).
   - **Card** (`@/components/ui/card`): Ringkasan metrik dashboard (Total Revenue, Pending Orders, Conversion).
   - **Tabs** (`@/components/ui/tabs`): Pemisah tab pada pengaturan dan navigasi modul.
   - **DropdownMenu** (`@/components/ui/dropdown-menu`): Aksi baris tabel (Ubah Status, Download Deliverables, Hapus).
   - **Sonner / Toast** (`@/components/ui/sonner`): Feedback notifikasi sukses upload WebP, simpan data, atau error.

# 🌍 LANGUAGE RULES (EN/ID)
- Setiap teks baru yang tampil ke pengunjung WAJIB masuk kamus `src/i18n/ui.ts` (en + id) dan dipasang via `data-i18n` / `data-i18n-ph` / `data-l`.
- Jangan menaruh kalimat hardcoded tanpa key kamus di halaman publik.
- Pesan dinamis (validasi, template WA) wajib membaca bahasa aktif (`__lpGetLang` + `__lpT`).

# 🚫 RULES TO NEVER BREAK
- Jangan menambahkan bayangan hitam pekat (*hard drop shadow*).
- Jangan menggunakan background gradasi berwarna-warni mencolok pada kanvas utama.
- Jangan menghilangkan aksen font italic serif pada headline utama landing page.
- Selalu gunakan border hairline tipis untuk membingkai elemen kartu.
- Untuk Admin Panel, selalu gunakan komponen resmi dari **shadcn/ui** untuk konsistensi aksesibilitas (WAI-ARIA).

# ✅ RULES TO ALWAYS FOLLOW
- Ring fokus interaktif harus selalu terlihat jelas (`{shadow.focus}`).
- Teks headline harus mematuhi rasio kontras WCAG AAA.
- Semua tombol navigasi dan CTA utama di landing page wajib mempertahankan bentuk kapsul (*pill shape*).
- Semua gambar raster yang diunggah melalui komponen upload admin panel wajib dikonversi ke WebP melalui backend Go.
- Setiap section homepage (12 section) wajib punya animasi sesuai tabel HOMEPAGE SECTION ANIMATIONS — tidak boleh ada section statis.
- Semua animasi scroll-reveal wajib non-blocking (IntersectionObserver, replay: class dicabut saat keluar viewport agar animasi main lagi tiap masuk) dan dimatikan saat `prefers-reduced-motion: reduce`.