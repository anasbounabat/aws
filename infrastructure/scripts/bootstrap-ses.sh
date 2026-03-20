#!/usr/bin/env bash
set -euo pipefail

source "$(dirname "$0")/deploy-env.sh"

require() { [[ -n "${!1:-}" ]] || { echo "$1 is required"; exit 1; }; }
require AWS_REGION
require SES_FROM_EMAIL

echo "Request SES email identity verification: ${SES_FROM_EMAIL}"
aws ses verify-email-identity --region "$AWS_REGION" --email-address "$SES_FROM_EMAIL" >/dev/null

echo
echo "Check your mailbox and click the verification link."
echo "Then you can send invitations from SES using FROM=${SES_FROM_EMAIL}."

