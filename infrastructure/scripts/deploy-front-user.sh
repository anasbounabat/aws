#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

if [[ -z "${CF_USER_DISTRIBUTION_ID}" ]]; then
  echo "CF_USER_DISTRIBUTION_ID is required"
  exit 1
fi

echo "Build www-user"
(cd code/www-user && bun install && bun run build)

echo "Upload build output to S3 (user)"
aws s3 sync "code/www-user/.output/public" "s3://${USER_BUCKET}/" --delete

echo "Invalidate CloudFront"
aws cloudfront create-invalidation --distribution-id "${CF_USER_DISTRIBUTION_ID}" --paths "/*"

echo "Done."

