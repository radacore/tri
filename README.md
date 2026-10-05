# BrandingPulse — Jasa Desain Logo & Brand Identity

Monorepo: Astro (public) + React admin (/admin/) + Go chi API + Postgres + Nginx. Deploy native ke single VPS (dev + prod).

> Pricing dalam **USD**. Tier: $49 / $149 / $399.

## Struktur

```
./backend   → Go + chi API (:8080 prod, :8081 dev)
./frontend  → Astro public site
./admin     → React SPA admin (/admin/)
./nginx     → reverse proxy + static (native)
./deploy    → provision, vhost, systemd, skrip rilis
./referensi → arsip lokal, TIDAK di-commit (lihat .gitignore)
```

## Quickstart (dev lokal)

```bash
# API:     cd backend && go run ./cmd/server   (butuh backend/.env)
# Landing: cd frontend && npm run preview -- --port 4321
# Admin:   cd admin && npm run dev             # :5174/admin/
```

## Rilis (lihat deploy/README.md)

```bash
SERVER=user@ip ./deploy/deploy.sh dev            # ujung main -> dev.brandingpulse.co
git tag v1.0.0 && git push origin v1.0.0
SERVER=user@ip ./deploy/deploy.sh prod v1.0.0    # tag -> brandingpulse.co
```

Spesifikasi dan tokens desain diarsipkan di `referensi/` (tidak ikut repo).
