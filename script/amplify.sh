#!/usr/bin/env bash

set -euo pipefail

ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
export ACCOUNT_ID

aws iam create-role \
  --role-name AmplifySecretsRole \
  --assume-role-policy-document file://amplify-trust.json

envsubst < amplify-permission.json > amplify-permission.rendered.json

aws iam put-role-policy \
  --role-name AmplifySecretsRole \
  --policy-name ReadAmplifySecrets \
  --policy-document file://amplify-permission.rendered.json

rm amplify-permission.rendered.json

echo "Created AmplifySecretsRole"
