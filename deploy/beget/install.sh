#!/usr/bin/env bash
# Run ON YOUR Beget Ubuntu 24.04 VPS: sudo bash install.sh your-domain.example
set -euo pipefail
DOMAIN="${1:-}"
if [[ $EUID -ne 0 ]]; then echo "Run as root: sudo bash install.sh DOMAIN" >&2; exit 2; fi
if [[ ! "$DOMAIN" =~ ^[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]$ || "$DOMAIN" == *..* ]]; then
  echo "Specify a plain domain without https://, ports, slash or spaces" >&2; exit 2
fi
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
for file in "$HERE/www/index.html" "$HERE/server/server.mjs" "$HERE/configure.py" "$HERE/plux.nginx.conf" "$HERE/plux.service" "$HERE/plux.env.example"; do
  test -s "$file" || { echo "Missing release resource: $file" >&2; exit 3; }
done
if ! command -v node >/dev/null || ! node -e 'process.exit(Number(process.versions.node.split(".")[0])>=20?0:1)'; then
  echo "First install Node.js 22 LTS on your Beget VPS, then rerun this installer." >&2
  exit 4
fi
echo "Preparing separate /opt/plux service on Beget VPS for $DOMAIN"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq nginx rsync python3 certbot python3-certbot-nginx curl ca-certificates >/dev/null
if ! id -u plux >/dev/null 2>&1; then
  useradd --system --user-group --home-dir /opt/plux --shell /usr/sbin/nologin plux
fi
if [[ -d /opt/plux/www && -f /opt/plux/www/index.html ]]; then
  mkdir -p /var/backups
  tar -czf "/var/backups/plux-before-beget-$(date +%Y%m%d-%H%M%S).tgz" -C /opt plux
fi
install -d -m 755 /opt/plux /opt/plux/www /opt/plux/server
install -d -m 700 /etc/plux
rsync -a --delete "$HERE/www/" /opt/plux/www/
rsync -a --delete --exclude=node_modules "$HERE/server/" /opt/plux/server/
install -m 644 "$HERE/configure.py" /opt/plux/configure.py
python3 /opt/plux/configure.py "https://$DOMAIN"
chown -R plux:plux /opt/plux
if [[ ! -f /etc/plux/plux.env ]]; then
  install -o root -g root -m 600 "$HERE/plux.env.example" /etc/plux/plux.env
fi
chmod 600 /etc/plux/plux.env
su -s /bin/sh -c 'cd /opt/plux/server && npm install --omit=dev --no-audit --no-fund' plux
sed "s|__NODE__|$(command -v node)|g" "$HERE/plux.service" > /etc/systemd/system/plux.service
sed "s|__DOMAIN__|$DOMAIN|g" "$HERE/plux.nginx.conf" > /etc/nginx/sites-available/plux.conf
ln -sfn /etc/nginx/sites-available/plux.conf /etc/nginx/sites-enabled/plux.conf
nginx -t
systemctl daemon-reload
systemctl enable --now plux
systemctl restart plux
systemctl enable --now nginx
systemctl reload nginx
curl -fsS --max-time 5 http://127.0.0.1:8080/api/health || {
  echo "Backend startup failed. Check: journalctl -u plux -n 60" >&2; exit 5;
}
echo
echo "PLUX Beget files and services installed for $DOMAIN."
echo "REQUIRED next steps:"
echo "1. Point the A record of $DOMAIN to this VPS IP."
echo "2. Configure API keys privately: sudo nano /etc/plux/plux.env"
echo "3. Restart backend: sudo systemctl restart plux"
echo "4. After DNS propagates, enable HTTPS: sudo certbot --nginx -d $DOMAIN --redirect"
echo "5. Test https://$DOMAIN, voice, image/video generation before switching mobile apps."
echo "Old Render deployment remains untouched."
