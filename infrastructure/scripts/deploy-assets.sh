#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

if [[ -z "${CF_ASSETS_DISTRIBUTION_ID}" ]]; then
  echo "CF_ASSETS_DISTRIBUTION_ID is required"
  exit 1
fi

echo "Upload www-assets to S3"
aws s3 sync "code/www-assets" "s3://${ASSETS_BUCKET}/" --exclude "node_modules/*" --exclude "package.json" --exclude "README.md" --delete

echo "Invalidate CloudFront"
aws cloudfront create-invalidation --distribution-id "${CF_ASSETS_DISTRIBUTION_ID}" --paths "/*"

echo "Done."

