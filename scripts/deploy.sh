#!/usr/bin/env bash
set -euo pipefail

IMAGE_TAG="${1:-}"
if [ -z "$IMAGE_TAG" ]; then
  echo "Usage: $0 <IMAGE_TAG>"
  exit 1
fi

cd "$(dirname "${BASH_SOURCE[0]}")/.."
mkdir -p .deploy_state
[ -f .env.prod ] || cp .env.prod.example .env.prod

PREV_TAG="$(cat .deploy_state/current_version 2>/dev/null || true)"

echo "Deploying version: $IMAGE_TAG"
IMAGE_TAG="$IMAGE_TAG" docker compose --env-file .env.prod -f docker-compose.prod.yml pull backend frontend
IMAGE_TAG="$IMAGE_TAG" docker compose --env-file .env.prod -f docker-compose.prod.yml up -d

# Verify health
echo "Verifying health..."
HEALTHY=0
for i in {1..15}; do
  if curl -sf http://api.debyez.localhost/api/health/full > /dev/null 2>&1; then
    HEALTHY=1
    break
  fi
  sleep 2
done

if [ "$HEALTHY" -eq 1 ]; then
  [ -n "$PREV_TAG" ] && echo "$PREV_TAG" > .deploy_state/previous_version
  echo "$IMAGE_TAG" > .deploy_state/current_version
  echo "Deployment successful: $IMAGE_TAG"
else
  echo "Health check failed for $IMAGE_TAG"
  if [ -n "$PREV_TAG" ]; then
    echo "Rolling back to $PREV_TAG..."
    ./scripts/rollback.sh
  fi
  exit 1
fi
