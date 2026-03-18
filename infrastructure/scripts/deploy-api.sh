#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

echo "Build API bundle"
(cd code/api && npm run build)

echo "TODO: package bundle into zip"
echo "TODO: aws lambda update-function-code --function-name ${LAMBDA_API_NAME} --zip-file fileb://..."

echo "CloudWatch logs: Lambda automatically writes to /aws/lambda/${LAMBDA_API_NAME}"

