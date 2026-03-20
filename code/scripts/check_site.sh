#!/bin/bash
# Vérifie qu'un site est en ligne et retourne son statut HTTP
# Usage : ./check_site.sh <url>
# Exemple : ./check_site.sh https://admin.example.com

URL="${1:-${ADMIN_URL:-https://admin.example.com}}"

echo "🩺 Vérification du site : $URL"

HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$URL" 2>/dev/null)
[ -z "$HTTP_CODE" ] && HTTP_CODE="000"

case "$HTTP_CODE" in
  200|201|301|302)
    echo "✅ Site en ligne — HTTP $HTTP_CODE"
    exit 0
    ;;
  500|502|503|504)
    echo "❌ Erreur serveur — HTTP $HTTP_CODE"
    echo "   → Vérifier les logs de l'application ou de la Lambda"
    exit 1
    ;;
  000)
    echo "⚠️  Site inaccessible (timeout / hors ligne)"
    echo "   → Vérifier l'URL ou la connectivité réseau"
    exit 1
    ;;
  *)
    echo "⚠️  HTTP $HTTP_CODE — Réponse inattendue"
    exit 1
    ;;
esac
