#!/usr/bin/env bash

set -euo pipefail

export MSYS_NO_PATHCONV=1

# Must match the Amplify's SSM log path
# ---- Change these three values ----

ENV_FILE=".env"
APP_ID="d1jtdrl3cxfdu9"
ENVIRONMENT="vinext"

REGION="${AWS_REGION:-$(aws configure get region)}"
SSM_PATH="/amplify/${APP_ID}/${ENVIRONMENT}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found" >&2
  exit 1
fi

if [[ -z "$REGION" ]]; then
  echo "Error: Set AWS_REGION or configure a default AWS region." >&2
  exit 1
fi

count=0

while IFS= read -r line || [[ -n "$line" ]]; do
  # Skip blank lines and comments
  [[ -z "${line//[[:space:]]/}" ]] && continue
  [[ "$line" =~ ^[[:space:]]*# ]] && continue

  key="${line%%=*}"
  value="${line#*=}"

  # Trim whitespace from key
  key="$(echo "$key" | xargs)"

  # Remove optional surrounding quotes from value
  value="${value%\"}"
  value="${value#\"}"
  value="${value%\'}"
  value="${value#\'}"

  [[ -z "$key" ]] && continue

  parameter_name="${SSM_PATH}/${key}"

  aws ssm put-parameter \
    --name "$parameter_name" \
    --value "$value" \
    --type "SecureString" \
    --overwrite \
    --region "$REGION" \
    --no-cli-pager > /dev/null

  echo "Stored: $parameter_name"
  count=$((count + 1))
done < "$ENV_FILE"

echo
echo "Done. Stored $count secret(s) under:"
echo "$SSM_PATH"
