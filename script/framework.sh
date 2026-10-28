#!/usr/bin/env bash

set -euo pipefail

export MSYS_NO_PATHCONV=1

# Must match the Amplify's SSM log path
APP_ID="d1jtdrl3cxfdu9"
ENVIRONMENT="vinext"

REGION="${AWS_REGION:-$(aws configure get region)}"
SSM_PATH="/amplify/${APP_ID}/${ENVIRONMENT}"

# To change the app framework from nextjs to just web
aws amplify update-branch --app-id "$APP_ID" --branch-name "$ENVIRONMENT" --framework 'Web' --region "$REGION"
aws amplify update-app --app-id "$APP_ID" --platform WEB_COMPUTE --region "$REGION"

exit 0
