#!/usr/bin/env bash
# uploads-prune.sh — limpeza diária de anexos > 30 dias
# Roda como root via cron. Logs em /var/log/totum-uploads-prune.log
# Idempotente. Side-effect: remove arquivos do disco + linhas do DB.

set -euo pipefail

LOG=/var/log/totum-uploads-prune.log
UPLOADS_ROOT=${UPLOADS_ROOT:-/home/totum/totum-agentes/uploads}
TTL_DAYS=${TTL_DAYS:-30}
ORPHAN_TTL_HOURS=${ORPHAN_TTL_HOURS:-1}
PG_CONTAINER=${PG_CONTAINER:-agentes-postgres}
PG_USER=${PG_USER:-postgres}
PG_DB=${PG_DB:-agentes}

ts() { date -u +"%Y-%m-%dT%H:%M:%SZ"; }
log() { echo "[$(ts)] $*" >> "$LOG"; }

log "=== prune start (TTL ${TTL_DAYS}d, orphan ${ORPHAN_TTL_HOURS}h, root ${UPLOADS_ROOT}) ==="

if [ ! -d "$UPLOADS_ROOT" ]; then
  log "uploads root nao existe — nothing to do"
  exit 0
fi

# 1) Deleta orphans no DB (message_id NULL > orphan TTL) — pega arquivos via storage_path
orphan_paths=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA -F'|' -c "
  SELECT id, storage_path
    FROM attachments
   WHERE message_id IS NULL
     AND created_at < now() - interval '${ORPHAN_TTL_HOURS} hours'
" || true)

orphan_count=0
while IFS='|' read -r id sp; do
  [ -z "$id" ] && continue
  abs="${UPLOADS_ROOT}/${sp}"
  rm -f -- "$abs" "${abs}.meta.json"
  docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "DELETE FROM attachments WHERE id='$id'" > /dev/null
  log "orphan removed id=${id} path=${sp}"
  orphan_count=$((orphan_count+1))
done <<< "$orphan_paths"
log "orphan total: $orphan_count"

# 2) Deleta anexos > TTL dias do DB (cascateia se message foi removida)
expired_paths=$(docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -tA -F'|' -c "
  SELECT id, storage_path
    FROM attachments
   WHERE created_at < now() - interval '${TTL_DAYS} days'
" || true)

expired_count=0
while IFS='|' read -r id sp; do
  [ -z "$id" ] && continue
  abs="${UPLOADS_ROOT}/${sp}"
  rm -f -- "$abs" "${abs}.meta.json"
  docker exec "$PG_CONTAINER" psql -U "$PG_USER" -d "$PG_DB" -c "DELETE FROM attachments WHERE id='$id'" > /dev/null
  log "expired removed id=${id} path=${sp}"
  expired_count=$((expired_count+1))
done <<< "$expired_paths"
log "expired total: $expired_count"

# 3) Cleanup de diretorios diários vazios (housekeeping)
find "$UPLOADS_ROOT" -mindepth 2 -maxdepth 2 -type d -empty -delete 2>/dev/null || true
# Dirs de user vazios (todos seus dias sumiram)
find "$UPLOADS_ROOT" -mindepth 1 -maxdepth 1 -type d -empty -delete 2>/dev/null || true

log "=== prune end ==="
exit 0
