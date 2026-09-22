#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set."
  echo "Add it to the Cloud Agent environment secrets (Supabase Dashboard → Connect → URI)."
  exit 1
fi

echo "Applying migrations from supabase/migrations/ ..."
npx --yes supabase@2.58.3 db push --db-url "$SUPABASE_DB_URL"

echo "Done."
