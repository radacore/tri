#!/usr/bin/env bash
# Deploy native: build di sini, kirim ke VPS, migrasi, restart service.
#   SERVER=user@ip ./deploy/deploy.sh dev            # ujung main -> dev (penuh)
#   SERVER=user@ip ./deploy/deploy.sh prod v1.2.0    # tag -> prod (penuh)
#   SERVER=user@ip ./deploy/deploy.sh prod --rollback <stamp>
# Hemat (untuk perubahan kecil):
#   SERVER=user@ip ./deploy/deploy.sh dev --only=api   # backend saja
#   SERVER=user@ip ./deploy/deploy.sh dev --only=web   # landing+admin saja
#   SERVER=user@ip ./deploy/deploy.sh dev --skip-db    # tanpa migrasi+seed
# Butuh: Go + Node lokal, akses SSH ke VPS, folder deploy/ sudah disiapkan
# (provision.sh, vhost, unit systemd, .env di /opt/brandingpulse[-dev]/).
set -euo pipefail

TARGET="${1:-}"; REF="${2:-}"; EXTRA="${3:-}"
if [[ "$TARGET" != "dev" && "$TARGET" != "prod" ]]; then
  echo "pakai: $0 dev [--only=api|web] [--skip-db] | $0 prod <tag> | $0 <dev|prod> --rollback <stamp>"; exit 1
fi
ONLY="all"; SKIP_DB=0
for f in "$REF" "$EXTRA" "$@"; do
  case "$f" in
    --only=*) ONLY="${f#--only=}";;
    --skip-db) SKIP_DB=1;;
  esac
done
if [[ "$ONLY" != all && "$ONLY" != api && "$ONLY" != web ]]; then echo "only harus api|web"; exit 1; fi
: "${SERVER:?set SERVER=user@ip}"

if [[ "$TARGET" == "dev" ]]; then
  BASE=/opt/brandingpulse-dev; SVC=brandingpulse-dev
else
  BASE=/opt/brandingpulse; SVC=brandingpulse-api
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
REL="$BASE/releases/$STAMP"

rollback() {
  local stamp="$1"
  echo "== rollback $TARGET ke $stamp =="
  ssh "$SERVER" "ln -sfn $BASE/releases/$stamp $BASE/current && sudo systemctl restart $SVC && sudo systemctl reload nginx"
  echo "OK — $TARGET kembali ke $stamp"
}

if [[ "$REF" == "--rollback" ]]; then
  rollback "$EXTRA"; exit 0
fi

# prod wajib dari tag (bukan HEAD sembarang)
if [[ "$TARGET" == "prod" ]]; then
  [[ -n "$REF" ]] || { echo "prod wajib sebut tag: $0 prod v1.2.0"; exit 1; }
  git fetch --tags -q
  git rev-parse "$REF^{tag}" >/dev/null || { echo "tag $REF tidak ada"; exit 1; }
  git archive "$REF" -o /tmp/lp-$REF.tar
  WORK=$(mktemp -d); tar -xf /tmp/lp-$REF.tar -C "$WORK"; cd "$WORK"
