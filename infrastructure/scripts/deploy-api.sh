#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

require() { [[ -n "${!1:-}" ]] || { echo "$1 is required"; exit 1; }; }
require AWS_REGION
require LAMBDA_API_NAME

require DATABASE_URL
require JWT_SECRET
require COGNITO_USER_POOL_ID
require COGNITO_CLIENT_ID
require SES_FROM_EMAIL

echo "Build API bundle (bun)"
(cd code/api && bun install && bun run build)

ZIP_PATH="$(mktemp -t api-lambda.XXXXXX.zip)"
trap 'rm -f "$ZIP_PATH"' EXIT

echo "Package zip: $ZIP_PATH"
(cd code/api/dist && zip -qr "$ZIP_PATH" .)

echo "Deploy Lambda code: ${LAMBDA_API_NAME}"
aws lambda update-function-code \
  --function-name "${LAMBDA_API_NAME}" \
  --zip-file "fileb://${ZIP_PATH}" \
  --region "${AWS_REGION}"

echo "Configure Lambda environment variables"
S3_BUCKET="${S3_BUCKET:-$ASSETS_BUCKET}"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-$BACKUPS_BUCKET}"
JWT_EXPIRES_IN_SECONDS="${JWT_EXPIRES_IN_SECONDS:-604800}"

if [[ -z "${S3_BUCKET:-}" ]]; then
  echo "S3_BUCKET (or ASSETS_BUCKET in deploy-env) is required"
  exit 1
fi

if [[ -z "${BACKUP_S3_BUCKET:-}" ]]; then
  echo "BACKUP_S3_BUCKET (or BACKUPS_BUCKET in deploy-env) is required"
  exit 1
fi

aws lambda update-function-configuration \
  --function-name "${LAMBDA_API_NAME}" \
  --region "${AWS_REGION}" \
  --environment "Variables={
    PORT=8787,
    DATABASE_URL=${DATABASE_URL},
    JWT_SECRET=${JWT_SECRET},
    JWT_EXPIRES_IN_SECONDS=${JWT_EXPIRES_IN_SECONDS},
    AWS_REGION=${AWS_REGION},
    S3_BUCKET=${S3_BUCKET},
    COGNITO_USER_POOL_ID=${COGNITO_USER_POOL_ID},
    COGNITO_CLIENT_ID=${COGNITO_CLIENT_ID},
    SES_FROM_EMAIL=${SES_FROM_EMAIL},
    BACKUP_S3_BUCKET=${BACKUP_S3_BUCKET}
  }"

LOG_GROUP="/aws/lambda/${LAMBDA_API_NAME}"
echo "Ensure CloudWatch log group: ${LOG_GROUP}"
aws logs create-log-group --log-group-name "${LOG_GROUP}" --region "${AWS_REGION}" >/dev/null 2>&1 || true
aws logs put-retention-policy --log-group-name "${LOG_GROUP}" --retention-in-days 14 --region "${AWS_REGION}"

echo "CloudWatch logs: /aws/lambda/${LAMBDA_API_NAME}"
echo "Done."

