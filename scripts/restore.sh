#!/bin/bash
# Restore script for Dinamo Rugby platform
# Usage: ./scripts/restore.sh <backup_dir>

set -euo pipefail

APP_DIR="/var/www/rugby-dinamo"

if [ -z "${1:-}" ]; then
  echo "Usage: $0 <backup_directory>"
  echo ""
  echo "Available backups:"
  ls -d /var/www/rugby-dinamo/backups/20* 2>/dev/null | sort -r | head -10
  exit 1
fi

BACKUP_DIR="$1"

if [ ! -d "$BACKUP_DIR" ]; then
  echo "Error: Backup directory not found: $BACKUP_DIR"
  exit 1
fi

echo "[$(date)] Starting restore from: $BACKUP_DIR"
echo "WARNING: This will overwrite the current database and uploads!"
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# Stop the application
echo "  Stopping application..."
pm2 stop rugby-dinamo 2>/dev/null || true

# Restore database
if [ -f "${BACKUP_DIR}/dev.db.gz" ]; then
  echo "  Restoring database..."
  gunzip -c "${BACKUP_DIR}/dev.db.gz" > "${APP_DIR}/prisma/dev.db"
  echo "  Database restored."
fi

# Restore uploads
if [ -f "${BACKUP_DIR}/uploads.tar.gz" ]; then
  echo "  Restoring uploads..."
  tar -xzf "${BACKUP_DIR}/uploads.tar.gz" -C "${APP_DIR}/"
  echo "  Uploads restored."
fi

# Restore public images
if [ -f "${BACKUP_DIR}/public-images.tar.gz" ]; then
  echo "  Restoring public images..."
  tar -xzf "${BACKUP_DIR}/public-images.tar.gz" -C "${APP_DIR}/"
  echo "  Public images restored."
fi

# Restart application
echo "  Starting application..."
pm2 start rugby-dinamo 2>/dev/null || true

echo "[$(date)] Restore complete!"