else
  # dev = ujung main yang sedang aktif (harus bersih)
  git diff --quiet && git diff --cached --quiet || { echo "working tree kotor — commit dulu"; exit 1; }
  WORK="$PWD"
  # Deteksi otomatis: bandingkan dengan deploy dev terakhir.
  # Override manual tetap menang (flag --only / --skip-db).
  STATE="/tmp/lp-deploy-dev"
  if [[ "$ONLY" == all && "$SKIP_DB" == 0 && -f "$STATE" ]]; then
    LAST=$(cat "$STATE" 2>/dev/null)
    if git cat-file -e "$LAST" 2>/dev/null; then
      CHANGED=$(git diff --name-only "$LAST"..HEAD; git ls-files --others --exclude-standard)
      if [[ -z "$CHANGED" ]]; then
        echo "tidak ada perubahan sejak deploy terakhir ($LAST) — selesai."
        echo "(paksa penuh: hapus $STATE lalu ulangi)"
        exit 0
      fi
      NEED_API=0; NEED_WEB=0; NEED_DB=0
      while IFS= read -r f; do
        case "$f" in
          backend/scripts/migrate_*|backend/scripts/seed.sql) NEED_DB=1;;
          backend/*) NEED_API=1;;
          frontend/*) NEED_WEB=1;;
          admin/*) NEED_WEB=1;;
          *) NEED_API=1; NEED_WEB=1; NEED_DB=1;;
        esac
      done <<< "$CHANGED"
      [[ "$NEED_API" == 0 && "$NEED_WEB" == 0 ]] && { echo "hanya non-kode berubah — lewati."; echo "$CHANGED" | head -5; exit 0; }
      [[ "$NEED_API" == 1 && "$NEED_WEB" == 0 ]] && ONLY=api
      [[ "$NEED_API" == 0 && "$NEED_WEB" == 1 ]] && ONLY=web
      [[ "$NEED_DB" == 0 ]] && SKIP_DB=1
      echo "terdeteksi: api=$NEED_API web=$NEED_WEB db=$NEED_DB -> ONLY=$ONLY SKIP_DB=$SKIP_DB"
    fi
  fi
fi

echo "== build backend (di server — butuh CGO untuk WebP) =="
if [[ "$ONLY" == web ]]; then
  echo "  (dilewati --only=web)"
else
  tar -czf /tmp/lp-backend.tgz -C "$WORK/backend" .
  scp -q /tmp/lp-backend.tgz "$SERVER:/tmp/"
  ssh "$SERVER" "rm -rf /tmp/lp-src $REL && mkdir -p /tmp/lp-src $REL && tar -xzf /tmp/lp-backend.tgz -C /tmp/lp-src && cd /tmp/lp-src && export PATH=\$PATH:/usr/local/go/bin && go build -o $REL/api ./cmd/server && rm -rf /tmp/lp-src /tmp/lp-backend.tgz && chown -R brandingpulse:brandingpulse $REL" && rm -f /tmp/lp-backend.tgz
fi
# npm ci hanya bila node_modules belum ada atau lockfile berubah
lockhash() {
  if command -v sha1sum >/dev/null 2>&1; then sha1sum "$1";
  elif command -v shasum >/dev/null 2>&1; then shasum -a 1 "$1";
  else cksum "$1"; fi | cut -d' ' -f1
}
npm_smart() {
  local dir="$1"
  local hash
  hash=$(lockhash "$dir/package-lock.json" 2>/dev/null || true)
  if [[ -d "$dir/node_modules" && -f "$dir/node_modules/.lp-lock" ]] && [[ "$(cat "$dir/node_modules/.lp-lock")" == "$hash" ]]; then
    echo "  (node_modules segar — npm ci dilewati)"
  else
    (cd "$dir" && npm ci --no-audit --no-fund >/dev/null 2>&1) && echo "$hash" > "$dir/node_modules/.lp-lock"
  fi
}
echo "== build landing =="
if [ "$TARGET" = dev ]; then
  API_URL="https://dev.brandingpulse.co/api/v1"; SITE_URL="https://dev.brandingpulse.co"
else
  API_URL="https://brandingpulse.co/api/v1"; SITE_URL="https://brandingpulse.co"
fi
if [[ "$ONLY" == api ]]; then
  echo "  (dilewati --only=api)"
else
  npm_smart "$WORK/frontend"
  (cd "$WORK/frontend" && PUBLIC_API_URL="$API_URL" PUBLIC_SITE_URL="$SITE_URL" npm run build >/dev/null 2>&1)
fi
echo "== build admin =="
if [[ "$ONLY" == api ]]; then
  echo "  (dilewati --only=api)"
else
  npm_smart "$WORK/admin"
  (cd "$WORK/admin" && VITE_API_URL="$API_URL" VITE_LANDING_URL="$SITE_URL" VITE_SITE_URL="$SITE_URL" npm run build >/dev/null 2>&1)
fi

echo "== kirim $STAMP ke $TARGET =="
ssh "$SERVER" "mkdir -p $REL/landing $REL/admin"
if [[ "$ONLY" == api ]]; then
  echo "  (landing+admin disalin dari rilis aktif)"
  ssh "$SERVER" "cp -r $BASE/current/landing/. $REL/landing/ && cp -r $BASE/current/admin/. $REL/admin/"
else
  scp -qr "$WORK/frontend/dist/." "$SERVER:$REL/landing/"
  scp -qr "$WORK/admin/dist/." "$SERVER:$REL/admin/"
fi
if [[ "$ONLY" == web ]]; then
  echo "  (binary disalin dari rilis aktif)"
  ssh "$SERVER" "cp $BASE/current/api $REL/api || { echo 'tidak ada rilis aktif — deploy penuh dulu'; exit 1; }"
fi

if [[ "$SKIP_DB" == 1 ]]; then
  echo "== migrasi DB dilewati (--skip-db) =="
else
echo "== migrasi DB $TARGET =="
DBNAME="brandingpulse"; [ "$TARGET" = dev ] && DBNAME="brandingpulse_dev"
for m in "$WORK"/backend/scripts/migrate_*.sql; do
  echo "  - $(basename $m)"
  ssh "$SERVER" "set -a; . $BASE/.env; set +a; PGPASSWORD=\"\$DB_PASSWORD\" psql -h localhost -U brandingpulse -d $DBNAME -v ON_ERROR_STOP=1 -f -" < "$m"
done
fi

echo "== aktifkan rilis =="
# seed konten contoh: dev saja, dan hanya bila DB masih kosong
if [[ "$SKIP_DB" == 1 ]]; then
  echo "  (seed dilewati --skip-db)"
elif [[ "$TARGET" == dev ]]; then
  N=$(ssh "$SERVER" 'set -a; . '"$BASE"'/.env; set +a; PGPASSWORD="$DB_PASSWORD" psql -h localhost -U brandingpulse -d '"$DBNAME"' -tAc "SELECT COUNT(*) FROM portfolio_items"')
  if [[ "${N//[[:space:]]/}" == "0" ]]; then
    echo "  (DB kosong — seed dijalankan)"
    ssh "$SERVER" 'set -a; . '"$BASE"'/.env; set +a; PGPASSWORD="$DB_PASSWORD" psql -h localhost -U brandingpulse -d '"$DBNAME"' -v ON_ERROR_STOP=1 -f -' < "$WORK/backend/scripts/seed.sql"
  else
    echo "  (DB sudah berisi — seed dilewati)"
  fi
fi
ssh "$SERVER" "chmod +x $REL/api && chown -R brandingpulse:brandingpulse $REL && ln -sfn $REL $BASE/current && sudo systemctl restart $SVC && sudo systemctl reload nginx"
sleep 3
HOST=$([ "$TARGET" = dev ] && echo "https://dev.brandingpulse.co" || echo "https://brandingpulse.co")
echo "== cek =="
curl -sm 10 "$HOST/api/v1/health" || echo "WARN: health check gagal — cek manual"
curl -sm 10 -o /dev/null -w "landing %{http_code}\n" "$HOST/" || true
if [[ "$TARGET" == dev ]]; then
  git -C "$WORK" rev-parse HEAD > /tmp/lp-deploy-dev 2>/dev/null || true
fi
echo "OK — $TARGET @ $STAMP"
