#!/bin/bash
# Script deploy crons — build + zip + envoi Lambda
set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CRONS_DIR="$SCRIPT_DIR/../crons"

echo "╔══════════════════════════════════════╗"
echo "║        DEPLOY CRONS (Lambda)         ║"
echo "╚══════════════════════════════════════╝"

# 1. Install
echo ""
echo "📦 Installation des dépendances..."
cd "$CRONS_DIR"
bun install

# 2. Build
echo ""
echo "🔨 Build de la lambda..."
bun run build
echo "   ✓ dist/ généré"

# 3. Zip
echo ""
echo "🗜️  Création du bundle zip..."
cd "$CRONS_DIR/dist"
zip -r function.zip . -x "*.map"
echo "   ✓ dist/function.zip ($(du -sh function.zip | cut -f1))"

# 4. Envoi Lambda
echo ""
echo "☁️  Envoi sur AWS Lambda..."
LAMBDA_NAME="${LAMBDA_CRONS_FUNCTION:-my-crons-lambda-fonction}"
# aws lambda update-function-code \
#   --function-name "$LAMBDA_NAME" \
#   --zip-file fileb://function.zip
echo "   (simulation) aws lambda update-function-code --function-name $LAMBDA_NAME --zip-file fileb://function.zip"

# 5. Vérification post-déploiement
echo ""
echo "🩺 Vérification de la lambda..."
# aws lambda get-function --function-name "$LAMBDA_NAME" --query 'Configuration.LastModified' --output text
echo "   (simulation) aws lambda get-function --function-name $LAMBDA_NAME"

echo ""
echo "✅ Déploiement Crons terminé !"
echo ""
echo "   Pour tester le backup en local (sans déployer) :"
echo "   ./run_backup_local.sh"
