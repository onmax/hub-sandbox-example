#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${BASE_URL:-}" ]]; then
  echo "BASE_URL is required. Example: BASE_URL=https://your-deploy.vercel.app pnpm smoke"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

endpoints=(
  "/api/health"
  "/api/sandbox"
  "/api/sandbox/features"
)

for endpoint in "${endpoints[@]}"; do
  echo "GET ${BASE_URL}${endpoint}"
  curl -sS -f "${BASE_URL}${endpoint}"
  echo
done
