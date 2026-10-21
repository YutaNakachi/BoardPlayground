#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
# shellcheck source=scripts/load-supabase-db-url-from-env-local.sh
source "$(dirname "$0")/load-supabase-db-url-from-env-local.sh"

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set."
  echo "Add it to .env.local or set in the environment (Connect → Session pooler, port 5432)."
  exit 1
fi

DB_URL="${SUPABASE_DB_POOLER_URL:-$SUPABASE_DB_URL}"

npx --yes supabase@2.58.3 migration list --db-url "$DB_URL"
