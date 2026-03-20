#!/bin/bash
# Lance le cron backup en local — toutes les minutes avec timestamp complet
# Usage :
#   DRY-RUN (1 fois)     : bash run_backup_local.sh
#   RÉEL (1 fois)        : DATABASE_URL=postgres://... BACKUP_S3_BUCKET=... AWS_REGION=... bash run_backup_local.sh
#   BOUCLE toutes 60s    : LOOP=1 bash run_backup_local.sh
#   BOUCLE réelle        : LOOP=1 DATABASE_URL=... BACKUP_S3_BUCKET=... AWS_REGION=... bash run_backup_local.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRONS_DIR="$SCRIPT_DIR/../crons"

echo "╔══════════════════════════════════════╗"
echo "║        BACKUP LOCAL (cron)           ║"
echo "╚══════════════════════════════════════╝"
echo ""

# Vérification variables d'env
MISSING=0
for VAR in DATABASE_URL BACKUP_S3_BUCKET AWS_REGION; do
  if [ -z "${!VAR}" ]; then
    echo "   ⚠️  $VAR non définie"
    MISSING=$((MISSING+1))
  else
    echo "   ✓ $VAR = ${!VAR}"
  fi
done

run_once() {
  TS=$(date -u +"%Y-%m-%d %H:%M:%S UTC")
  FILENAME="backup-$(date -u +"%Y-%m-%dT%H-%M-%S").json"
  echo ""
  echo "🕐 [$TS]"

  if [ "$MISSING" -gt 0 ]; then
    echo "   🧪 DRY-RUN"
    echo "   [DB]  Connexion... (simulée)"
    echo "   [DB]  users=42  teams=7  projects=15  tasks=134"
    echo "   [S3]  Upload → s3://mon-bucket-backups/backups/$FILENAME"
    echo "   [DB]  INSERT INTO backups (s3_url)..."
    echo "   ✅ $FILENAME — OK"
  else
    cd "$CRONS_DIR"
    bun run backup
    echo "   ✅ Backup réel terminé"
  fi
}

if [ "${LOOP}" = "1" ]; then
  echo ""
  echo "🔁 Boucle active — backup toutes les 60 secondes (Ctrl+C pour stopper)"
  while true; do
    run_once
    echo "   ⏳ Prochain dans 60s..."
    sleep 60
  done
else
  run_once
fi
