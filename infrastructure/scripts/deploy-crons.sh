#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

require() { [[ -n "${!1:-}" ]] || { echo "$1 is required"; exit 1; }; }
require AWS_REGION
require AWS_ACCOUNT_ID
require LAMBDA_CRON_BACKUP_NAME

require DATABASE_URL

echo "Build crons bundle (bun)"
(cd code/crons && bun install && bun run build)

ZIP_PATH="$(mktemp -t cron-backup.XXXXXX.zip)"
trap 'rm -f "$ZIP_PATH"' EXIT

echo "Package zip: $ZIP_PATH"
(cd code/crons/dist && zip -qr "$ZIP_PATH" .)

echo "Deploy Lambda code: ${LAMBDA_CRON_BACKUP_NAME}"
aws lambda update-function-code \
  --function-name "${LAMBDA_CRON_BACKUP_NAME}" \
  --zip-file "fileb://${ZIP_PATH}" \
  --region "${AWS_REGION}"

echo "Configure Cron Lambda environment variables"
BACKUP_S3_BUCKET="${BACKUP_S3_BUCKET:-$BACKUPS_BUCKET}"
if [[ -z "${BACKUP_S3_BUCKET:-}" ]]; then
  echo "BACKUP_S3_BUCKET (or BACKUPS_BUCKET in deploy-env) is required"
  exit 1
fi

aws lambda update-function-configuration \
  --function-name "${LAMBDA_CRON_BACKUP_NAME}" \
  --region "${AWS_REGION}" \
  --environment "Variables={
    DATABASE_URL=${DATABASE_URL},
    AWS_REGION=${AWS_REGION},
    BACKUP_S3_BUCKET=${BACKUP_S3_BUCKET}
  }"

LOG_GROUP="/aws/lambda/${LAMBDA_CRON_BACKUP_NAME}"
echo "Ensure CloudWatch log group: ${LOG_GROUP}"
aws logs create-log-group --log-group-name "${LOG_GROUP}" --region "${AWS_REGION}" >/dev/null 2>&1 || true
aws logs put-retention-policy --log-group-name "${LOG_GROUP}" --retention-in-days 14 --region "${AWS_REGION}"

RULE_NAME="${LAMBDA_CRON_BACKUP_NAME}-hourly"
RULE_ARN="arn:aws:events:${AWS_REGION}:${AWS_ACCOUNT_ID}:rule/${RULE_NAME}"
LAMBDA_ARN="arn:aws:lambda:${AWS_REGION}:${AWS_ACCOUNT_ID}:function:${LAMBDA_CRON_BACKUP_NAME}"

echo "Ensure EventBridge rule: ${RULE_NAME}"
aws events put-rule \
  --name "${RULE_NAME}" \
  --schedule-expression "rate(1 hour)" \
  --state ENABLED \
  --region "${AWS_REGION}" >/dev/null

echo "Attach target"
aws events put-targets \
  --rule "${RULE_NAME}" \
  --targets "Id"="backup","Arn"="${LAMBDA_ARN}" \
  --region "${AWS_REGION}" >/dev/null

echo "Allow EventBridge invoke (idempotent)"
aws lambda add-permission \
  --function-name "${LAMBDA_CRON_BACKUP_NAME}" \
  --statement-id "eventbridge-${RULE_NAME}" \
  --action "lambda:InvokeFunction" \
  --principal events.amazonaws.com \
  --source-arn "${RULE_ARN}" \
  --region "${AWS_REGION}" 2>/dev/null || true

echo "CloudWatch logs: /aws/lambda/${LAMBDA_CRON_BACKUP_NAME}"
echo "Done."

