#!/bin/bash
# Script deploy assets — copie les assets partagés (logo, images) vers les apps front
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ASSETS_DIR="$SCRIPT_DIR/../www-assets"
ADMIN_PUBLIC="$SCRIPT_DIR/../www-admin/public"
USER_PUBLIC="$SCRIPT_DIR/../www-user/public"

echo "╔══════════════════════════════════════╗"
echo "║        DEPLOY ASSETS                 ║"
echo "╚══════════════════════════════════════╝"

# 1. Vérification des assets source
echo ""
echo "📁 Assets source : $ASSETS_DIR/images/"
LOGO="$ASSETS_DIR/images/logo.jpg"
if [ ! -f "$LOGO" ]; then
  echo "❌ Erreur : logo.jpg introuvable dans www-assets/images/"
  exit 1
fi
echo "   ✓ logo.jpg trouvé"

# 2. Copie vers www-admin/public
echo ""
echo "📤 Copie vers www-admin/public..."
mkdir -p "$ADMIN_PUBLIC/images"
cp "$LOGO" "$ADMIN_PUBLIC/images/logo.jpg"
echo "   ✓ $ADMIN_PUBLIC/images/logo.jpg"

# 3. Copie vers www-user/public
echo ""
echo "📤 Copie vers www-user/public..."
mkdir -p "$USER_PUBLIC/images"
cp "$LOGO" "$USER_PUBLIC/images/logo.jpg"
echo "   ✓ $USER_PUBLIC/images/logo.jpg"

# 4. Sync S3 (commenté — activer en prod avec les bonnes variables)
echo ""
echo "☁️  Sync S3..."
# Décommenter et renseigner ASSETS_BUCKET pour le vrai déploiement :
# aws s3 sync "$ASSETS_DIR/images/" "s3://${ASSETS_BUCKET}/assets/images/" --delete
echo "   (simulation) aws s3 sync www-assets/images/ s3://\$ASSETS_BUCKET/assets/images/ --delete"

echo ""
echo "✅ Déploiement Assets terminé !"
echo "   Logo mis à jour dans : www-admin/public/images/ et www-user/public/images/"
