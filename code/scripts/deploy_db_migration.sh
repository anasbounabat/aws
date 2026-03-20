#!/bin/bash
# Script de migrations de base de données

echo "Lancement des scripts de migration..."
cd ../crons

# Installer d'abord pour avoir le driver postgres
bun install

# Exécuter le script de migration
echo "Application des schémas SQL..."
# bun run src/migrate.ts
# OU pour l'outil natif psql :
# psql $DATABASE_URL -f path/to/schema.sql

echo "Migrations terminées !"
