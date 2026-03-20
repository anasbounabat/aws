#!/usr/bin/env bash
set -euo pipefail

# Shared env for deploy scripts.
# Provide STAGE=stg|prd when running scripts.

# Accept both conventions:
# - STAGE=stg|prd
# - ENV=staging|production
: "${AWS_REGION:=eu-west-3}"
: "${ENV:=}"
: "${STAGE:=}"

if [[ -z "${STAGE}" ]]; then
  case "${ENV}" in
    staging) STAGE="stg" ;;
    production) STAGE="prd" ;;
    "") STAGE="stg" ;;
    *)
      echo "Unsupported ENV=${ENV}. Use staging|production or STAGE=stg|prd."
      exit 1
      ;;
  esac
fi

# Infer ENV when only STAGE is provided.
if [[ -z "${ENV}" ]]; then
  case "${STAGE}" in
    stg) ENV="staging" ;;
    prd) ENV="production" ;;
    *)
      echo "Unsupported STAGE=${STAGE}. Use stg|prd."
      exit 1
      ;;
  esac
fi

# Optional: load per-environment file if present.
# Values already exported by shell/CI keep precedence.
ENV_FILE="environments/${ENV}/.env"
if [[ -f "${ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${ENV_FILE}"
fi

# Required (set per project)
: "${AWS_ACCOUNT_ID:=}"
: "${PROJECT_NAME:=project}"

# S3 buckets (accept both old and guide naming)
: "${S3_BUCKET_FRONTEND_USER:=}"
: "${S3_BUCKET_FRONTEND_ADMIN:=}"
: "${S3_BUCKET_ASSETS:=}"
: "${S3_BUCKET_BACKUPS:=}"

: "${USER_BUCKET:=${S3_BUCKET_FRONTEND_USER:-${PROJECT_NAME}-frontend-user-${STAGE}}}"
: "${ADMIN_BUCKET:=${S3_BUCKET_FRONTEND_ADMIN:-${PROJECT_NAME}-frontend-admin-${STAGE}}}"
: "${ASSETS_BUCKET:=${S3_BUCKET_ASSETS:-${PROJECT_NAME}-assets-${STAGE}}}"
: "${BACKUPS_BUCKET:=${S3_BUCKET_BACKUPS:-${PROJECT_NAME}-backups-${STAGE}}}"

# CloudFront distribution IDs (alias support)
: "${CLOUDFRONT_DISTRIBUTION_USER:=}"
: "${CLOUDFRONT_DISTRIBUTION_ADMIN:=}"
: "${CLOUDFRONT_DISTRIBUTION_ASSETS:=}"

: "${CF_USER_DISTRIBUTION_ID:=${CLOUDFRONT_DISTRIBUTION_USER}}"
: "${CF_ADMIN_DISTRIBUTION_ID:=${CLOUDFRONT_DISTRIBUTION_ADMIN}}"
: "${CF_ASSETS_DISTRIBUTION_ID:=${CLOUDFRONT_DISTRIBUTION_ASSETS}}"

# Lambda function names (fill after creation)
: "${LAMBDA_API_NAME:=${PROJECT_NAME}-api-${STAGE}}"
: "${LAMBDA_CRON_BACKUP_NAME:=${PROJECT_NAME}-cron-backup-${STAGE}}"

# API + auth + db
: "${DATABASE_URL:=}"
: "${JWT_SECRET:=change-me}"
: "${JWT_EXPIRES_IN_SECONDS:=604800}"
: "${COGNITO_USER_POOL_ID:=}"
: "${COGNITO_CLIENT_ID:=}"
: "${SES_FROM_EMAIL:=}"

# Optional direct aliases used by frontend docs
: "${NEXT_PUBLIC_API_URL:=}"
: "${NUXT_PUBLIC_API_BASE_URL:=${NEXT_PUBLIC_API_URL}}"

# Cron backup bucket alias
: "${BACKUP_S3_BUCKET:=${S3_BUCKET_BACKUPS:-${BACKUPS_BUCKET}}}"
: "${S3_BUCKET:=${S3_BUCKET_ASSETS:-${ASSETS_BUCKET}}}"

export AWS_REGION ENV STAGE AWS_ACCOUNT_ID PROJECT_NAME
export USER_BUCKET ADMIN_BUCKET ASSETS_BUCKET BACKUPS_BUCKET
export CF_USER_DISTRIBUTION_ID CF_ADMIN_DISTRIBUTION_ID CF_ASSETS_DISTRIBUTION_ID
export LAMBDA_API_NAME LAMBDA_CRON_BACKUP_NAME
export DATABASE_URL JWT_SECRET JWT_EXPIRES_IN_SECONDS
export COGNITO_USER_POOL_ID COGNITO_CLIENT_ID SES_FROM_EMAIL
export S3_BUCKET BACKUP_S3_BUCKET
export NUXT_PUBLIC_API_BASE_URL NEXT_PUBLIC_API_URL

