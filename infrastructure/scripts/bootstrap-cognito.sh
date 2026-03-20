#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

require() { [[ -n "${!1:-}" ]] || { echo "$1 is required"; exit 1; }; }
require AWS_REGION
require PROJECT_NAME

POOL_NAME="${PROJECT_NAME}-user-pool-${STAGE}"
CLIENT_NAME="${PROJECT_NAME}-user-pool-client-${STAGE}"

echo "Create Cognito User Pool: ${POOL_NAME}"
USER_POOL_ID="$(aws cognito-idp create-user-pool \
  --region "$AWS_REGION" \
  --pool-name "$POOL_NAME" \
  --auto-verified-attributes email \
  --username-attributes email \
  --policies 'PasswordPolicy={MinimumLength=8,RequireUppercase=true,RequireLowercase=true,RequireNumbers=true,RequireSymbols=false,TemporaryPasswordValidityDays=7}' \
  --query 'UserPool.Id' --output text)"

echo "Create Cognito User Pool Client: ${CLIENT_NAME}"
USER_POOL_CLIENT_ID="$(aws cognito-idp create-user-pool-client \
  --region "$AWS_REGION" \
  --user-pool-id "$USER_POOL_ID" \
  --client-name "$CLIENT_NAME" \
  --generate-secret false \
  --explicit-auth-flows "ALLOW_USER_PASSWORD_AUTH" "ALLOW_REFRESH_TOKEN_AUTH" \
  --supported-identity-providers COGNITO \
  --query 'UserPoolClient.ClientId' --output text)"

echo
echo "=== Save these values (.env / GitLab CI variables) ==="
echo "COGNITO_USER_POOL_ID=${USER_POOL_ID}"
echo "COGNITO_CLIENT_ID=${USER_POOL_CLIENT_ID}"
echo "AWS_REGION=${AWS_REGION}"

