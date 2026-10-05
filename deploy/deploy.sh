#!/usr/bin/env bash
# Deploy native: build di sini, kirim ke VPS, migrasi, restart service.
#   SERVER=user@ip ./deploy/deploy.sh dev            # ujung main -> dev (penuh)
#   SERVER=user@ip ./deploy/deploy.sh prod v1.2.0    # tag -> prod (penuh)
#   SERVER=user@ip ./deploy/deploy.sh prod --rollback <stamp>
# Hemat otomatis: deteksi perubahan vs deploy terakhir (backend/web/db
# diproses yang berubah saja; npm ci dilewati bila segar).
# Manual: --only=api|web, --skip-db.
# Cache Cloudflare di-purge otomatis bila CF_API_TOKEN + CF_ZONE_ID terisi
# (env atau ~/.brandingpulse-deploy).
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

if [[ "$TARGET" == dev ]]; then
  BASE=/opt/brandingpulse-dev; SVC=brandingpulse-dev
  API_URL="https://dev.brandingpulse.co/api/v1"; SITE_URL="https://dev.brandingpulse.co"; HOST="https://dev.brandingpulse.co"
else
  BASE=/opt/brandingpulse; SVC=brandingpulse-api
  API_URL="https://brandingpulse.co/api/v1"; SITE_URL="https://brandingpulse.co"; HOST="https://brandingpulse.co"
fi
DBNAME="brandingpulse"; [ "$TARGET" = dev ] && DBNAME="brandingpulse_dev"

STAMP="$(date +%Y%m%d-%H%M%S)"
REL="$BASE/releases/$STAMP"

# --- satu koneksi SSH dipakai ulang (hemat handshake; dipasang setelah deteksi) ---
SOCK=""
ssh_init() {
  SOCK="/tmp/lp-ssh-$TARGET-$(date +%s)"
  SSH="ssh -o ControlPath=$SOCK -o ControlMaster=auto -o ControlPersist=60"
  SCP="scp -o ControlPath=$SOCK"
  ssh -o ControlPath=$SOCK -o ControlMaster=auto -o ControlPersist=60 -f -N "$SERVER"
}
cleanup_ssh() { if [[ -n "$SOCK" ]]; then ssh -O exit -o ControlPath=$SOCK "$SERVER" 2>/dev/null || true; rm -f "$SOCK"; fi; return 0; }
trap cleanup_ssh EXIT

rollback() {
  local stamp="$1"
  echo "== rollback $TARGET ke $stamp =="
  ssh "$SERVER" "ln -sfn $BASE/releases/$stamp $BASE/current && sudo systemctl restart $SVC && sudo systemctl reload nginx"
  cf_purge
  echo "OK — $TARGET kembali ke $stamp"
}

