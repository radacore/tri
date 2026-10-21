# BrandingPulse — Jasa Desain Logo & Brand Identity

Monorepo: Astro (public) + React admin (/admin/) + Go chi API + Postgres + Nginx. Deploy native ke single VPS (dev + prod).

> Pricing dalam **USD**. Tier: $49 / $149 / $399.

## Struktur

```
./backend   → Go + chi API (:8080 prod, :8081 dev)
./frontend  → Astro public site (static, konten dari API saat build + runtime)
./admin     → React SPA admin (/admin/)
./deploy    → provision, vhost, systemd, skrip rilis
./referensi → arsip lokal, TIDAK di-commit (lihat .gitignore)
```

## Quickstart (dev lokal)

Prasyarat: Go 1.26+, Node 20+, PostgreSQL 16+.

```bash
# 1. Siapkan database + .env
createdb brandingpulse
cp backend/.env.example backend/.env   # isi JWT_SECRET (>=32 char) + ADMIN_PASSWORD_HASH
psql brandingpulse -f backend/scripts/migrate_000_init.sql
psql brandingpulse -f backend/scripts/migrate_orders.sql
psql brandingpulse -f backend/scripts/migrate_order_stage.sql
psql brandingpulse -f backend/scripts/migrate_case_blog.sql
psql brandingpulse -f backend/scripts/seed.sql

# 2. Jalankan (tiga terminal)
cd backend  && go run ./cmd/server        # .env dibaca otomatis
cd frontend && npm run dev                # :4321
cd admin    && npm run dev                # :5174/admin/
```

Landing memakai `PUBLIC_API_URL` saat build; admin memakai `VITE_API_URL`.
Keduanya default ke `/api/v1` (same-origin di balik nginx).

## Kontrak API

Semua respons dibungkus `{ "data": ... }` (list menambah `"meta"`), error `{ "error": "..." }`.
Admin menormalkan envelope + alias field (`package_tier` → `tier`, `amount` → `total_cents`)
di satu tempat: `admin/src/api/client.ts`.

Konten publik dibaca dari `GET /api/v1/settings`, yang hanya mengembalikan key di
`publicSettingsAllowlist` (`backend/internal/handlers/settings.go`). Key baru tidak
otomatis publik — daftarkan eksplisit.

## Rilis (lihat deploy/README.md)

```bash
SERVER=user@ip ./deploy/deploy.sh dev            # ujung main -> dev.brandingpulse.co
git tag v1.0.0 && git push origin v1.0.0
SERVER=user@ip ./deploy/deploy.sh prod v1.0.0    # tag -> brandingpulse.co
```

Spesifikasi dan tokens desain diarsipkan di `referensi/` (tidak ikut repo).
