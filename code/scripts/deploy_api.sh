#!/bin/bash
# Script deploy api

cd ../api

# 1. Installer les packages bun
echo "1. Installation des packages bun..."
bun install

# 2. Build les lambdas hono (script dans package.json donné par Hono)
echo "2. Build de la lambda Hono..."
bun run build

# Préparation du bundle pour Lambda
cd dist
zip -r function.zip .

# 3. Envoyer sur aws
echo "3. Envoi sur AWS Lambda..."
aws lambda update-function-code \
  --function-name my-project-api-stg \
  --zip-file fileb://function.zip

echo "Déploiement API terminé !"
