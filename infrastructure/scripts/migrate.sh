#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (set it in environments/<env>/.env or shell vars)"
  exit 1
fi

echo "Applying SQL migrations for ENV=${ENV} STAGE=${STAGE}"
bun infrastructure/scripts/migrate.ts
echo "Migrations applied."
