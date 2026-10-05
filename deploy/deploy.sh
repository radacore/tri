#!/usr/bin/env bash
# Deploy native: build di sini, kirim ke VPS, migrasi, restart service.
#   SERVER=user@ip ./deploy/deploy.sh dev            # ujung main -> dev
#   SERVER=user@ip ./deploy/deploy.sh prod v1.2.0    # tag -> prod
#   SERVER=user@ip ./deploy/deploy.sh prod --rollback <stamp>
#   SERVER=user@ip ./deploy/deploy.sh dev --rollback <stamp>
# Butuh: Go + Node lokal, akses SSH ke VPS, folder deploy/ sudah disiapkan
# (provision.sh, vhost, unit systemd, .env di /opt/brandingpulse[-dev]/).
set -euo pipefail

TARGET="${1:-}"; REF="${2:-}"; EXTRA="${3:-}"
if [[ "$TARGET" != "dev" && "$TARGET" != "prod" ]]; then
  echo "pakai: $0 dev | $0 prod <tag> | $0 <dev|prod> --rollback <stamp>"; exit 1
fi
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
fi

echo "== build backend =="
(cd "$WORK/backend" && go build -o /tmp/lp-rel-api ./cmd/server)
echo "== build landing =="
(cd "$WORK/frontend" && npm ci --no-audit --no-fund >/dev/null 2>&1; npm run build >/dev/null 2>&1)
echo "== build admin =="
(cd "$WORK/admin" && npm ci --no-audit --no-fund >/dev/null 2>&1; npm run build >/dev/null 2>&1)

echo "== kirim $STAMP ke $TARGET =="
ssh "$SERVER" "mkdir -p $REL/landing $REL/admin"
scp -q /tmp/lp-rel-api "$SERVER:$REL/api"
scp -qr "$WORK/frontend/dist/." "$SERVER:$REL/landing/"
scp -qr "$WORK/admin/dist/." "$SERVER:$REL/admin/"

echo "== migrasi DB $TARGET =="
DBNAME="brandingpulse"; [ "$TARGET" = dev ] && DBNAME="brandingpulse_dev"
for m in "$WORK"/backend/scripts/migrate_*.sql; do
  echo "  - $(basename $m)"
  ssh "$SERVER" "set -a; . $BASE/.env; set +a; PGPASSWORD=\"\$DB_PASSWORD\" psql -h localhost -U brandingpulse -d $DBNAME -v ON_ERROR_STOP=1 -f -" < "$m"
done

echo "== aktifkan rilis =="
# seed konten contoh hanya untuk dev (prod mulai kosong, diisi via admin)
if [ "$TARGET" = dev ]; then
  echo "== seed konten dev =="
  ssh "$SERVER" 'set -a; . '"$BASE"'/.env; set +a; PGPASSWORD="$DB_PASSWORD" psql -h localhost -U brandingpulse -d '"$DBNAME"' -v ON_ERROR_STOP=1 -f -' < "$WORK/backend/scripts/seed.sql"
fi
ssh "$SERVER" "chmod +x $REL/api && ln -sfn $REL $BASE/current && sudo systemctl restart $SVC && sudo systemctl reload nginx"
sleep 3
HOST=$([ "$TARGET" = dev ] && echo "https://dev.brandingpulse.co" || echo "https://brandingpulse.co")
echo "== cek =="
curl -sm 10 "$HOST/api/v1/health" || echo "WARN: health check gagal — cek manual"
curl -sm 10 -o /dev/null -w "landing %{http_code}\n" "$HOST/" || true
echo "OK — $TARGET @ $STAMP"
