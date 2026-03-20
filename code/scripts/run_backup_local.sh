#!/bin/bash
# Lance le cron backup en local (simulation ou réel selon les variables d'env)
# Usage :
#   Simulation (dry-run) : ./run_backup_local.sh
#   Réel               : DATABASE_URL=postgres://... BACKUP_S3_BUCKET=mon-bucket AWS_REGION=eu-north-1 ./run_backup_local.sh

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

if [ "$MISSING" -gt 0 ]; then
  echo ""
  echo "❌ Variables manquantes — lancement en mode DRY-RUN (pas de vraie connexion)"
  echo ""
  echo "   Pour un vrai backup, exporter les variables :"
  echo "   export DATABASE_URL=postgres://user:pass@host:5432/dbname"
  echo "   export BACKUP_S3_BUCKET=mon-bucket-backups"
  echo "   export AWS_REGION=eu-north-1"
  echo "   puis relancer : ./run_backup_local.sh"
  echo ""
  echo "🧪 DRY-RUN : simulation du backup..."
  sleep 1
  TS=$(date -u +"%Y-%m-%dT%H-%M-%SZ")
  echo "   [$(date)] Connexion DB... (simulée)"
  echo "   [$(date)] Comptage tables... users=42, teams=7, projects=15, tasks=134"
  echo "   [$(date)] Upload S3... s3://mon-bucket-backups/backups/backup-${TS}.json"
  echo "   [$(date)] INSERT backups..."
  echo ""
  echo "✅ DRY-RUN terminé — aucune donnée réelle écrite"
  exit 0
fi

# Vrai lancement
echo ""
echo "🚀 Lancement du backup réel..."
cd "$CRONS_DIR"
bun run backup

echo ""
echo "✅ Backup terminé !"
