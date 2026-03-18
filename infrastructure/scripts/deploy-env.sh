#!/usr/bin/env bash
set -euo pipefail

# Shared env for deploy scripts.
# Provide STAGE=stg|prd when running scripts.

: "${AWS_REGION:=eu-west-1}"
: "${STAGE:=stg}"

# Required (set per project)
: "${AWS_ACCOUNT_ID:=}"
: "${PROJECT_NAME:=aws}"

# S3 buckets
: "${USER_BUCKET:=${PROJECT_NAME}-user-${STAGE}}"
: "${ADMIN_BUCKET:=${PROJECT_NAME}-admin-${STAGE}}"
: "${ASSETS_BUCKET:=${PROJECT_NAME}-assets-${STAGE}}"
: "${BACKUPS_BUCKET:=${PROJECT_NAME}-backups-${STAGE}}"

# CloudFront distribution IDs (fill after creation)
: "${CF_USER_DISTRIBUTION_ID:=}"
: "${CF_ADMIN_DISTRIBUTION_ID:=}"
: "${CF_ASSETS_DISTRIBUTION_ID:=}"

# Lambda function names (fill after creation)
: "${LAMBDA_API_NAME:=${PROJECT_NAME}-api-${STAGE}}"
: "${LAMBDA_CRON_BACKUP_NAME:=${PROJECT_NAME}-cron-backup-${STAGE}}"

export AWS_REGION STAGE AWS_ACCOUNT_ID PROJECT_NAME
export USER_BUCKET ADMIN_BUCKET ASSETS_BUCKET BACKUPS_BUCKET
export CF_USER_DISTRIBUTION_ID CF_ADMIN_DISTRIBUTION_ID CF_ASSETS_DISTRIBUTION_ID
export LAMBDA_API_NAME LAMBDA_CRON_BACKUP_NAME

