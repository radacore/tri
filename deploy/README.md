# Deploy native (Ubuntu 24, tanpa Docker)

## 0. DNS (sekali)
- `brandingpulse.co` → A ke IP VPS, Proxied
- `dev` → CNAME ke `brandingpulse.co`, Proxied
- `www` → CNAME ke `brandingpulse.co`, Proxied

## 1. Provisioning VPS kosong (sekali, sebagai root)
```bash
DB_PASSWORD=$(openssl rand -base64 32) bash deploy/provision.sh
```

## 2. File env di server (sekali per env, sebagai root)
```bash
cp deploy/env-prod.example /opt/brandingpulse/.env
cp deploy/env-dev.example /opt/brandingpulse-dev/.env
nano /opt/brandingpulse/.env       # isi JWT_SECRET, DB_PASSWORD, ADMIN_PASSWORD_HASH
nano /opt/brandingpulse-dev/.env   # bedakan secret dev vs prod!
chmod 600 /opt/brandingpulse/.env /opt/brandingpulse-dev/.env
chown brandingpulse:brandingpulse /opt/brandingpulse/.env /opt/brandingpulse-dev/.env
```

## 3. Service + vhost (sekali, sebagai root)
```bash
cp deploy/brandingpulse-api.service deploy/brandingpulse-dev.service /etc/systemd/system/
systemctl daemon-reload
cp deploy/nginx-prod.conf /etc/nginx/sites-available/brandingpulse.co
cp deploy/nginx-dev.conf /etc/nginx/sites-available/dev.brandingpulse.co
ln -s /etc/nginx/sites-available/brandingpulse.co /etc/nginx/sites-enabled/
ln -s /etc/nginx/sites-available/dev.brandingpulse.co /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## 4. HTTPS (sekali)
```bash
certbot --nginx -d brandingpulse.co -d www.brandingpulse.co -d dev.brandingpulse.co
# Cloudflare SSL → Full (strict)
```

## 5. Rilis harian
```bash
SERVER=root@IP_VPS ./deploy/deploy.sh dev              # ujung main -> dev
git tag v1.0.0 && git push origin v1.0.0
SERVER=root@IP_VPS ./deploy/deploy.sh prod v1.0.0       # tag -> prod
SERVER=root@IP_VPS ./deploy/deploy.sh prod --rollback 20250101-120000
```

## 6. Ganti password admin (wajib setelah install)
```bash
HASH=$(htpasswd -bnBC 12 "" 'PASSWORD_BARU' | tr -d ':\n')
# simpan ke /opt/brandingpulse/.env sebagai ADMIN_PASSWORD_HASH, lalu:
sudo -u postgres psql -d brandingpulse -c "UPDATE users SET password='$HASH' WHERE email='admin@brandingpulse.co';"
systemctl restart brandingpulse-api
```
