#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

if [[ -z "${CF_ADMIN_DISTRIBUTION_ID}" ]]; then
  echo "CF_ADMIN_DISTRIBUTION_ID is required"
  exit 1
fi

echo "Build www-admin"
(cd code/www-admin && bun install && bun run build)

echo "Upload build output to S3 (admin)"
aws s3 sync "code/www-admin/.output/public" "s3://${ADMIN_BUCKET}/" --delete

echo "Invalidate CloudFront"
aws cloudfront create-invalidation --distribution-id "${CF_ADMIN_DISTRIBUTION_ID}" --paths "/*"

echo "Done."

