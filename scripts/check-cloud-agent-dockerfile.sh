#!/usr/bin/env bash
set -euo pipefail

DOCKERFILE=".cursor/Dockerfile"

if [[ ! -f "$DOCKERFILE" ]]; then
  echo "[fail] $DOCKERFILE not found"
  exit 1
fi

if ! grep -Eq '(^|[[:space:]])curl([[:space:]]|\\|$)' "$DOCKERFILE"; then
  echo "[fail] $DOCKERFILE must install curl (Cloud Agent install-exec-daemon requires it)"
  exit 1
fi

echo "[ok] cloud-agent Dockerfile includes curl"
