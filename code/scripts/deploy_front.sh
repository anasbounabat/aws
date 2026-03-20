#!/bin/bash
# Script deploy front — build + sync S3 + vérification santé
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Variables (surchargeables via env)
FRONT_BUCKET="${FRONT_BUCKET:-projet-aws-2026-anas-bounabat}"
CF_DIST_ID="${CF_DIST_ID:-E16KOKACZWPYKT}"
ADMIN_URL="${ADMIN_URL:-https://d232px1lde7bg1.cloudfront.net}"

echo "╔══════════════════════════════════════╗"
echo "║        DEPLOY FRONT (www-user)       ║"
echo "╚══════════════════════════════════════╝"

# 1. Build www-user
echo ""
echo "📦 Build www-user..."
cd "$SCRIPT_DIR/../www-user"
npm install --silent
npm run build

# 2. Sync S3
echo ""
echo "☁️  Sync S3..."
aws s3 sync .output/public s3://$FRONT_BUCKET --delete --region us-east-1

# 3. Invalidation CloudFront
echo ""
echo "🔄 Invalidation CloudFront..."
aws cloudfront create-invalidation --distribution-id $CF_DIST_ID --paths "/*" --output table

# 4. Vérification santé du site admin (toujours up même si front a une erreur)
echo ""
echo "🩺 Vérification santé du site admin..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$ADMIN_URL" 2>/dev/null) || true
[ -z "$HTTP_CODE" ] && HTTP_CODE="000"

if [ "$HTTP_CODE" = "200" ]; then
  echo "   ✅ Admin en ligne — HTTP $HTTP_CODE ($ADMIN_URL)"
elif [ "$HTTP_CODE" = "000" ]; then
  echo "   ⚠️  Admin inaccessible (timeout ou hors ligne) — $ADMIN_URL"
  echo "      → Vérifiez la connectivité réseau ou l'URL dans \$ADMIN_URL"
else
  echo "   ❌ Admin répond HTTP $HTTP_CODE — $ADMIN_URL"
  echo "      → Possible erreur côté serveur, vérifier les logs"
fi

echo ""
echo "✅ Déploiement Front terminé !"
echo "   (en cas d'erreur 500 sur le front déployé, relancez avec : npm run build dans www-user)"