# --- purge cache Cloudflare (opsional; dilewati bila kredensial tak ada) ---
cf_purge() {
  local cfg=~/.brandingpulse-deploy
  [[ -f "$cfg" ]] && set -a && . "$cfg" && set +a || true
  if [[ -z "${CF_API_TOKEN:-}" || -z "${CF_ZONE_ID:-}" ]]; then
    echo "  (purge CF dilewati — isi CF_API_TOKEN + CF_ZONE_ID di ~/.brandingpulse-deploy)"
    return 0
  fi
  local host="${HOST#https://}"
  local hdr=(-H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json")
  if curl -sm 15 -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
    "${hdr[@]}" --data "{\"prefixes\":[\"$host/admin/\",\"$host/blog/\",\"$host/case-studies/\"]}" 2>/dev/null | grep -q '"success":true'; then
    echo "  (cache CF di-purge)"
  elif curl -sm 15 -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/purge_cache" \
    "${hdr[@]}" --data '{"purge_everything":true}' 2>/dev/null | grep -q '"success":true'; then
    echo "  (cache CF di-purge total — prefix tak didukung paket ini)"
  else
    echo "  WARN: purge CF gagal — hard refresh bila masih basi"
  fi
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
        cleanup_ssh
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

# --- BUILD PARALEL: backend (server) + landing + admin ---
ssh_init
BUILD_FAIL=0
if [[ "$ONLY" != web ]]; then
  echo "== build backend (server) =="
  tar -czf /tmp/lp-backend.tgz -C "$WORK/backend" . &
  BPID_TAR=$!
fi
if [[ "$ONLY" != api ]]; then
  echo "== siapkan landing+admin =="
  npm_smart "$WORK/frontend" &
  NPID_F=$!
  npm_smart "$WORK/admin" &
  NPID_A=$!
fi
FAIL=0
if [[ -n "${BPID_TAR:-}" ]]; then wait $BPID_TAR || FAIL=1; fi
if [[ -n "${NPID_F:-}" ]]; then wait $NPID_F || FAIL=1; fi
if [[ -n "${NPID_A:-}" ]]; then wait $NPID_A || FAIL=1; fi
# NOTE: tar/scp/upload backend menyusul di bawah agar pesan urut;
# build Go-nya sendiri dijalankan paralel dengan npm build via blok berikut.
if [[ "$ONLY" != web ]]; then
  echo "== upload + build Go di server =="
  $SCP -q /tmp/lp-backend.tgz "$SERVER:/tmp/" && rm -f /tmp/lp-backend.tgz
  $SSH "$SERVER" "rm -rf /tmp/lp-src $REL && mkdir -p /tmp/lp-src $REL && tar -xzf /tmp/lp-backend.tgz -C /tmp/lp-src && cd /tmp/lp-src && export PATH=\$PATH:/usr/local/go/bin && go build -o $REL/api ./cmd/server && rm -rf /tmp/lp-src /tmp/lp-backend.tgz && chown -R brandingpulse:brandingpulse $REL" &
  BPID_GO=$!
fi
if [[ "$ONLY" != api ]]; then
  echo "== build landing =="
  (cd "$WORK/frontend" && PUBLIC_API_URL="$API_URL" PUBLIC_SITE_URL="$SITE_URL" npm run build >/dev/null 2>&1) &
  BPID_L=$!
  echo "== build admin =="
  (cd "$WORK/admin" && VITE_API_URL="$API_URL" VITE_LANDING_URL="$SITE_URL" VITE_SITE_URL="$SITE_URL" npm run build >/dev/null 2>&1) &
  BPID_A2=$!
fi
for p in ${BPID_GO:-} ${BPID_L:-} ${BPID_A2:-}; do wait $p || FAIL=1; done
if [[ "$FAIL" == 1 ]]; then echo "BUILD GAGAL — deploy dibatalkan."; exit 1; fi

echo "== kirim $STAMP ke $TARGET =="
$SSH "$SERVER" "mkdir -p $REL/landing $REL/admin"
if [[ "$ONLY" == api ]]; then
  echo "  (landing+admin disalin dari rilis aktif)"
  $SSH "$SERVER" "cp -r $BASE/current/landing/. $REL/landing/ && cp -r $BASE/current/admin/. $REL/admin/"
else
  $SCP -qr "$WORK/frontend/dist/." "$SERVER:$REL/landing/"
  $SCP -qr "$WORK/admin/dist/." "$SERVER:$REL/admin/"
fi
if [[ "$ONLY" == web ]]; then
  echo "  (binary disalin dari rilis aktif)"
  $SSH "$SERVER" "cp $BASE/current/api $REL/api || { echo 'tidak ada rilis aktif — deploy penuh dulu'; exit 1; }"
fi

if [[ "$SKIP_DB" == 1 ]]; then
  echo "== migrasi DB dilewati (--skip-db) =="
else
  echo "== migrasi DB $TARGET =="
  DBNAME="brandingpulse"; [ "$TARGET" = dev ] && DBNAME="brandingpulse_dev"
  # Pra-penerbangan: uji semua migrasi ke database scratch lokal.
  if command -v psql >/dev/null 2>&1 && psql "postgres://brandingpulse:logopulse@localhost:5432/postgres?sslmode=disable" -tAc "SELECT 1" >/dev/null 2>&1; then
    psql "postgres://brandingpulse:logopulse@localhost:5432/postgres?sslmode=disable" -qc "DROP DATABASE IF EXISTS mig_check;" -qc "CREATE DATABASE mig_check;" >/dev/null 2>&1
    MIG_OK=1
    for m in "$WORK"/backend/scripts/migrate_*.sql; do
      if ! psql "postgres://brandingpulse:logopulse@localhost:5432/mig_check?sslmode=disable" -q -v ON_ERROR_STOP=1 -f "$m" >/tmp/lp-migcheck.log 2>&1; then
        echo "  GAGAL pra-penerbangan: $(basename "$m")"; tail -5 /tmp/lp-migcheck.log; MIG_OK=0; break
      fi
    done
    psql "postgres://brandingpulse:logopulse@localhost:5432/postgres?sslmode=disable" -qc "DROP DATABASE IF EXISTS mig_check;" >/dev/null 2>&1
    if [[ "$MIG_OK" == 0 ]]; then echo "perbaiki migrasi dulu — deploy dibatalkan."; exit 1; fi
    echo "  pra-penerbangan lolos"
  else
    echo "  (postgres lokal tak tersedia — pra-penerbangan dilewati)"
  fi
  run_mig() { # $1 = file, $2 = db
    local out
    if out=$($SSH "$SERVER" "set -a; . $BASE/.env; set +a; PGPASSWORD=\"\$DB_PASSWORD\" psql -q -h localhost -U brandingpulse -d $2 -v ON_ERROR_STOP=1 -f -" < "$1" 2>&1); then
      echo "  - $(basename "$1"): OK"
    else
      echo "  - $(basename "$1"): GAGAL"; echo "$out" | grep -viE "warning|locale|LC_|LANG" | head -8; return 1
    fi
  }
  for m in "$WORK"/backend/scripts/migrate_*.sql; do
    run_mig "$m" "$DBNAME"
  done
fi

echo "== aktifkan rilis =="
# seed konten contoh: dev saja, dan hanya bila DB masih kosong
if [[ "$SKIP_DB" == 1 ]]; then
  echo "  (seed dilewati --skip-db)"
elif [[ "$TARGET" == dev ]]; then
  N=$($SSH "$SERVER" 'set -a; . '"$BASE"'/.env; set +a; PGPASSWORD="$DB_PASSWORD" psql -h localhost -U brandingpulse -d '"$DBNAME"' -tAc "SELECT COUNT(*) FROM portfolio_items"')
  if [[ "${N//[[:space:]]/}" == "0" ]]; then
    echo "  (DB kosong — seed dijalankan)"
    if $SSH "$SERVER" 'set -a; . '"$BASE"'/.env; set +a; PGPASSWORD="$DB_PASSWORD" psql -q -h localhost -U brandingpulse -d '"$DBNAME"' -v ON_ERROR_STOP=1 -f -' < "$WORK/backend/scripts/seed.sql" >/tmp/lp-seed.log 2>&1; then
      echo "  - seed.sql: OK"
    else
      echo "  - seed.sql: GAGAL"; grep -viE "warning|locale|LC_|LANG" /tmp/lp-seed.log | head -8; exit 1
    fi
  else
    echo "  (DB sudah berisi — seed dilewati)"
  fi
fi
$SSH "$SERVER" "chmod +x $REL/api && chown -R brandingpulse:brandingpulse $REL && ln -sfn $REL $BASE/current && sudo systemctl restart $SVC && sudo systemctl reload nginx"
sleep 3
echo "== cek =="
curl -sm 10 "$HOST/api/v1/health" || echo "WARN: health check gagal — cek manual"
curl -sm 10 -o /dev/null -w "landing %{http_code}\n" "$HOST/" || true
cf_purge
if [[ "$TARGET" == dev ]]; then
  git -C "$WORK" rev-parse HEAD > /tmp/lp-deploy-dev 2>/dev/null || true
fi
echo "OK — $TARGET @ $STAMP"
