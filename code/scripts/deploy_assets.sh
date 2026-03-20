#!/bin/bash
# Script deploy assets

echo "Installation et build des assets..."
cd ../www-assets
npm install
npm run build

echo "Envoi sur AWS S3..."
# aws s3 sync .output/public s3://mon-bucket-assets --delete

echo "Déploiement Assets terminé !"
