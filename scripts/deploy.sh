#!/bin/bash
# Deploy: build + repornire, cu pasii care altfel se uita.
#
# Doua capcane pe care le acopera scriptul:
#  1. Procesul ruleaza ca root si scrie in .next/cache, deci build-ul rulat de
#     utilizatorul `claude` pica cu EACCES daca nu dam chown inainte.
#  2. Repornirea ar declansa o alerta de „restart neasteptat" pe Telegram —
#     marcajul de deploy tine watcher-ul tacut 10 minute.

set -euo pipefail

APP_DIR="/mnt/HC_Volume_105236627/www/rugby-dinamo"
PM2_NAME="dinamorugby"
DEPLOY_MARKER="/tmp/healthcheck/deploy-in-progress"
HEALTH_URL="https://dinamorugby.ro/api/health"

cd "$APP_DIR"

echo "==> Marchez deploy-ul (alertele de restart tac 10 minute)"
mkdir -p "$(dirname "$DEPLOY_MARKER")"
touch "$DEPLOY_MARKER"

echo "==> Predau .next utilizatorului curent"
sudo chown -R "$(id -un):$(id -gn)" .next 2>/dev/null || true

echo "==> Build"
npm run build

echo "==> Repornesc PM2 ($PM2_NAME, sub PM2_HOME al lui root)"
sudo env PM2_HOME=/root/.pm2 pm2 restart "$PM2_NAME" --update-env

echo "==> Astept sa raspunda"
for i in $(seq 1 20); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$HEALTH_URL" || echo 000)
    if [ "$code" = "200" ]; then
        echo "==> Gata: health 200 dupa ${i} incercari"
        exit 0
    fi
    sleep 2
done

echo "!! Situl nu a raspuns cu 200 in 40 de secunde — verifica:" >&2
echo "   sudo env PM2_HOME=/root/.pm2 pm2 logs $PM2_NAME --err --lines 50" >&2
exit 1
