# LogoPulse — Jasa Desain Logo & Brand Identity

Monorepo: Astro (public) + React shadcn/ui (admin) + Go chi (API) + Postgres + Nginx. Single VPS Docker Compose.

> Pricing dalam **USD** via **Stripe Checkout** (`currency: usd`). Tier: $49 / $149 / $399.

## Struktur

```
./backend   → Go + chi API (:8080)
./frontend  → Astro public site
./admin     → React SPA admin (/admin/)
./nginx     → reverse proxy + static
```

## Quickstart (dev)

```bash
cp .env.example .env
docker compose up --build
# api: http://localhost:8080/api/v1/health
# frontend: build via ./frontend (npm run dev)
# admin: via ./admin (npm run dev)
```

## Prod (VPS)

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Lihat `prd.md` (spesifikasi) dan `design.md` (tokens + animasi wajib 12 section).
