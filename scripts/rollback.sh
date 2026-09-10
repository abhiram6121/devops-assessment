#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

if [ ! -f .deploy_state/previous_version ]; then
  echo "Error: No previous version recorded in .deploy_state/previous_version"
  exit 1
fi

ROLLBACK_TAG="$(cat .deploy_state/previous_version)"
echo "Rolling back to: $ROLLBACK_TAG"

IMAGE_TAG="$ROLLBACK_TAG" docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

# Verify health
echo "Verifying health after rollback..."
HEALTHY=0
for i in {1..15}; do
  if curl -sf http://api.debyez.localhost/api/health/full > /dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [ "$HEALTHY" -eq 1 ]; then
  echo "$ROLLBACK_TAG" > .deploy_state/current_version
  echo "Rollback successful: restored $ROLLBACK_TAG"
else
  echo "Critical: Rollback to $ROLLBACK_TAG failed health check"
  exit 1
fi
