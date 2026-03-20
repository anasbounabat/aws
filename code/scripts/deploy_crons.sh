#!/bin/bash
# Script deploy crons

cd ../crons

# 1. Installer les packages bun
echo "1. Installation des packages bun..."
bun install

# 2. Build les lambdas
echo "2. Build de la lambda Crons..."
bun run build

# Préparation du bundle
cd dist
zip -r function.zip .

# 3. Envoyer sur aws
echo "3. Envoi sur AWS Lambda..."
# aws lambda update-function-code \
#   --function-name my-crons-lambda-fonction \
#   --zip-file fileb://function.zip

echo "Déploiement Crons terminé !"
