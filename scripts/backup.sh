#!/bin/bash
# Backup script for Dinamo Rugby platform
# Backs up SQLite database + uploads directory
# Usage: ./scripts/backup.sh [backup_dir]

set -euo pipefail

APP_DIR="/var/www/rugby-dinamo"
BACKUP_BASE="${1:-/var/www/rugby-dinamo/backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="${BACKUP_BASE}/${TIMESTAMP}"
RETENTION_DAYS=30

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

# Remove old backups (older than RETENTION_DAYS)
echo "  Cleaning backups older than ${RETENTION_DAYS} days..."
find "$BACKUP_BASE" -maxdepth 1 -type d -mtime +${RETENTION_DAYS} -exec rm -rf {} \; 2>/dev/null || true

# Count remaining backups
BACKUP_COUNT=$(ls -d "${BACKUP_BASE}"/20* 2>/dev/null | wc -l)
echo "[$(date)] Backup complete. ${BACKUP_COUNT} backups stored."
