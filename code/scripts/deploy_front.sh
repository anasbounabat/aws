#!/bin/bash
# Script deploy front

# 1. Build de l'application Nuxt 3 Frontend User
echo "Installation des dépendances front et build..."
cd ../www-user
npm install
npm run build

# 2. Synchronisation des fichiers statiques vers AWS S3
echo "Envoi sur AWS S3..."
# aws s3 sync .output/public s3://mon-bucket-front-user --delete

# 3. Invalidation du cache CloudFront (optionnel)
echo "Invalidation CloudFront..."
# aws cloudfront create-invalidation --distribution-id MON_ID_CLOUDFRONT --paths "/*"

echo "Déploiement Front terminé !"
