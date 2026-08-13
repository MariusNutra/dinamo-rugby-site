#!/bin/bash
# Backup script for Dinamo Rugby platform
# Backs up SQLite database + uploads directory
# Usage: ./scripts/backup.sh [backup_dir]

set -euo pipefail

APP_DIR="/var/www/rugby-dinamo"
# Backupurile stau IN AFARA directorului aplicatiei. Cat au stat inauntru,
# `env.bak` (drepturi 600, root) era vazut de tracer-ul de build al Next 16 si
# omora build-ul cu „Permission denied"; pe langa asta, arhive cu secrete in
# arborele aplicatiei web sunt oricum locul gresit.
BACKUP_BASE="${1:-/mnt/HC_Volume_105236627/backups/rugby-dinamo}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE}/${TIMESTAMP}"
RETENTION_DAYS=30

# Offsite replication target (adam server). Keeps backups on a separate
# machine/disk so a primary VPS or disk failure does not lose both the
# database and its backups. Failure here is logged but never aborts the
# local backup.
OFFSITE_HOST="root@78.47.187.31"
OFFSITE_DIR="/root/offsite-backups/dinamo-rugby"
OFFSITE_RETENTION_DAYS=30

echo "[$(date)] Starting backup..."

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup SQLite database (using .backup command for consistency)
echo "  Backing up database..."
sqlite3 "${APP_DIR}/prisma/dev.db" ".backup '${BACKUP_DIR}/dev.db'"

# Compress database backup
gzip "${BACKUP_DIR}/dev.db"
echo "  Database backed up: ${BACKUP_DIR}/dev.db.gz"

# Backup uploads directory if it exists
if [ -d "${APP_DIR}/uploads" ]; then
  echo "  Backing up uploads..."
  tar -czf "${BACKUP_DIR}/uploads.tar.gz" -C "${APP_DIR}" uploads/
  echo "  Uploads backed up: ${BACKUP_DIR}/uploads.tar.gz"
fi

# Backup public images
if [ -d "${APP_DIR}/public/images" ]; then
  echo "  Backing up public images..."
  tar -czf "${BACKUP_DIR}/public-images.tar.gz" -C "${APP_DIR}" public/images/
  echo "  Public images backed up: ${BACKUP_DIR}/public-images.tar.gz"
fi

# Backup .env file
cp "${APP_DIR}/.env" "${BACKUP_DIR}/env.bak"

# Calculate total size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "  Total backup size: ${TOTAL_SIZE}"

# Replicate this backup offsite (best-effort, never aborts the local backup)
echo "  Replicating offsite to ${OFFSITE_HOST}..."
if rsync -az -e "ssh -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new" \
    "${BACKUP_DIR}/" "${OFFSITE_HOST}:${OFFSITE_DIR}/${TIMESTAMP}/" 2>/dev/null; then
  echo "  Offsite replication OK: ${OFFSITE_DIR}/${TIMESTAMP}"
  # Prune old offsite backups
  ssh -o BatchMode=yes -o ConnectTimeout=15 "${OFFSITE_HOST}" \
    "find '${OFFSITE_DIR}' -mindepth 1 -maxdepth 1 -type d -mtime +${OFFSITE_RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true" \
    2>/dev/null || true
else
  echo "  WARNING: offsite replication FAILED — local backup is intact, but offsite copy is stale!"
fi

# Remove old backups (older than RETENTION_DAYS)
echo "  Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_BASE" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

# Count remaining backups
BACKUP_COUNT=$(ls -d "${BACKUP_BASE}"/20* 2>/dev/null | wc -l)
echo "[$(date)] Backup complete. ${BACKUP_COUNT} backups stored."
