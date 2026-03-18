#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

echo "Build crons bundle"
(cd code/crons && npm run build)

echo "TODO: package bundle into zip"
echo "TODO: aws lambda update-function-code --function-name ${LAMBDA_CRON_BACKUP_NAME} --zip-file fileb://..."
echo "TODO: EventBridge rule schedule rate(1 hour)"

echo "CloudWatch logs: Lambda automatically writes to /aws/lambda/${LAMBDA_CRON_BACKUP_NAME}"

