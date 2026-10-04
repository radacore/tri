# Product Requirements Document (PRD)

## Aplikasi Web — Jasa Desain Logo & Brand Identity

---

> **Nama Proyek**: LogoPulse
> **Versi Dokumen**: 1.0
> **Tanggal**: 30 September 2026
> **Status**: Draft

---

## 1. Ringkasan Eksekutif

Membangun **LogoPulse** — sebuah **aplikasi web profesional** untuk jasa desain logo dan brand identity yang menawarkan layanan desain berkualitas tinggi dengan proses yang cepat, transparan, dan terjangkau. Aplikasi ini terinspirasi dari dua platform referensi:

| Referensi | Fokus Utama |
|-----------|-------------|
| [Softriver.co](https://www.softriver.co/) | Layanan desain logo profesional dengan pendekatan agensi — desain custom, proses terstruktur, portofolio yang kuat |
| [Logomint.co](https://www.logomint.co/) | Logo & brand identity dalam 48 jam, harga transparan mulai €129, garansi uang kembali, rating 4.9/5 dari 500+ pelanggan |

**Nilai Utama yang Diambil**:
- Kecepatan pengerjaan (turnaround 48 jam)
- Harga transparan dengan tier pricing yang jelas
- Portofolio & case study yang kuat sebagai social proof
- Proses pemesanan yang mudah dan self-service
- Garansi kepuasan pelanggan

---

## 2. Tujuan & Sasaran

### 2.1 Tujuan Bisnis
- Membangun platform online untuk menawarkan jasa desain logo & brand identity
- Mengakuisisi pelanggan secara organik melalui SEO dan portofolio yang menarik
- Menyediakan pengalaman pemesanan yang seamless dari browsing hingga checkout
- Membangun kepercayaan melalui social proof (testimonial, rating, case study)

### 2.2 Sasaran Terukur (KPI)
| KPI | Target (6 Bulan Pertama) |
|-----|--------------------------|
| Pengunjung bulanan | 5.000+ |
| Conversion rate (visitor → order) | 3-5% |
| Rating pelanggan | ≥ 4.8/5 |
| Waktu pengerjaan rata-rata | ≤ 48 jam |
| Repeat customer rate | ≥ 20% |

---

## 3. Target Pengguna

### 3.1 Persona Utama

**Persona 1: Startup Founder**
- Usia: 25-40 tahun
- Kebutuhan: Logo dan brand identity untuk startup baru
- Pain point: Budget terbatas, butuh cepat, tidak tahu harus mulai dari mana
- Goal: Mendapatkan identitas brand profesional tanpa harus menyewa agensi mahal

**Persona 2: UMKM / Small Business Owner**
- Usia: 30-50 tahun
- Kebutuhan: Rebranding atau pembuatan logo pertama
- Pain point: Tidak puas dengan logo yang dibuat sendiri/template
- Goal: Tampil lebih profesional dan terpercaya di mata pelanggan

**Persona 3: Freelancer / Personal Brand**
- Usia: 22-35 tahun
- Kebutuhan: Personal branding yang kuat
- Pain point: Ingin terlihat profesional tapi budget terbatas
- Goal: Memiliki visual identity yang konsisten di semua platform

---

## 4. Arsitektur Halaman & Fitur

### 4.1 Sitemap

```
/                          → Landing Page (Home)
├── /#portfolio            → Seksi Portofolio (anchor)
├── /#how-it-works         → Seksi Cara Kerja (anchor)
├── /#pricing              → Seksi Harga (anchor)
├── /#testimonials         → Seksi Testimonial (anchor)
├── /#faq                  → Seksi FAQ (anchor)
│
├── /case-studies           → Halaman Daftar Case Study
│   └── /case-studies/:slug → Detail Case Study
│
├── /blog                   → Halaman Blog / Artikel
│   └── /blog/:slug         → Detail Artikel
│
├── /contact                → Halaman Kontak
├── /about                  → Halaman Tentang Kami
│
├── /order                  → Form Pemesanan / Brief (kirim via WhatsApp / Email, tanpa payment gateway)
│
├── /admin                  → Dashboard Admin (protected)
│   ├── /admin/orders       → Kelola Pesanan
│   ├── /admin/portfolio    → Kelola Portfolio
│   ├── /admin/case-studies → Kelola Case Studies
│   ├── /admin/blog         → Kelola Blog / Artikel
│   ├── /admin/testimonials → Kelola Testimonial
│   ├── /admin/clients      → Kelola Logo Klien
│   ├── /admin/identity     → Identitas Website (hero, sections, pricing, FAQ, media, footer)
│   ├── /admin/settings     → Pengaturan Website
│   └── /admin/login        → Login Admin
│
├── /api/v1                 → REST API (Go + chi)
│   ├── /api/v1/orders      → CRUD Orders
│   ├── /api/v1/portfolio   → CRUD Portfolio
│   ├── /api/v1/case-studies→ CRUD Case Studies
│   ├── /api/v1/blog        → CRUD Blog Posts
│   ├── /api/v1/testimonials→ CRUD Testimonials
│   ├── /api/v1/upload      → File Upload (auto-convert ke WebP)
│   ├── /api/v1/auth        → Authentication
│
├── /terms                  → Syarat & Ketentuan
├── /privacy                → Kebijakan Privasi
└── /sitemap.xml            → Sitemap untuk SEO
```

---

### 4.2 Detail Halaman & Komponen

#### 4.2.1 Landing Page (`/`)

Landing page adalah halaman utama yang menjadi pusat konversi. Didesain sebagai **single-page experience** dengan anchor navigation.

**Seksi-seksi (dari atas ke bawah):**

| # | Seksi | Deskripsi | Animasi Wajib | Referensi |
|---|-------|-----------|---------------|-----------|
| 1 | **Navbar** | Pill hitam default, navigasi (Portfolio, Case Studies, How it Works, Pricing, Blog), tombol CTA "View Pricing". Scroll turun = mengecil ke tengah + hilang; scroll naik = muncul. | entrance scale + scroll scale-hide | Logomint |
| 2 | **Hero** | Headline besar + subheadline, rating badge (★ 4.9 by 500+ customers), 2 tombol CTA (View Pricing + Book a Call), marquee carousel portfolio images | staggered fade-up + glow drift + shine sweep + dot pulse | Logomint |
| 3 | **Client Logo Marquee** | Carousel horizontal otomatis menampilkan logo klien terdahulu | infinite auto-scroll, pause on hover | Logomint |
| 4 | **Testimonial Highlight** | Quote besar dari klien unggulan dengan foto dan jabatan | fade-up + quote-mark scale-in | Logomint |
| 5 | **Case Studies Preview** | Grid 4 kolom dengan hover effect (mockup → logo crossfade), judul, dan deskripsi singkat. Link "More Case Studies" | stagger fade-up + hover crossfade + zoom | Logomint |
| 6 | **Portfolio Gallery** | Grid/masonry galeri karya-karya desain logo. Filterable by kategori (Tech, F&B, Fashion, dll.) | stagger fade-up + filter fade/scale + hover lift | Softriver |
| 7 | **How It Works** | 3-4 langkah proses pemesanan dengan ikon/ilustrasi dan deskripsi singkat | stepper line-draw + stagger slide-in | Kedua |
| 8 | **Pricing Table** | 3 tier paket harga dengan perbandingan fitur, tombol CTA per paket | highlight lift + badge pop + checklist stagger | Kedua |
| 9 | **Testimonials / Reviews** | Hanging marquee testimoni (kartu digantung tali + tilt, jalan infinite) dengan rating, foto, dan nama | hanging-scroll 55s + hover straighten | Kedua |
| 10 | **FAQ** | Accordion FAQ yang menjawab pertanyaan umum | height-expand + chevron rotate | Kedua |
| 11 | **CTA Banner** | Banner besar untuk konversi akhir — "Ready to get started?" | static gradient + scale-in + hover brighten (tanpa infinite repaint) | Kedua |
| 12 | **Footer** | Logo, navigasi, social media links, copyright, legal links | fade-in + link underline-slide | Kedua |

> [!IMPORTANT]
> Tidak ada section statis — semua 12 section wajib punya animasi sesuai kolom di atas.
> Detail token & durasi lihat `design.md` → HOMEPAGE SECTION ANIMATIONS. Hormati `prefers-reduced-motion`.

---

#### 4.2.2 Case Studies (`/case-studies`)

**Halaman Daftar:**
- Grid layout (2-4 kolom responsive)
- Setiap card menampilkan: thumbnail mockup, nama brand, deskripsi 1 baris
- Hover effect: crossfade dari mockup ke logo
- Filter by industri (opsional)

**Halaman Detail (`/case-studies/:slug`):**
- Hero image besar (brand mockup)
- Informasi proyek: Nama brand, industri, tahun, deliverables
- Brief / latar belakang proyek
- Proses desain (concept → exploration → final)
- Galeri gambar full-width (logo variations, color palette, typography, mockups)
- Testimonial klien
- CTA navigasi ke case study berikutnya / halaman pricing

---

#### 4.2.3 Blog (`/blog`)

- Grid artikel dengan thumbnail, judul, tanggal, estimasi waktu baca
- Kategori: Branding Tips, Logo Design, Case Study, Industry Insights
- Pencarian artikel
- Read tracking (chip "Read" pada artikel yang sudah dibaca — localStorage)

---

#### 4.2.4 Halaman Booking — DITIADAKAN (untuk sekarang)

Fitur booking konsultasi (Cal.com/Calendly) dan tombol "Book a Call" **dinonaktifkan sementara**.
CTA sekunder diganti: Hero → "See Our Work", CTA Banner → "Browse Case Studies".

---

#### 4.2.5 Form Pemesanan (`/order`)

**Step 1 — Micro-Brief (pengganti discovery call):**
- Nama (nama kamu), nama perusahaan/brand, industri, target pasar, kontak (email/WA)
- Vibe kata kunci — chip multi-pilih, maksimal 3 (Minimalis, Berani, Elegan, Playful, Klasik, Futuristis, Mewah, Organik)
- Referensi warna — chip multi-pilih (7 warna + custom color picker)
- Referensi / yang dihindari (textarea singkat)
- Deskripsi bisnis (textarea)
- Target audience
- Preferensi gaya (modern, classic, playful, elegant, dll.) — multi-select
- Warna yang disukai (color picker / predefined palette)
- Referensi logo / brand yang disukai (URL / upload)
- Paket yang dipilih (auto-filled jika dari pricing)

**Step 2 — Review & Kirim (tanpa payment gateway):**
- Ringkasan brief (nama, perusahaan, paket + harga, industri, kontak, keinginan)
- Tombol **"Kirim via WhatsApp"** → buka `wa.me/{NOMOR_BISNIS}?text=...` dengan pesan terformat:
  ```
  Halo LogoPulse! Saya mau order logo:

  • Nama: ...
  • Perusahaan: ...
  • Paket: Professional ($149)
  • Industri: ...
  • Kontak: ...
  • Keinginan: ...
  ```
- Tombol **"Kirim via Email"** → `mailto:` dengan subject/body yang sama
- Order juga disimpan ke backend (best-effort `POST /orders`) untuk rekap admin
- Nomor WA (`6281241525485`, override via env `PUBLIC_WA_NUMBER`) & email tujuan (env `PUBLIC_ORDER_EMAIL`)

**Step 3 — Konfirmasi:**
- Halaman terima kasih
- Estimasi waktu pengerjaan
- Link ke dashboard tracking (opsional di MVP)

---

#### 4.2.6 Admin Panel (`/admin`) — Protected

Admin panel adalah SPA (Single Page Application) terpisah yang berkomunikasi dengan backend Go + chi via REST API. Dilindungi oleh JWT authentication.

**Login (`/admin/login`):**
- Form email + password
- JWT token disimpan di httpOnly cookie
- Rate limiting untuk brute-force protection

**Dashboard (`/admin`):**
- Ringkasan statistik: total orders, revenue bulan ini, orders pending, pelanggan baru
- Grafik revenue bulanan (line chart)
- Grafik orders per status (bar chart)
- Daftar 5 order terbaru
- Quick actions: tambah portfolio, tulis artikel, lihat pending orders

**Kelola Pesanan (`/admin/orders`):**
| Kolom | Deskripsi |
|-------|-----------|
| ID | Order ID unik |
| Pelanggan | Nama, email |
| Paket | Starter / Professional / Premium |
| Status | `pending` → `paid` → `in_progress` → `revision` → `completed` → `delivered` |
| Tanggal | Tanggal order |
| Total | Jumlah pembayaran |
| Aksi | Lihat detail, update status, upload deliverables, kirim email |

- Filter by status, tanggal, paket
- Search by nama pelanggan / email
- Detail order: brief lengkap, riwayat status, file deliverables
- Upload hasil desain (drag & drop)
- Kirim notifikasi email ke pelanggan saat status berubah

**Upload Pipeline (Semua Modul):**
> [!NOTE]
> Semua gambar yang di-upload via Admin Panel (Portfolio, Case Study, Blog, Testimonial, Client Logos) akan **otomatis di-convert ke format `.webp`** oleh backend Go dengan optimasi ukuran dan kualitas (~80-85%) sebelum disimpan ke disk server. Format SVG tetap dipertahankan sebagai vektor.

**Kelola Portfolio (`/admin/portfolio`):**
- CRUD item portfolio (judul, kategori, gambar, deskripsi, featured flag)
- Upload multiple images (drag & drop, auto-convert ke WebP)
- Reorder items (drag to sort)
- Toggle visibility (published/draft)

**Kelola Case Studies (`/admin/case-studies`):**
- CRUD case study (judul, slug, industri, konten rich-text/markdown)
- Upload hero image + gallery images
- Toggle published/draft
- Preview sebelum publish

**Kelola Blog (`/admin/blog`):**
- CRUD artikel (judul, slug, konten markdown, kategori, thumbnail)
- Markdown editor dengan preview
- Upload gambar dalam artikel
- SEO fields (meta title, meta description)
- Toggle published/draft
- Jadwal publish (scheduled publishing)

**Kelola Testimonial (`/admin/testimonials`):**
- CRUD testimonial (nama, jabatan, perusahaan, foto, quote, rating)
- Toggle featured (untuk tampil di homepage)
- Toggle visibility

**Kelola Logo Klien (`/admin/clients`):**
- CRUD logo klien untuk marquee carousel
- Upload SVG/PNG logo
- Reorder (drag to sort)

**Kelola Kategori (`/admin/categories`):**
- CRUD kategori portfolio (nama, slug, urutan) + jumlah item per kategori
- Rename kategori memindahkan semua item otomatis (tanpa yatim)
- Hapus kategori berisi item wajib pindahkan dulu (`?reassign=`)
- Filter portfolio di landing + halaman `/portfolio` membaca daftar ini (dinamis)

**Identitas Website (`/admin/identity`):**
- Tab Hero / Sections / Pricing & FAQ / Media / Footer & Socials — semua teks & gambar landing
- disimpan per-key (`hero`, `sections`, `pricing`, `faqs`, `how_steps`, `media`, `footer`), landing override saat load, API mati = fallback bawaan

**Pengaturan (`/admin/settings`):**
- Ubah harga paket
- Update teks hero, FAQ, dll.
- Ganti password admin
- Konfigurasi email notification templates

---

## 5. Pricing Tiers

| Fitur | 🥉 Starter | 🥈 Professional | 🥇 Premium |
|-------|-----------|----------------|---------|
| **Harga (USD)** | $49 | $149 | $399 |
| Konsep logo | 2 konsep | 4 konsep | 6 konsep |
| Revisi | 2 revisi | Unlimited revisi | Unlimited revisi |
| Waktu pengerjaan | 5 hari | 3 hari | 48 jam |
| File format | PNG, JPG | PNG, JPG, SVG, PDF | PNG, JPG, SVG, PDF, AI |
| Brand guideline | ❌ | ✅ Basic | ✅ Lengkap |
| Business card design | ❌ | ❌ | ✅ |
| Social media kit | ❌ | ❌ | ✅ |
| Favicon & app icon | ❌ | ✅ | ✅ |
| Sertifikat kepemilikan | ✅ | ✅ | ✅ |
| Garansi uang kembali | ✅ 100% | ✅ 100% | ✅ 100% |

> [!NOTE]
> Harga dalam **USD**. Tier Professional ($149) diposisikan sejajar entry price Logomint (~€129).
> Tidak ada payment gateway — pembayaran diatur manual setelah brief masuk via WhatsApp/email.

---

## 6. Tech Stack

### 6.1 Frontend (Public Website)
| Teknologi | Alasan |
|-----------|--------|
| **Astro** | Static-site generator yang cepat, SEO-friendly, dan mendukung island architecture. Logomint menggunakannya. |
| **React** (Islands) | Untuk komponen interaktif (pricing toggle, form wizard, carousel) |
| **Tailwind CSS** | Utility-first CSS framework untuk styling cepat dan konsisten |
| **Framer Motion** | Animasi smooth (scroll reveal, hover effects, page transitions) |

### 6.2 Frontend (Admin Panel)
| Teknologi | Alasan |
|-----------|--------|
| **React 18+** | SPA untuk admin dashboard, interaktivitas tinggi |
| **[shadcn/ui](https://ui.shadcn.com/)** | Komponen UI modern berbasis Radix UI & Tailwind CSS (DataTable, Dialog, Form, Badge, Tabs, dll.) |
| **React Router** | Client-side routing untuk navigasi admin |
| **Tailwind CSS** | Konsisten dengan public website |
| **TanStack Query** | Data fetching, caching, dan server state management |
| **React Hook Form** + **Zod** | Form management & validasi schema untuk CRUD operations |
| **Recharts** / **Chart.js** | Visualisasi data (order stats, revenue chart) |

### 6.3 Backend — Go + chi
| Teknologi | Alasan |
|-----------|--------|
| **Go 1.22+** | Bahasa backend yang cepat, typed, dan concurrent |
| **[go-chi/chi](https://github.com/go-chi/chi)** v5 | Lightweight, idiomatic, composable HTTP router untuk Go. 100% kompatibel dengan `net/http`. Mendukung middleware chaining, URL params, dan sub-routing. |
| **PostgreSQL** | Database relasional utama untuk orders, users, content |
| **pgx** | PostgreSQL driver untuk Go (high-performance, pure Go) |
| **golang-migrate** | Database migration tool |
| **golang-jwt/jwt** | JWT authentication untuk admin panel |
| **Local disk** (Docker volume) | Upload gambar disimpan di VPS, di-serve langsung via Nginx |
| **Image Processing (WebP)** | `github.com/chai2010/webp` / `golang.org/x/image` — Otomatis decode gambar upload (PNG, JPG, dll.) dan encode/convert ke format WebP (quality 80-85%) sebelum disimpan |
| **gomail** / **Resend API** | Email transactional (konfirmasi order, notifikasi) |

### 6.4 Deployment & Infra (Single VPS)

Seluruh aplikasi di-deploy ke **satu VPS** menggunakan Docker Compose.

| Teknologi | Alasan |
|-----------|--------|
| **VPS** (Ubuntu 22.04+) | Server utama — semua service berjalan di sini |
| **Docker + Docker Compose** | Orkestrasi semua container (Go API, PostgreSQL, Nginx) |
| **Nginx** (reverse proxy) | Serve static files (Astro + Admin build), reverse proxy ke Go API, SSL termination |
| **Let's Encrypt** (Certbot) | SSL/TLS certificate gratis, auto-renew |
| **PostgreSQL** (container) | Database, di-mount ke volume persistent |
| **Cloudflare** | DNS management + CDN (opsional, gratis) |
| **Google Analytics 4** | Web analytics |
| **GitHub Actions** | CI/CD — build & deploy otomatis ke VPS via SSH |

**Arsitektur di VPS:**

```
┌─────────────────────────────────────────────────────┐
│  VPS (Ubuntu)                                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  Docker Compose                               │  │
│  │                                               │  │
│  │  ┌─────────┐    ┌──────────┐   ┌──────────┐  │  │
│  │  │  Nginx   │───▶│  Go API  │──▶│PostgreSQL│  │  │
│  │  │  :80/443 │    │  :8080   │   │  :5432   │  │  │
│  │  └─────────┘    └──────────┘   └──────────┘  │  │
│  │       │                                       │  │
│  │       ├── /           → Astro static files    │  │
│  │       ├── /admin/     → React SPA static      │  │
│  │       ├── /api/v1/    → proxy ke Go :8080     │  │
│  │       └── /uploads/   → file gambar           │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  volumes/                                           │
│  ├── pg_data/      (PostgreSQL persistent data)     │
│  ├── uploads/      (uploaded images)                │
│  └── certs/        (SSL certificates)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Docker Compose Services:**

```yaml
# docker-compose.yml (preview)
services:
  db:
    image: postgres:16-alpine
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: logopulse
      POSTGRES_USER: logopulse
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    restart: unless-stopped

  api:
    build: ./backend
    depends_on: [db]
    environment:
      DATABASE_URL: postgres://logopulse:${DB_PASSWORD}@db:5432/logopulse?sslmode=disable
      JWT_SECRET: ${JWT_SECRET}
      UPLOAD_DIR: /app/uploads
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./frontend/dist:/usr/share/nginx/html          # Astro build
      - ./admin/dist:/usr/share/nginx/html/admin        # React build
      - uploads:/usr/share/nginx/uploads                # Uploaded images
      - certs:/etc/letsencrypt
    depends_on: [api]
    restart: unless-stopped

volumes:
  pg_data:
  uploads:
  certs:
```

### 6.5 API Architecture (chi Router)

```go
// Contoh struktur routing dengan chi
r := chi.NewRouter()

// Global middleware
r.Use(middleware.Logger)
r.Use(middleware.Recoverer)
r.Use(middleware.RealIP)
r.Use(cors.Handler(cors.Options{...}))

// Public API routes
r.Route("/api/v1", func(r chi.Router) {
    // Orders (public — buat pesanan baru)
    r.Post("/orders", handlers.CreateOrder)
    r.Get("/orders/{id}/status", handlers.GetOrderStatus)
    
    // Content (public — read only)
    r.Get("/portfolio", handlers.ListPortfolio)
    r.Get("/case-studies", handlers.ListCaseStudies)
    r.Get("/case-studies/{slug}", handlers.GetCaseStudy)
    r.Get("/blog", handlers.ListBlogPosts)
    r.Get("/blog/{slug}", handlers.GetBlogPost)
    r.Get("/testimonials", handlers.ListTestimonials)
    
    // Auth
    r.Post("/auth/login", handlers.Login)
    
    // Protected admin routes
    r.Group(func(r chi.Router) {
        r.Use(middleware.JWTAuth)  // JWT middleware
        
        // Dashboard
        r.Get("/admin/dashboard", handlers.GetDashboardStats)
        
        // CRUD Orders
        r.Get("/admin/orders", handlers.AdminListOrders)
        r.Put("/admin/orders/{id}", handlers.AdminUpdateOrder)
        r.Delete("/admin/orders/{id}", handlers.AdminDeleteOrder)
        
        // CRUD Portfolio
        r.Post("/admin/portfolio", handlers.CreatePortfolio)
        r.Put("/admin/portfolio/{id}", handlers.UpdatePortfolio)
        r.Delete("/admin/portfolio/{id}", handlers.DeletePortfolio)
        
        // CRUD Case Studies, Blog, Testimonials...
        // (pola serupa)
        
        // File upload
        r.Post("/admin/upload", handlers.UploadFile)
    })
})
```

### 6.6 Alur Upload & Auto-Convert ke WebP

Setiap gambar yang diunggah melalui backend Go (baik via Admin Panel atau brief form) akan melalui alur konversi otomatis sebelum disimpan ke volume penyimpanan lokal:

```
[Klien / Admin] 
      │ (Multipart Form Upload: .png, .jpg, .jpeg, .webp)
      ▼
[Go Backend Handler: /api/v1/admin/upload]
      │ 
      ├─ 1. Validasi: MIME type (image/*) & Max size (maks. 10MB)
      ├─ 2. Decode: image.Decode() membaca byte gambar asli
      ├─ 3. Resizing (Adaptive): Downscale bila dimensi melebihi batas (maks. lebar 2560px)
      ├─ 4. Convert ke WebP: webp.Encode() dengan quality factor 80-85% (Lossy compression)
      │     (Catatan: format .svg diabaikan dari konversi agar tetap berupa vektor murni)
      ├─ 5. Simpan ke Disk: Simpan file ke volume `/app/uploads/{uuid}.webp`
      ▼
[Response JSON]
      {
        "url": "/uploads/550e8400-e29b-41d4-a716-446655440000.webp",
        "format": "webp",
        "width": 1200,
        "height": 800,
        "size_kb": 142
      }
      │
      ▼
[Nginx Web Server]
      Serve `/uploads/*.webp` secara langsung dengan static caching header:
      `Cache-Control: public, max-age=31536000, immutable`
```

**Keuntungan Konversi WebP Otomatis:**
- **Kompresi Efisien**: Ukuran file berkurang **30% hingga 70%** dibanding PNG/JPEG asli tanpa penurunan kualitas visual yang berarti.
- **Performa & Skor Core Web Vitals**: Mengurangi Largest Contentful Paint (LCP) pada galeri portfolio, hero carousel, dan detail case study.
- **Konsistensi Format**: Semua aset visual raster di database tersimpan seragam dengan ekstensi `.webp`.

---

## 7. Desain & UI/UX

### 7.1 Design System

**Warna:**
```
Primary:          #0158FE  (biru utama — warna dominan brand)
Primary Hover:    #2177FE  (biru lebih terang — untuk hover states)
White:            #FFFFFF  (putih)
Light/Lavender:   #E2E7F9  (lavender terang — background sekunder, card, border)
Text Dark:        #111111  (hitam — untuk heading dan body text)
Text Subtle:      #71717B  (abu-abu — untuk paragraf sekunder)
Dark Background:  #0A0A0A  (hitam pekat — untuk seksi gelap/dark sections)

Gradient 1:       linear-gradient(135deg, #0158FE, #2177FE)
                  → Untuk tombol CTA utama, hero accent
Gradient 2:       linear-gradient(135deg, #013A9E, #0158FE)
                  → Untuk seksi gelap, footer, banner
```

**Tipografi:**
```
Heading:  Neue Montreal (sans-serif, modern, clean)
          atau Inter / Plus Jakarta Sans
Body:     Manrope (sans-serif, readable)
          atau Inter
```

**Border Radius:**
```
Large:   1.75rem (28px) — tombol utama
Medium:  0.625rem (10px) — card, image container
Small:   0px — elemen kecil
```

### 7.2 Prinsip Desain
1. **Clean & Minimal** — Biarkan karya desain yang berbicara
2. **High Contrast** — Teks gelap di background putih untuk readability
3. **Generous Whitespace** — Ruang yang cukup antar seksi
4. **Smooth Animations** — Scroll reveal, hover effects, page transitions
5. **Mobile-First** — Responsive design mulai dari 320px
6. **Fast Loading** — Target LCP < 2.5s, CLS < 0.1

### 7.3 Komponen UI Kunci

| Komponen | Deskripsi |
|----------|-----------|
| **Floating Navbar** | Navbar yang berubah jadi frosted glass pill saat scroll |
| **Marquee Carousel** | Horizontal scrolling otomatis untuk portfolio dan client logos |
| **Case Study Card** | Card dengan hover crossfade effect (mockup ↔ logo) |
| **Pricing Card** | Card dengan highlight untuk paket recommended |
| **Testimonial Card** | Card dengan foto, nama, jabatan, rating stars, dan quote |
| **FAQ Accordion** | Expandable accordion untuk FAQ |
| **Brief Form Wizard** | Multi-step form untuk pengisian brief desain |
| **CTA Button** | Primary (filled, gradient blue, shadow) dan Secondary (outlined/ghost) |
| **Rating Badge** | Badge dengan 5 stars + teks "Rated X.X by N+ customers" |

---

## 8. SEO & Marketing

### 8.1 SEO On-Page
- Structured data (JSON-LD) untuk Organization dan WebSite
- Open Graph dan Twitter Card meta tags di setiap halaman
- Sitemap XML otomatis
- Canonical URLs
- Alt text di semua gambar
- Semantic HTML (h1, h2, h3, article, section, figure, figcaption)

### 8.2 Performance
- **Server-side WebP Conversion**: Semua gambar yang diunggah dikonversi otomatis ke format `.webp` (kualitas 80-85%, reduksi ukuran 30-70%)
- **Image Optimization**: srcset responsive, lazy loading native (`loading="lazy"`), SVG murni untuk logo vektor
- **Nginx Caching**: Header immutable cache (`max-age=31536000`) untuk direktori `/uploads/`
- Font preloading dan subsetting
- Critical CSS inlining
- Edge caching via Cloudflare CDN (opsional)

### 8.3 Konten Marketing
- Blog artikel tentang branding, logo design tips, case study narasi
- Social media integration (Instagram, Dribbble, Behance)
- Email newsletter (opsional)

---

## 9. Milestone & Timeline

### Phase 1 — Frontend MVP (Minggu 1-4)
- [ ] Setup project Astro + Tailwind CSS
- [ ] Landing page dengan semua seksi, masing-masing wajib beranimasi (lihat 4.2.1)
- [ ] Navbar dengan floating frosted-glass effect + shrink-to-pill on scroll
- [ ] Hero section + marquee carousel + staggered fade-up
- [ ] Pricing section + highlight lift + badge pop
- [ ] Portfolio gallery (static data awal) + filter fade/scale + hover lift
- [ ] Testimonial section + stagger fade-up + star pop
- [ ] FAQ accordion + height-expand + chevron rotate
- [ ] CTA banner + gradient shift + scale-in
- [ ] Footer + fade-in
- [ ] Scroll-reveal system (IntersectionObserver replay + support `prefers-reduced-motion`)
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] SEO basics (meta tags, sitemap, structured data)

### Phase 2 — Backend Foundation (Minggu 5-7)
- [ ] Setup project Go + chi router
- [ ] Struktur project (cmd, internal, handlers, models, middleware)
- [ ] PostgreSQL schema & migrations (golang-migrate)
- [ ] REST API — CRUD Portfolio, Case Studies, Blog, Testimonials
- [ ] File upload endpoint dengan auto-convert ke WebP & kompresi (penyimpanan volume lokal)
- [ ] JWT authentication (login, middleware, refresh token)
- [ ] Order API (create, read, update status) — tanpa payment, brief dikirim via WA/email
- [ ] Email notification service (Resend)
- [ ] CORS configuration untuk frontend
- [ ] Docker setup (Dockerfile, docker-compose untuk dev)

### Phase 3 — Admin Panel (Minggu 8-10)
- [ ] Setup React SPA untuk admin
- [ ] Login page + auth flow (JWT)
- [ ] Dashboard (statistik, grafik, recent orders)
- [ ] Kelola Pesanan (list, detail, update status, upload deliverables)
- [ ] Kelola Portfolio (CRUD, image upload, reorder)
- [ ] Kelola Case Studies (CRUD, markdown editor, gallery)
- [ ] Kelola Blog (CRUD, markdown editor + preview, scheduled publish)
- [ ] Kelola Testimonial (CRUD, toggle featured)
- [ ] Kelola Logo Klien (CRUD, reorder)
- [ ] Pengaturan (harga, teks, password)

### Phase 4 — Frontend Integration (Minggu 11-12)
- [ ] Hubungkan Astro frontend ke Go API (fetch data dinamis)
- [ ] Brief form wizard (multi-step) + kirim via WhatsApp/Email (tanpa payment)
- [ ] Order confirmation page
- [ ] Case studies listing & detail page (data dari API)
- [ ] Blog listing & detail page (data dari API)
- [ ] Booking page (Cal.com embed)
- [ ] Content dari admin tercermin di public site

### Phase 5 — Polish & Launch (Minggu 13-14)
- [ ] Verifikasi 12/12 section homepage beranimasi (audit per tabel 4.2.1 + design.md)
- [ ] Page transitions
- [ ] Performance optimization (Lighthouse score ≥ 90)
- [ ] Cross-browser testing
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Setup VPS (Ubuntu, Docker, Docker Compose)
- [ ] Konfigurasi Nginx (reverse proxy, SSL Let's Encrypt)
- [ ] Deploy semua service via `docker-compose up -d`
- [ ] Setup GitHub Actions CI/CD (auto deploy on push)
- [ ] Final content review
- [ ] Launch! 🚀

### Phase 6 — Post-Launch (Ongoing)
- [ ] Dashboard klien (tracking status order)
- [ ] A/B testing (CTA, pricing, headline)
- [ ] Review/rating system publik
- [ ] Referral program
- [ ] Multi-admin support (role-based access)

---

## 10. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Konten portofolio belum cukup | Rendahnya kepercayaan pengunjung | Buat mockup high-quality untuk portofolio awal; gunakan proyek personal/fiktif |
| Conversion rate rendah | Revenue tidak tercapai | A/B testing pada CTA, pricing, dan headline; optimize berdasarkan data |
| Proses order manual terlalu lambat | Customer experience buruk | Implementasikan notifikasi otomatis dan dashboard tracking |
| Kompetitor menawarkan harga lebih murah | Kehilangan pelanggan | Fokus pada kualitas, kecepatan, dan garansi sebagai diferensiasi |
| Trafik organik lambat tumbuh | Akuisisi pelanggan lambat | Investasi di content marketing, social media, dan paid ads |

---

## 11. Metrik Sukses

| Metrik | Tools | Target |
|--------|-------|--------|
| Page Load Speed (LCP) | Lighthouse / PageSpeed | < 2.5 detik |
| Core Web Vitals | Google Search Console | Semua "Good" |
| Bounce Rate | GA4 | < 50% |
| Avg. Session Duration | GA4 | > 2 menit |
| Conversion Rate | GA4 + Custom Events | > 3% |
| Customer Satisfaction | Post-delivery survey | > 4.8/5 |

---

## 12. Appendix

### 12.1 Referensi Kompetitor
| Website | Kekuatan | Kelemahan |
|---------|----------|-----------|
| [Softriver.co](https://www.softriver.co/) | Desain web sangat polished, branding kuat, portofolio mengesankan | Pricing tidak transparan, proses order tidak self-service |
| [Logomint.co](https://www.logomint.co/) | Harga transparan, turnaround 48 jam, social proof kuat (4.9/5, 500+ reviews), UX/UI sangat clean | Fokus hanya pada logo & brand identity, tidak full-service agency |
| [Looka.com](https://looka.com/) | AI logo generator, instant, murah | Kualitas generic, tidak custom, tidak ada sentuhan manusia |
| [99designs.com](https://99designs.com/) | Marketplace besar, banyak desainer | Proses lama (kontes), kualitas tidak konsisten |

### 12.2 Inspirasi Interaksi & Animasi
- **Scroll Reveal**: Elemen muncul dengan fade-up saat scroll ke viewport (Logomint menggunakan class `.scroll-reveal`)
- **Marquee Carousel**: Auto-scrolling horizontal loop, bisa reverse direction
- **Floating Navbar**: Transform dari full-width bar → frosted-glass floating pill
- **Case Study Hover**: Crossfade dari foto mockup ke logo saat hover
- **CTA Hover**: Scale down sedikit (0.97) saat active/click
- **Nav Pill**: Soft pill yang glide mengikuti posisi link yang di-hover

### 12.3 Struktur File Proyek (Monorepo)

```
logopulse/
├── README.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── Makefile
├── .env.example
├── .github/
│   └── workflows/
│       └── deploy.yml                # CI/CD auto deploy ke VPS
├── nginx/
│   ├── nginx.conf                    # Nginx config utama
│   └── conf.d/
│       └── logopulse.conf            # Server block + reverse proxy
│
├── backend/                          # Go + chi backend
│   ├── cmd/
│   │   └── server/
│   │       └── main.go              # Entry point
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go            # Env vars, settings
│   │   ├── database/
│   │   │   ├── postgres.go          # DB connection pool
│   │   │   └── migrations/
│   │   │       ├── 001_init.up.sql
│   │   │       └── 001_init.down.sql
│   │   ├── models/
│   │   │   ├── order.go
│   │   │   ├── portfolio.go
│   │   │   ├── case_study.go
│   │   │   ├── blog_post.go
│   │   │   ├── testimonial.go
│   │   │   ├── client_logo.go
│   │   │   └── user.go
│   │   ├── handlers/
│   │   │   ├── order.go
│   │   │   ├── portfolio.go
│   │   │   ├── case_study.go
│   │   │   ├── blog.go
│   │   │   ├── testimonial.go
│   │   │   ├── upload.go
│   │   │   ├── auth.go
│   │   │   ├── dashboard.go
│   │   │   └── stripe_webhook.go
│   │   ├── middleware/
│   │   │   ├── auth.go              # JWT middleware
│   │   │   ├── cors.go
│   │   │   └── ratelimit.go
│   │   ├── repository/
│   │   │   ├── order_repo.go
│   │   │   ├── portfolio_repo.go
│   │   │   └── ...
│   │   ├── service/
│   │   │   ├── email.go
│   │   │   ├── stripe.go
│   │   │   └── storage.go           # R2/S3 upload
│   │   └── router/
│   │       └── router.go            # chi router setup
│   ├── go.mod
│   ├── go.sum
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                         # Astro public website
│   ├── astro.config.mjs
│   ├── package.json
│   ├── tailwind.config.mjs
│   ├── tsconfig.json
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   ├── og-default.png
│   │   └── Logo.svg
│   └── src/
│       ├── layouts/
│       │   └── BaseLayout.astro
│       ├── components/
│       │   ├── Navbar.astro
│       │   ├── Hero.astro
│       │   ├── ClientLogos.astro
│       │   ├── CaseStudyCard.astro
│       │   ├── PortfolioGrid.astro
│       │   ├── HowItWorks.astro
│       │   ├── PricingTable.astro
│       │   ├── TestimonialCard.astro
│       │   ├── FAQ.astro
│       │   ├── CTABanner.astro
│       │   ├── Footer.astro
│       │   ├── RatingBadge.astro
│       │   ├── MarqueeCarousel.astro
│       │   └── ui/
│       │       ├── Button.astro
│       │       ├── Card.astro
│       │       └── Accordion.astro
│       ├── pages/
│       │   ├── index.astro
│       │   ├── case-studies/
│       │   ├── blog/
│       │   ├── book.astro
│       │   ├── contact.astro
│       │   ├── order.astro
│       │   ├── terms.astro
│       │   └── privacy.astro
│       ├── lib/
│       │   ├── api.ts               # API client (fetch from Go backend)
│       │   └── utils.ts
│       ├── styles/
│       │   └── global.css
│       └── assets/
│           └── images/
│
└── admin/                            # React SPA admin panel
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── index.html
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── api/
        │   └── client.ts             # Axios/fetch wrapper
        ├── hooks/
        │   ├── useAuth.ts
        │   └── useOrders.ts
        ├── components/
        │   ├── Layout.tsx            # Sidebar + topbar
        │   ├── DataTable.tsx
        │   ├── ImageUploader.tsx
        │   ├── MarkdownEditor.tsx
        │   └── StatsCard.tsx
        ├── pages/
        │   ├── LoginPage.tsx
        │   ├── DashboardPage.tsx
        │   ├── OrdersPage.tsx
        │   ├── PortfolioPage.tsx
        │   ├── CaseStudiesPage.tsx
        │   ├── BlogPage.tsx
        │   ├── TestimonialsPage.tsx
        │   ├── ClientsPage.tsx
        │   └── SettingsPage.tsx
        └── lib/
            ├── auth.ts
            └── utils.ts
```

### 12.4 Database Schema (PostgreSQL)

```sql
-- Users (admin)
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    name        VARCHAR(255),
    role        VARCHAR(50) DEFAULT 'admin',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_name   VARCHAR(255) NOT NULL,
    customer_email  VARCHAR(255) NOT NULL,
    package_tier    VARCHAR(50) NOT NULL,    -- starter, professional, premium
    status          VARCHAR(50) DEFAULT 'pending',
    brief           JSONB,                   -- form data as JSON
    amount          INTEGER NOT NULL,         -- dalam cents USD (4900 = $49.00)
    currency        VARCHAR(3) DEFAULT 'USD',
    stripe_session  VARCHAR(255),
    paid_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio
CREATE TABLE portfolio_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    category    VARCHAR(100),
    image_url   TEXT NOT NULL,
    description TEXT,
    featured    BOOLEAN DEFAULT FALSE,
    published   BOOLEAN DEFAULT TRUE,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Case Studies
CREATE TABLE case_studies (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       VARCHAR(255) NOT NULL,
    slug        VARCHAR(255) UNIQUE NOT NULL,
    industry    VARCHAR(100),
    hero_image  TEXT,
    content     TEXT,                        -- markdown
    published   BOOLEAN DEFAULT FALSE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Blog Posts
CREATE TABLE blog_posts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title           VARCHAR(255) NOT NULL,
    slug            VARCHAR(255) UNIQUE NOT NULL,
    content         TEXT,
    category        VARCHAR(100),
    thumbnail_url   TEXT,
    meta_title      VARCHAR(255),
    meta_description TEXT,
    published       BOOLEAN DEFAULT FALSE,
    published_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials
CREATE TABLE testimonials (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    position    VARCHAR(255),
    company     VARCHAR(255),
    photo_url   TEXT,
    quote       TEXT NOT NULL,
    rating      SMALLINT DEFAULT 5,
    featured    BOOLEAN DEFAULT FALSE,
    published   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Client Logos
CREATE TABLE client_logos (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(255) NOT NULL,
    logo_url    TEXT NOT NULL,
    sort_order  INTEGER DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

> [!IMPORTANT]
> Dokumen ini adalah **living document** yang akan terus diperbarui seiring perkembangan proyek. Semua keputusan desain dan teknis harus didiskusikan sebelum implementasi.

---

*Dibuat oleh LogoPulse Team — September 2026*
