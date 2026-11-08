#!/usr/bin/env bash
set -euo pipefail

# MODE="secret"
MODE="variable"

# GitHub deployment environment name
ENVIRONMENT="development"

# Path to your .env file
ENV_FILE=".env.development"

# GitHub repository
REPO="finquo/junior"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: env file not found: $ENV_FILE" >&2
  exit 1
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "Error: GitHub CLI (gh) is not installed." >&2
  exit 1
fi

case "$MODE" in
  secret)
    gh secret set \
      --repo "$REPO" \
      --env "$ENVIRONMENT" \
      --env-file "$ENV_FILE"
    ;;
  variable)
    gh variable set \
      --repo "$REPO" \
      --env "$ENVIRONMENT" \
      --env-file "$ENV_FILE"
    ;;
  *)
    echo "Error: MODE must be 'secret' or 'variable'." >&2
    exit 1
    ;;
esac

echo "Synced '$ENV_FILE' to GitHub environment '$ENVIRONMENT' as $MODE(s)."
