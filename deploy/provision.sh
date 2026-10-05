#!/usr/bin/env bash
# Provisioning VPS Ubuntu 24 kosong: nginx, postgresql, certbot, user + direktori.
# Jalankan sebagai root:  bash deploy/provision.sh
# Idempoten: aman dijalankan ulang.
set -euo pipefail

APP_USER="brandingpulse"
DEV_SUFFIX="-dev"

export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y nginx postgresql postgresql-contrib certbot python3-certbot-nginx curl git ufw

# Firewall: hanya SSH + HTTP(S)
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
ufw --force enable >/dev/null 2>&1 || true

id "$APP_USER" >/dev/null 2>&1 || useradd -r -m -s /usr/sbin/nologin "$APP_USER"

# Go toolchain (untuk build API di server — lib WebP butuh CGO)
if [ ! -x /usr/local/go/bin/go ]; then
  ARCH="$(uname -m)"; [ "$ARCH" = "x86_64" ] && GOARCH=amd64 || GOARCH=arm64
  curl -fsSL "https://go.dev/dl/go1.26.1.linux-$GOARCH.tar.gz" -o /tmp/go.tgz
  rm -rf /usr/local/go && tar -C /usr/local -xzf /tmp/go.tgz && rm /tmp/go.tgz
fi
export PATH="$PATH:/usr/local/go/bin"
go version

# Direktori rilis + uploads (dev & prod terpisah)
for env in "" "$DEV_SUFFIX"; do
  mkdir -p "/opt/brandingpulse$env/releases" "/var/lib/brandingpulse$env/uploads"
  chown -R "$APP_USER:$APP_USER" "/opt/brandingpulse$env" "/var/lib/brandingpulse$env"
done

# PostgreSQL: database + user untuk prod dan dev. Password dibaca dari
# environment DB_PASSWORD / DB_PASSWORD_DEV saat script dijalankan, contoh:
#   DB_PASSWORD=... DB_PASSWORD_DEV=... bash deploy/provision.sh
# Tanpa itu, database dibuat tapi password belum diset (lihat .env).
su postgres -c "psql -tAc \"SELECT 1 FROM pg_roles WHERE rolname='brandingpulse'\"" | grep -q 1 \
  || su postgres -c "psql -c \"CREATE USER brandingpulse WITH PASSWORD '${DB_PASSWORD:-changeme-tolong-ganti}';\""
su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='brandingpulse'\"" | grep -q 1 \
  || su postgres -c "createdb -O brandingpulse brandingpulse"
su postgres -c "psql -tAc \"SELECT 1 FROM pg_database WHERE datname='brandingpulse_dev'\"" | grep -q 1 \
  || su postgres -c "createdb -O brandingpulse brandingpulse_dev"
if [ -n "${DB_PASSWORD:-}" ]; then
  su postgres -c "psql -c \"ALTER USER brandingpulse WITH PASSWORD '$DB_PASSWORD';\""
  echo "DB password prod diset."
else
  echo "PERINGATAN: DB_PASSWORD kosong — set password manual: sudo -u postgres psql -c \"ALTER USER brandingpulse ...\""
fi

# PostgreSQL hanya listen lokal
PGVER=$(ls /etc/postgresql/ | sort -V | tail -1)
grep -q "^listen_addresses *= *'localhost'" "/etc/postgresql/$PGVER/main/postgresql.conf" \
  || echo "listen_addresses = 'localhost'" >> "/etc/postgresql/$PGVER/main/postgresql.conf"
systemctl enable --now postgresql nginx

echo "Selesai. Lanjut: deploy vhost (deploy/nginx-*.conf), systemd, lalu certbot."
