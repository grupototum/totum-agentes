#!/usr/bin/env bash
# install-cron.sh — instala cron diário do uploads-prune.
# Roda 1x manualmente como root durante deploy. Idempotente.

set -euo pipefail

CRON_FILE=/etc/cron.d/totum-uploads-prune
SCRIPT=/home/totum/totum-agentes/scripts/uploads-prune.sh

cat > "$CRON_FILE" <<EOF
# Totum uploads prune — diário 03:00 UTC
# Instalado por scripts/install-cron.sh
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
MAILTO=""
0 3 * * * root $SCRIPT >/dev/null 2>&1
EOF
chmod 0644 "$CRON_FILE"

# garante log file existe com permissões certas
touch /var/log/totum-uploads-prune.log
chmod 0640 /var/log/totum-uploads-prune.log

# Recarrega cron se ativo
if systemctl is-active --quiet cron; then
  systemctl reload cron || true
fi

# Smoke: roda 1 dry sem dados pra validar
chmod +x "$SCRIPT"
echo "[install-cron] instalado em $CRON_FILE"
echo "[install-cron] roda manualmente pra teste: TTL_DAYS=999 $SCRIPT (não vai apagar nada)"
