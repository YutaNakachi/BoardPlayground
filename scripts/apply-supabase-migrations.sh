#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "SUPABASE_DB_URL is not set."
  echo "Add it to the Cloud Agent environment secrets (Supabase Dashboard → Connect → URI)."
  exit 1
fi

DB_URL="${SUPABASE_DB_POOLER_URL:-$SUPABASE_DB_URL}"

echo "Applying migrations from supabase/migrations/ ..."
if ! npx --yes supabase@2.58.3 db push --db-url "$DB_URL"; then
  if [[ -z "${SUPABASE_DB_POOLER_URL:-}" && "$SUPABASE_DB_URL" =~ db\.([a-z0-9]+)\.supabase\.co ]]; then
    echo "Direct connection failed; retrying via session pooler (ap-northeast-1) ..."
    POOLER_URL="$(python3 - <<'PY'
import os
from urllib.parse import quote, urlparse, urlunparse

url = os.environ["SUPABASE_DB_URL"]
p = urlparse(url)
ref = p.hostname.split(".")[1]
region = os.environ.get("SUPABASE_DB_POOLER_REGION", "ap-northeast-1")
user = f"postgres.{ref}"
host = f"aws-0-{region}.pooler.supabase.com"
netloc = f"{quote(user, safe='')}:{quote(p.password or '', safe='')}@{host}:5432"
print(urlunparse((p.scheme, netloc, "/postgres", "", "", "")))
PY
)"
    npx --yes supabase@2.58.3 db push --db-url "$POOLER_URL"
  else
    exit 1
  fi
fi

echo "Done."
