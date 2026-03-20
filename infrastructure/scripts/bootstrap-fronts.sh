#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

require() { [[ -n "${!1:-}" ]] || { echo "$1 is required"; exit 1; }; }
require AWS_REGION
require AWS_ACCOUNT_ID
require PROJECT_NAME

ensure_bucket() {
  local bucket="$1"
  if aws s3api head-bucket --bucket "$bucket" 2>/dev/null; then
    echo "Bucket exists: $bucket"
    return
  fi

  echo "Create bucket: $bucket"
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    aws s3api create-bucket --bucket "$bucket" --region "$AWS_REGION" >/dev/null
  else
    aws s3api create-bucket --bucket "$bucket" --region "$AWS_REGION" \
      --create-bucket-configuration "LocationConstraint=${AWS_REGION}" >/dev/null
  fi

  aws s3api put-public-access-block --bucket "$bucket" \
    --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true" >/dev/null
}

ensure_bucket "$USER_BUCKET"
ensure_bucket "$ADMIN_BUCKET"
ensure_bucket "$ASSETS_BUCKET"
ensure_bucket "$BACKUPS_BUCKET"

echo "Create CloudFront Origin Access Identity (OAI)"
OAI_ID="$(aws cloudfront create-cloud-front-origin-access-identity \
  --cloud-front-origin-access-identity-config \
  "CallerReference=${PROJECT_NAME}-${STAGE}-$(date +%s),Comment=${PROJECT_NAME}-${STAGE}-oai" \
  --query 'CloudFrontOriginAccessIdentity.Id' --output text)"

OAI_CANONICAL_USER_ID="$(aws cloudfront get-cloud-front-origin-access-identity \
  --id "$OAI_ID" --query 'CloudFrontOriginAccessIdentity.S3CanonicalUserId' --output text)"

put_bucket_policy_oai() {
  local bucket="$1"
  local policy
  policy="$(python3 - <<PY
import json
bucket = ${bucket!r}
canonical = ${OAI_CANONICAL_USER_ID!r}
print(json.dumps({
  "Version":"2012-10-17",
  "Statement":[{
    "Sid":"AllowCloudFrontOAIRead",
    "Effect":"Allow",
    "Principal":{"CanonicalUser": canonical},
    "Action":["s3:GetObject"],
    "Resource":[f"arn:aws:s3:::{bucket}/*"]
  }]
}))
PY
)"
  aws s3api put-bucket-policy --bucket "$bucket" --policy "$policy" >/dev/null
}

put_bucket_policy_oai "$USER_BUCKET"
put_bucket_policy_oai "$ADMIN_BUCKET"
put_bucket_policy_oai "$ASSETS_BUCKET"

create_distribution_for_bucket() {
  local bucket="$1"
  local comment="$2"

  local origin_id="s3-${bucket}"
  local domain="${bucket}.s3.${AWS_REGION}.amazonaws.com"
  if [[ "$AWS_REGION" == "us-east-1" ]]; then
    domain="${bucket}.s3.amazonaws.com"
  fi

  local cfg
  cfg="$(python3 - <<PY
import json, time
bucket = ${bucket!r}
domain = ${domain!r}
origin_id = ${origin_id!r}
comment = ${comment!r}
oai_id = ${OAI_ID!r}
ref = f"{bucket}-{int(time.time())}"
print(json.dumps({
  "CallerReference": ref,
  "Comment": comment,
  "Enabled": True,
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": origin_id,
      "DomainName": domain,
      "S3OriginConfig": {
        "OriginAccessIdentity": f"origin-access-identity/cloudfront/{oai_id}"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": origin_id,
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 2,
      "Items": ["GET","HEAD"],
      "CachedMethods": { "Quantity": 2, "Items": ["GET","HEAD"] }
    },
    "Compress": True,
    "ForwardedValues": {
      "QueryString": True,
      "Cookies": { "Forward": "none" }
    },
    "MinTTL": 0
  },
  "DefaultRootObject": "index.html",
  "PriceClass": "PriceClass_100"
}))
PY
)"

  aws cloudfront create-distribution --distribution-config "$cfg" \
    --query 'Distribution.Id' --output text
}

echo "Create CloudFront distributions (this can take a few minutes to deploy)"
CF_USER_DISTRIBUTION_ID="$(create_distribution_for_bucket "$USER_BUCKET" "${PROJECT_NAME}-${STAGE}-user")"
CF_ADMIN_DISTRIBUTION_ID="$(create_distribution_for_bucket "$ADMIN_BUCKET" "${PROJECT_NAME}-${STAGE}-admin")"
CF_ASSETS_DISTRIBUTION_ID="$(create_distribution_for_bucket "$ASSETS_BUCKET" "${PROJECT_NAME}-${STAGE}-assets")"

echo
echo "=== Save these values (GitLab CI variables / local env) ==="
echo "CF_USER_DISTRIBUTION_ID=${CF_USER_DISTRIBUTION_ID}"
echo "CF_ADMIN_DISTRIBUTION_ID=${CF_ADMIN_DISTRIBUTION_ID}"
echo "CF_ASSETS_DISTRIBUTION_ID=${CF_ASSETS_DISTRIBUTION_ID}"
echo
echo "Buckets:"
echo "USER_BUCKET=${USER_BUCKET}"
echo "ADMIN_BUCKET=${ADMIN_BUCKET}"
echo "ASSETS_BUCKET=${ASSETS_BUCKET}"
echo "BACKUPS_BUCKET=${BACKUPS_BUCKET}"

